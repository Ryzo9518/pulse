'use client'

import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  useToast,
} from '@/components/ui'
import type { BadgeColor } from '@/components/ui'
import { LINK_FILE_TYPE } from '@/lib/mock'
import { can } from '@/lib/capabilities'
import { useSession } from '@/lib/mock/session'
import { useCurrentEmployee } from '@/lib/data/useCurrentEmployee'
import { useDocuments } from '@/lib/data/useDocuments'
import type {
  Document,
  DocumentCategory,
  DocumentDraftFile,
  DocumentSource,
  UserRole,
} from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

// Humane headings for each DocumentCategory value (matches FEATURE_SPEC.md +
// renderDocLibrary in the prototype). DECISION D5: the build keeps its richer
// 7-category taxonomy — we do NOT reduce to the prototype's 4 categories. New
// documents are added under these same categories. Order here drives section
// order; categories with no active documents are skipped at render time.
const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contracts_policies: 'Contracts & Policies',
  hr_policies: 'HR Policies',
  timesheets_invoicing: 'Timesheets & Invoicing',
  job_descriptions: 'Job Descriptions',
  sops_procedures: 'SOPs & Procedures',
  employee_forms: 'Employee Forms',
  other: 'Other',
}

const CATEGORY_ORDER: DocumentCategory[] = [
  'contracts_policies',
  'hr_policies',
  'timesheets_invoicing',
  'job_descriptions',
  'sops_procedures',
  'employee_forms',
  'other',
]

// File-type badge colour, keyed by lowercased file_type (prototype mapping:
// docx -> blue, pdf -> burgundy/red, xlsx/xls -> green, txt -> grey, link -> teal).
const FILE_TYPE_COLORS: Record<string, BadgeColor> = {
  docx: 'blue',
  doc: 'blue',
  pdf: 'red',
  xlsx: 'green',
  xls: 'green',
  txt: 'grey',
  [LINK_FILE_TYPE]: 'teal',
}

function isLinkDoc(doc: Document): boolean {
  return (doc.file_type ?? '').toLowerCase() === LINK_FILE_TYPE
}

function fileTypeBadgeColor(fileType: string | null): BadgeColor {
  if (!fileType) return 'grey'
  return FILE_TYPE_COLORS[fileType.toLowerCase()] ?? 'grey'
}

