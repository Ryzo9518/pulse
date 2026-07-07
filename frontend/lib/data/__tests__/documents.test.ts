import { describe, it, expect } from 'vitest'

import {
  buildDocumentInsertRows,
  buildDocumentReplacePatch,
} from '../useDocuments'
import { isWriteAllowed } from '../rest-proxy'
import type { DocumentDraftFile } from '@/types/database'

const file = (
  name: string,
  file_type: string,
  size_bytes?: number,
): DocumentDraftFile => ({
  name,
  file_type,
  size_label: '100 KB',
  size_bytes,
})

describe('buildDocumentInsertRows — SharePoint link', () => {
  it('builds a single LINK row whose file_url is the URL', () => {
    const rows = buildDocumentInsertRows(
      {
        category: 'contracts_policies',
        source: 'sharepoint',
        files: [],
        sharepoint_url: ' https://jera.sharepoint.com/doc ',
        link_name: 'Company Profile',
      },
      'emp-1',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      title: 'Company Profile',
      description: null,
      category: 'contracts_policies',
      file_type: 'link',
      file_url: 'https://jera.sharepoint.com/doc',
      file_size_bytes: null,
      uploaded_by: 'emp-1',
    })
  })

  it('falls back to a default title when no display name is given', () => {
    const rows = buildDocumentInsertRows({
      category: 'other',
      source: 'sharepoint',
      files: [],
      sharepoint_url: 'https://jera.sharepoint.com/x',
    })
    expect(rows[0].title).toBe('SharePoint document')
    expect(rows[0].uploaded_by).toBeNull()
  })

  it('throws on an empty SharePoint URL', () => {
    expect(() =>
      buildDocumentInsertRows({
        category: 'other',
        source: 'sharepoint',
        files: [],
        sharepoint_url: '   ',
      }),
    ).toThrow(/SharePoint link/)
  })
})

describe('buildDocumentInsertRows — file upload (metadata only)', () => {
  it('builds one row per captured file with normalised type + size bytes', () => {
    const rows = buildDocumentInsertRows(
      {
        category: 'job_descriptions',
        source: 'upload',
        files: [file('Role_A.pdf', 'PDF', 720_000), file('Role_B.docx', 'docx')],
        sharepoint_url: '',
      },
      'emp-2',
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].title).toBe('Role_A.pdf')
    expect(rows[0].file_type).toBe('pdf') // lowercased
    expect(rows[0].file_size_bytes).toBe(720_000)
    expect(rows[0].file_url).toBeNull() // storage deferred to SharePoint
    expect(rows[1].file_size_bytes).toBeNull()
    expect(rows.every((r) => r.category === 'job_descriptions')).toBe(true)
    expect(rows.every((r) => r.uploaded_by === 'emp-2')).toBe(true)
  })

  it('throws when no files were captured', () => {
    expect(() =>
      buildDocumentInsertRows({
        category: 'other',
        source: 'upload',
        files: [],
        sharepoint_url: '',
      }),
    ).toThrow(/one or more files/)
  })
})

describe('buildDocumentReplacePatch', () => {
  it('converts to a LINK document for a SharePoint replacement', () => {
    expect(
      buildDocumentReplacePatch({
        source: 'sharepoint',
        sharepoint_url: 'https://jera.sharepoint.com/v2',
      }),
    ).toEqual({
      file_type: 'link',
      file_url: 'https://jera.sharepoint.com/v2',
      file_size_bytes: null,
    })
  })

  it('swaps in the replacement file metadata for an upload', () => {
    expect(
      buildDocumentReplacePatch({
        source: 'upload',
        file: file('New_Version.XLSX', 'XLSX', 96_000),
      }),
    ).toEqual({ file_type: 'xlsx', file_url: null, file_size_bytes: 96_000 })
  })

  it('throws on missing URL or missing file', () => {
    expect(() =>
      buildDocumentReplacePatch({ source: 'sharepoint', sharepoint_url: '' }),
    ).toThrow(/SharePoint link/)
    expect(() => buildDocumentReplacePatch({ source: 'upload' })).toThrow(
      /replacement file/,
    )
  })
})

describe('WRITE_ALLOWLIST — documents (WS-6)', () => {
  it('allows admin document writes: POST (add) and PATCH (replace / soft-delete)', () => {
    expect(isWriteAllowed('documents', 'POST')).toBe(true)
    expect(isWriteAllowed('documents', 'PATCH')).toBe(true)
  })

  it('never allows a hard DELETE of a document (contract: soft-delete only)', () => {
    expect(isWriteAllowed('documents', 'DELETE')).toBe(false)
  })

  it('allows acknowledgement upserts via POST only', () => {
    expect(isWriteAllowed('document_acknowledgements', 'POST')).toBe(true)
    expect(isWriteAllowed('document_acknowledgements', 'PATCH')).toBe(false)
    expect(isWriteAllowed('document_acknowledgements', 'DELETE')).toBe(false)
  })
})
