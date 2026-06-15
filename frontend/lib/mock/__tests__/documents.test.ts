import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetMockState,
  LINK_FILE_TYPE,
  addDocuments,
  listDocuments,
  updateDocument,
} from '../index'
import type { DocumentDraftFile } from '@/types/database'

beforeEach(() => {
  __resetMockState()
})

const sampleFile = (
  name: string,
  file_type: string,
): DocumentDraftFile => ({ name, file_type, size_label: '100 KB' })

describe('addDocuments — file upload', () => {
  it('adds one document per uploaded file under the chosen category', () => {
    const before = listDocuments().length
    const created = addDocuments({
      category: 'job_descriptions',
      source: 'upload',
      files: [sampleFile('Role_A.pdf', 'pdf'), sampleFile('Role_B.docx', 'DOCX')],
      sharepoint_url: '',
    })

    expect(created).toHaveLength(2)
    expect(listDocuments()).toHaveLength(before + 2)
    // file_type is normalised to lowercase; category is preserved.
    expect(created[0].file_type).toBe('pdf')
    expect(created[1].file_type).toBe('docx')
    expect(created.every((d) => d.category === 'job_descriptions')).toBe(true)
    expect(created.every((d) => d.is_active)).toBe(true)
    expect(created[0].title).toBe('Role_A.pdf')
  })

  it('throws when no files are supplied', () => {
    expect(() =>
      addDocuments({
        category: 'other',
        source: 'upload',
        files: [],
        sharepoint_url: '',
      }),
    ).toThrow(/file/i)
  })
})

describe('addDocuments — SharePoint link', () => {
  it('adds a single LINK document with the URL as file_url', () => {
    const created = addDocuments({
      category: 'other',
      source: 'sharepoint',
      files: [],
      sharepoint_url: '  https://jera.sharepoint.com/doc  ',
      link_name: 'Company Profile 2026',
    })

    expect(created).toHaveLength(1)
    const doc = created[0]
    expect(doc.file_type).toBe(LINK_FILE_TYPE)
    expect(doc.title).toBe('Company Profile 2026')
    // URL is trimmed and stored as the link target, not a download.
    expect(doc.file_url).toBe('https://jera.sharepoint.com/doc')
    expect(doc.file_size_bytes).toBeNull()
  })

  it('falls back to a default title when no link name is given', () => {
    const [doc] = addDocuments({
      category: 'other',
      source: 'sharepoint',
      files: [],
      sharepoint_url: 'https://jera.sharepoint.com/x',
    })
    expect(doc.title).toBe('SharePoint document')
  })

  it('throws when the SharePoint URL is blank', () => {
    expect(() =>
      addDocuments({
        category: 'other',
        source: 'sharepoint',
        files: [],
        sharepoint_url: '   ',
      }),
    ).toThrow(/link/i)
  })
})

describe('updateDocument', () => {
  it('replaces a file document with a new version (same id)', () => {
    const target = listDocuments().find((d) => d.file_type === 'pdf')!
    const updated = updateDocument(target.id, {
      source: 'upload',
      file: sampleFile('Replacement.docx', 'DOCX'),
    })
    expect(updated.id).toBe(target.id)
    expect(updated.file_type).toBe('docx')
    // No document count change — it's an in-place version bump.
    expect(listDocuments().filter((d) => d.id === target.id)).toHaveLength(1)
  })

  it('converts a document to a SharePoint LINK', () => {
    const target = listDocuments()[0]
    const updated = updateDocument(target.id, {
      source: 'sharepoint',
      sharepoint_url: 'https://jera.sharepoint.com/new',
    })
    expect(updated.file_type).toBe(LINK_FILE_TYPE)
    expect(updated.file_url).toBe('https://jera.sharepoint.com/new')
  })

  it('throws on an unknown document id', () => {
    expect(() =>
      updateDocument('doc-does-not-exist', {
        source: 'upload',
        file: sampleFile('x.pdf', 'pdf'),
      }),
    ).toThrow(/unknown/i)
  })
})

describe('__resetMockState', () => {
  it('restores the seeded document library after mutations', () => {
    const original = listDocuments().length
    addDocuments({
      category: 'other',
      source: 'sharepoint',
      files: [],
      sharepoint_url: 'https://jera.sharepoint.com/y',
    })
    expect(listDocuments().length).toBe(original + 1)
    __resetMockState()
    expect(listDocuments().length).toBe(original)
  })
})