function fileTypeLabel(doc: Document): string {
  if (isLinkDoc(doc)) return 'LINK'
  return (doc.file_type ?? 'file').toUpperCase()
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1000))} KB`
}

// Size label: LINK documents show "SharePoint"; files show a rounded KB/MB value.
function sizeLabel(doc: Document): string {
  if (isLinkDoc(doc)) return 'SharePoint'
  const bytes = doc.file_size_bytes
  if (!bytes) return ''
  return formatSize(bytes)
}

// Capture a picked file as draft metadata. The file BYTES are not uploaded yet —
// storage lands with SharePoint (WS-10/B5); we keep name/type/size in the row.
function toDraftFile(file: File): DocumentDraftFile {
  const dot = file.name.lastIndexOf('.')
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : 'file'
  return {
    name: file.name,
    file_type: ext,
    size_label: formatSize(file.size),
    size_bytes: file.size,
  }
}

interface DraftState {
  category: DocumentCategory
  source: DocumentSource
  files: DocumentDraftFile[]
  sharepoint: string
  linkName: string
}

function emptyDraft(category: DocumentCategory = 'contracts_policies'): DraftState {
  return { category, source: 'upload', files: [], sharepoint: '', linkName: '' }
}

export default function DocumentsPage() {
  const { toast } = useToast()

  // Identity: real signed-in employee (live) or the mock persona (mock mode).
  const mockSession = useSession()
  const liveEmployee = useCurrentEmployee()
  const role = LIVE ? liveEmployee.role : mockSession.role
  const employeeId = LIVE ? liveEmployee.id : mockSession.currentEmployee?.id
  const canManage = role ? can(role as UserRole, 'uploadDocuments') : false

  const {
    documents,
    ackedIds,
    loading,
    error,
    add,
    replace,
    remove,
    acknowledge,
  } = useDocuments(employeeId)

  // Modal state. `replaceTarget` distinguishes "Add documents" from "Update".
  const [modalOpen, setModalOpen] = useState(false)
  const [replaceTarget, setReplaceTarget] = useState<Document | null>(null)
  const [draft, setDraft] = useState<DraftState>(() => emptyDraft())
  const [saving, setSaving] = useState(false)
  const [ackPendingId, setAckPendingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Group documents by category, then walk CATEGORY_ORDER so headings render in
  // a stable, intentional order and empty categories drop out.
  const groups = useMemo(() => {
    const byCategory = documents.reduce<Record<string, Document[]>>((acc, doc) => {
      ;(acc[doc.category] ??= []).push(doc)
      return acc
    }, {})
    return CATEGORY_ORDER.filter(
      (category) => (byCategory[category]?.length ?? 0) > 0,
    ).map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      docs: byCategory[category]!,
    }))
  }, [documents])

  function handleOpen(doc: Document) {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank', 'noopener,noreferrer')
      toast({
        title: `🔗 Opening "${doc.title}"`,
        message: 'Opening the document in SharePoint.',
      })
      return
    }
    toast({
      title: `📂 "${doc.title}"`,
      message:
        'This document has no file attached yet — file storage arrives with the SharePoint integration.',
    })
  }

  async function handleAcknowledge(doc: Document) {
    setAckPendingId(doc.id)
    try {
      await acknowledge(doc.id)
      toast({
        title: 'Acknowledged',
        message: `Your acknowledgement of "${doc.title}" was recorded.`,
      })
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not save',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      })
    } finally {
      setAckPendingId(null)
    }
  }

  function openAddModal() {
    setReplaceTarget(null)
    setDraft(emptyDraft())
    setModalOpen(true)
  }

  function openReplaceModal(doc: Document) {
    setReplaceTarget(doc)
    setDraft(emptyDraft(doc.category))
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setReplaceTarget(null)
    setDraft(emptyDraft())
  }

  async function handleDelete(doc: Document) {
    if (
      !window.confirm(
        `Remove "${doc.title}" from the document library? Staff will no longer see it.`,
      )
    ) {
      return
    }
    try {
      await remove(doc.id)
      toast({
        title: 'Document removed',
        message: `"${doc.title}" was removed from the library.`,
      })
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not remove',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      })
    }
  }

  function handleFilesChosen(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).map(toDraftFile)
    if (picked.length) {
      setDraft((d) => {
        // In replace mode only one (the latest) file matters; cap at one.
        const files = replaceTarget ? picked.slice(-1) : [...d.files, ...picked]
        return { ...d, files }
      })
    }
    e.target.value = ''
  }

  function removeFile(index: number) {
    setDraft((d) => ({ ...d, files: d.files.filter((_, i) => i !== index) }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (replaceTarget) {
        await replace(replaceTarget.id, {
          source: draft.source,
          file: draft.source === 'upload' ? draft.files.at(-1) : undefined,
          sharepoint_url:
            draft.source === 'sharepoint' ? draft.sharepoint : undefined,
        })
        toast({
          title: 'Document updated',
          message: `"${replaceTarget.title}" replaced with a new version.`,
        })
      } else {
        const n = await add({
          category: draft.category,
          source: draft.source,
          files: draft.files,
          sharepoint_url: draft.sharepoint,
          link_name: draft.linkName,
        })
        toast({
          title: 'Documents added',
          message: `${n} ${n === 1 ? 'item' : 'items'} added to ${CATEGORY_LABELS[draft.category]}.`,
        })
      }
      closeModal()
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not save',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      })
    } finally {
      setSaving(false)
    }
  }

  const isUpload = draft.source === 'upload'
  const categoryOptions = CATEGORY_ORDER.map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c],
  }))

  return (
    <AppShell>
      <PageHeader
        eyebrow="Documents"
        title="Document Library"
        subtitle="Company templates, policies, and forms — grouped by category."
        actions={
          canManage ? (
            <Button onClick={openAddModal}>+ Add documents</Button>
          ) : undefined
        }
      />
      <div className="px-10 py-8">
        {loading ? (
          <ul
            className="flex flex-col gap-3"
            aria-busy="true"
            aria-label="Loading documents"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="h-[68px] animate-pulse rounded-card border border-surface-border bg-surface-card"
              />
            ))}
          </ul>
        ) : error ? (
          <div
            role="alert"
            className="rounded-card border border-jera-red/30 bg-jera-red/10 px-5 py-4 text-[13px] text-jera-red"
          >
            Couldn’t load documents ({error}). Please refresh, or contact IT if
            it keeps happening.
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No documents yet"
            description="Documents shared with the team will appear here."
          />
        ) : (
          <div className="flex flex-col gap-10">
            {groups.map((group) => (
              <section key={group.category}>
                <div className="mb-3 text-[13px] font-bold uppercase tracking-[1.5px] text-text-muted">
                  {group.label}
                </div>
                <div className="flex flex-col gap-2">
                  {group.docs.map((doc) => {
                    const size = sizeLabel(doc)
                    const acked = ackedIds.has(doc.id)
                    return (
                      <Card key={doc.id} padded={false}>
                        <div className="flex w-full items-center gap-3 px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleOpen(doc)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <span
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
                              aria-hidden="true"
                            >
                              <Badge color={fileTypeBadgeColor(doc.file_type)}>
                                {fileTypeLabel(doc)}
                              </Badge>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold text-text">
                                {doc.title}
                              </span>
                              {doc.description || size ? (
                                <span className="mt-1 block truncate text-[11px] text-text-muted">
                                  {[doc.description, size]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              ) : null}
                            </span>
                          </button>
                          {acked ? (
                            <span className="flex-shrink-0 text-[11px] font-semibold text-jera-teal">
                              Acknowledged ✓
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={ackPendingId === doc.id}
                              onClick={() => handleAcknowledge(doc)}
                              aria-label={`Acknowledge ${doc.title}`}
                            >
                              {ackPendingId === doc.id
                                ? 'Saving…'
                                : 'Acknowledge'}
                            </Button>
                          )}
                          {canManage ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReplaceModal(doc)}
                              >
                                Update
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(doc)}
                                aria-label={`Remove ${doc.title}`}
                                className="text-jera-red hover:text-jera-red"
                              >
                                Remove
                              </Button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleOpen(doc)}
                            className="flex-shrink-0 text-xs text-text-muted"
                          >
                            {isLinkDoc(doc) ? 'Open ↗' : 'View →'}
                          </button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {canManage ? (
        <Modal
          open={modalOpen}
          onClose={closeModal}
          eyebrow="Documents"
          title={replaceTarget ? 'Update document' : 'Add documents'}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? 'Saving…'
                  : replaceTarget
                    ? 'Replace document'
                    : 'Add to library'}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {replaceTarget ? (
              <p className="text-[13px] text-text-secondary">
                Replacing{' '}
                <span className="font-semibold text-text">
                  {replaceTarget.title}
                </span>{' '}
                with a new version.
              </p>
            ) : (
              <Select
                label="Category"
                value={draft.category}
                options={categoryOptions}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    category: e.target.value as DocumentCategory,
                  }))
                }
              />
            )}

            {/* Segmented toggle: file upload vs SharePoint link. */}
            <div>
              <span className="mb-[5px] block text-[13px] font-semibold text-text-secondary">
                Source
              </span>
              <div className="flex gap-2" role="group" aria-label="Document source">
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, source: 'upload' }))}
                  aria-pressed={isUpload}
                  className={`flex-1 rounded-btn border px-3 py-3 text-[13px] font-semibold transition-colors ${
                    isUpload
                      ? 'border-jera-red bg-jera-red/10 text-jera-red'
                      : 'border-surface-border bg-surface-card text-text-secondary hover:bg-surface-border-light'
                  }`}
                >
                  Upload files
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, source: 'sharepoint' }))
                  }
                  aria-pressed={!isUpload}
                  className={`flex-1 rounded-btn border px-3 py-3 text-[13px] font-semibold transition-colors ${
                    !isUpload
                      ? 'border-jera-teal bg-jera-teal/10 text-jera-teal'
                      : 'border-surface-border bg-surface-card text-text-secondary hover:bg-surface-border-light'
                  }`}
                >
                  SharePoint link
                </button>
              </div>
            </div>

            {isUpload ? (
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={!replaceTarget}
                  className="hidden"
                  onChange={handleFilesChosen}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-btn border border-dashed border-surface-border px-4 py-6 text-center text-[13px] text-text-secondary transition-colors hover:bg-surface-border-light"
                >
                  <span className="block font-semibold text-text">
                    {replaceTarget
                      ? 'Click to choose the replacement file'
                      : 'Click to add files'}
                  </span>
                  <span className="mt-1 block text-[11px] text-text-muted">
                    {replaceTarget
                      ? 'PDF, DOCX, XLSX or image — replaces the current version.'
                      : 'Add several — they upload together. PDF, DOCX, XLSX, images.'}
                  </span>
                </button>
                {draft.files.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {draft.files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center gap-3 rounded-btn border border-surface-border px-3 py-2"
                      >
                        <Badge color={fileTypeBadgeColor(f.file_type)}>
                          {f.file_type.toUpperCase()}
                        </Badge>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-text">
                            {f.name}
                          </span>
                          <span className="block text-[11px] text-text-muted">
                            {f.size_label}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="flex-shrink-0 text-[11px] font-semibold text-jera-red hover:underline"
                          aria-label={`Remove ${f.name}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Input
                  label="SharePoint link"
                  type="url"
                  value={draft.sharepoint}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, sharepoint: e.target.value }))
                  }
                  placeholder="https://jera.sharepoint.com/…"
                />
                {!replaceTarget ? (
                  <Input
                    label="Display name (optional)"
                    value={draft.linkName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, linkName: e.target.value }))
                    }
                    placeholder="e.g. Company Profile 2026"
                  />
                ) : null}
              </div>
            )}
          </div>
        </Modal>
      ) : null}
    </AppShell>
  )
}
