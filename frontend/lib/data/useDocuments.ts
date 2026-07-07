'use client'

// Documents data controller (WS-6). Behind NEXT_PUBLIC_PULSE_DATA=live it reads
// the active document library + the signed-in user's acknowledgements via the
// authenticated proxy, and writes back through it:
//   - add / replace (admin, RLS `doc_admin`): document METADATA only — the file
//     itself is deferred to SharePoint (WS-10/B5); we store the link/filename.
//   - remove (admin): SOFT delete via is_active=false (contract §3.H — a
//     document row is never hard-deleted).
//   - acknowledge (self or admin, RLS `docack_self`): upsert into
//     document_acknowledgements (contract L3).
// Otherwise it delegates to the mock seam, preserving current behaviour. The
// shapes match what the Documents screen already consumes.
import { useCallback, useEffect, useState } from 'react'

import {
  LINK_FILE_TYPE,
  addDocuments as mockAddDocuments,
  deleteDocument as mockDeleteDocument,
  listDocuments as mockListDocuments,
  updateDocument as mockUpdateDocument,
} from '@/lib/mock'
import type {
  AddDocumentsInput,
  Document,
  UpdateDocumentInput,
} from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

/** Row shape POSTed to /api/rest/documents (PostgREST insert). */
export interface DocumentInsertRow {
  title: string
  description: string | null
  category: string
  file_type: string
  file_url: string | null
  file_size_bytes: number | null
  uploaded_by: string | null
}

/** Fields PATCHed onto an existing document row when replacing its version. */
export interface DocumentReplacePatch {
  file_type: string
  file_url: string | null
  file_size_bytes: number | null
}

/**
 * Build the PostgREST insert rows for an Add-documents draft. Mirrors the mock
 * `addDocuments` semantics: 'sharepoint' → one LINK row whose file_url is the
 * URL; 'upload' → one row per captured file (metadata only — storage lands with
 * SharePoint in WS-10). Throws on empty/invalid input so the screen can toast.
 * Exported for unit tests.
 */
export function buildDocumentInsertRows(
  input: AddDocumentsInput,
  uploadedBy?: string,
): DocumentInsertRow[] {
  if (input.source === 'sharepoint') {
    const url = input.sharepoint_url.trim()
    if (!url) throw new Error('A SharePoint link is required.')
    return [
      {
        title: input.link_name?.trim() || 'SharePoint document',
        description: null,
        category: input.category,
        file_type: LINK_FILE_TYPE,
        file_url: url,
        file_size_bytes: null,
        uploaded_by: uploadedBy ?? null,
      },
    ]
  }
  if (!input.files.length) throw new Error('Add one or more files to upload.')
  return input.files.map((file) => ({
    title: file.name,
    description: null,
    category: input.category,
    file_type: file.file_type.toLowerCase(),
    file_url: null,
    file_size_bytes: file.size_bytes ?? null,
    uploaded_by: uploadedBy ?? null,
  }))
}

/**
 * Build the PATCH body that replaces a document's version in place (same
 * id/category/title). Throws on invalid input. Exported for unit tests.
 */
export function buildDocumentReplacePatch(
  input: UpdateDocumentInput,
): DocumentReplacePatch {
  if (input.source === 'sharepoint') {
    const url = input.sharepoint_url?.trim()
    if (!url) throw new Error('A SharePoint link is required.')
    return { file_type: LINK_FILE_TYPE, file_url: url, file_size_bytes: null }
  }
  if (!input.file) throw new Error('Add the replacement file.')
  return {
    file_type: input.file.file_type.toLowerCase(),
    file_url: null,
    file_size_bytes: input.file.size_bytes ?? null,
  }
}

interface AckRow {
  document_id: string
}

export interface DocumentsController {
  /** Active documents (soft-deleted rows are excluded for every role). */
  documents: Document[]
  /** Document ids the signed-in employee has acknowledged. */
  ackedIds: ReadonlySet<string>
  loading: boolean
  error: string | null
  /** Add documents (admin). Resolves to how many were created. */
  add: (input: AddDocumentsInput) => Promise<number>
  /** Replace an existing document's version in place (admin). */
  replace: (documentId: string, input: UpdateDocumentInput) => Promise<void>
  /** Soft-delete: set is_active=false (admin). Never a hard DELETE. */
  remove: (documentId: string) => Promise<void>
  /** Record the signed-in employee's acknowledgement (upsert, idempotent). */
  acknowledge: (documentId: string) => Promise<void>
  /** Force a re-read. */
  reload: () => void
}

async function expectOk(res: Response, what: string): Promise<void> {
  if (!res.ok) throw new Error(`Could not save ${what} (${res.status})`)
}

export function useDocuments(employeeId?: string): DocumentsController {
  const [tick, setTick] = useState(0)
  // Mock-mode acknowledgements live in component state (the mock seam has no
  // document-ack store); live mode reads/writes document_acknowledgements.
  const [mockAcks, setMockAcks] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )
  const [live, setLive] = useState<{
    documents: Document[]
    ackedIds: ReadonlySet<string>
    loading: boolean
    error: string | null
  }>(() => ({
    documents: [],
    ackedIds: new Set<string>(),
    loading: LIVE,
    error: null,
  }))

  useEffect(() => {
    if (!LIVE) return
    let active = true
    setLive((s) => ({ ...s, loading: true, error: null }))
    Promise.all([
      fetch('/api/rest/documents?is_active=eq.true&order=created_at.asc', {
        cache: 'no-store',
      }).then((r) => {
        if (!r.ok) throw new Error(`documents (${r.status})`)
        return r.json() as Promise<Document[]>
      }),
      // RLS `docack_self` lets an admin read everyone's acks, so scope the
      // query to the signed-in employee explicitly.
      employeeId
        ? fetch(
            `/api/rest/document_acknowledgements?select=document_id&employee_id=eq.${employeeId}`,
            { cache: 'no-store' },
          ).then((r) => {
            if (!r.ok) throw new Error(`acknowledgements (${r.status})`)
            return r.json() as Promise<AckRow[]>
          })
        : Promise.resolve<AckRow[]>([]),
    ])
      .then(([documents, acks]) => {
        if (!active) return
        setLive({
          documents,
          ackedIds: new Set(acks.map((a) => a.document_id)),
          loading: false,
          error: null,
        })
      })
      .catch((e: unknown) => {
        if (active) {
          setLive((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load',
          }))
        }
      })
    return () => {
      active = false
    }
  }, [tick, employeeId])

  const add = useCallback(
    async (input: AddDocumentsInput): Promise<number> => {
      if (!LIVE) {
        const created = mockAddDocuments(input)
        setTick((t) => t + 1)
        return created.length
      }
      const rows = buildDocumentInsertRows(input, employeeId)
      const res = await fetch('/api/rest/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(rows),
      })
      await expectOk(res, 'the documents')
      setTick((t) => t + 1)
      return rows.length
    },
    [employeeId],
  )

  const replace = useCallback(
    async (documentId: string, input: UpdateDocumentInput): Promise<void> => {
      if (!LIVE) {
        mockUpdateDocument(documentId, input)
        setTick((t) => t + 1)
        return
      }
      const patch = buildDocumentReplacePatch(input)
      const res = await fetch(`/api/rest/documents?id=eq.${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(patch),
      })
      await expectOk(res, 'the document')
      setTick((t) => t + 1)
    },
    [],
  )

  const remove = useCallback(async (documentId: string): Promise<void> => {
    if (!LIVE) {
      mockDeleteDocument(documentId)
      setTick((t) => t + 1)
      return
    }
    // Contract §3.H: removal is a soft delete — the row is retained for audit.
    const res = await fetch(`/api/rest/documents?id=eq.${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ is_active: false }),
    })
    await expectOk(res, 'the removal')
    setTick((t) => t + 1)
  }, [])

  const acknowledge = useCallback(
    async (documentId: string): Promise<void> => {
      if (!LIVE) {
        setMockAcks((prev) => {
          const next = new Set(prev)
          next.add(documentId)
          return next
        })
        return
      }
      if (!employeeId) throw new Error('Not signed in')
      const res = await fetch(
        '/api/rest/document_acknowledgements?on_conflict=document_id,employee_id',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            document_id: documentId,
            employee_id: employeeId,
          }),
        },
      )
      await expectOk(res, 'the acknowledgement')
      setTick((t) => t + 1)
    },
    [employeeId],
  )

  const reload = useCallback(() => setTick((t) => t + 1), [])

  if (LIVE) {
    return {
      documents: live.documents,
      ackedIds: live.ackedIds,
      loading: live.loading,
      error: live.error,
      add,
      replace,
      remove,
      acknowledge,
      reload,
    }
  }

  // Mock mode: re-read the (mutable) mock seam on each tick.
  void tick
  return {
    documents: mockListDocuments(),
    ackedIds: mockAcks,
    loading: false,
    error: null,
    add,
    replace,
    remove,
    acknowledge,
    reload,
  }
}
