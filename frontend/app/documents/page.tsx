'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Card, EmptyState, useToast } from '@/components/ui'
import type { BadgeColor } from '@/components/ui'
import { listDocuments } from '@/lib/mock'
import type { Document, DocumentCategory } from '@/types/database'

// Humane headings for each DocumentCategory value (matches FEATURE_SPEC.md +
// renderDocLibrary in the prototype). The order here drives section order on
// the page; categories with no active documents are skipped at render time.
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
// docx -> blue, pdf -> red, xlsx/xls -> green, txt -> grey).
const FILE_TYPE_COLORS: Record<string, BadgeColor> = {
  docx: 'blue',
  doc: 'blue',
  pdf: 'red',
  xlsx: 'green',
  xls: 'green',
  txt: 'grey',
}

function fileTypeBadgeColor(fileType: string | null): BadgeColor {
  if (!fileType) return 'grey'
  return FILE_TYPE_COLORS[fileType.toLowerCase()] ?? 'grey'
}

function fileTypeLabel(fileType: string | null): string {
  return (fileType ?? 'file').toUpperCase()
}

export default function DocumentsPage() {
  const { toast } = useToast()
  const documents = listDocuments()

  // Group documents by category, then walk CATEGORY_ORDER so headings render in
  // a stable, intentional order and empty categories drop out.
  const byCategory = documents.reduce<Record<string, Document[]>>((acc, doc) => {
    ;(acc[doc.category] ??= []).push(doc)
    return acc
  }, {})

  const groups = CATEGORY_ORDER.filter(
    (category) => (byCategory[category]?.length ?? 0) > 0,
  ).map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    docs: byCategory[category]!,
  }))

  function handleView(doc: Document) {
    // Mock "viewed" action — no real download/preview in the mock-data phase.
    toast({
      title: `📂 "${doc.title}" opened`,
      message:
        'In the production app this would download or preview the document.',
    })
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Documents"
        title="Document Library"
        subtitle="Company templates, policies, and forms — grouped by category."
      />
      <div className="px-10 py-8">
        {groups.length === 0 ? (
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
                  {group.docs.map((doc) => (
                    <Card key={doc.id} padded={false}>
                      <button
                        type="button"
                        onClick={() => handleView(doc)}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-border-light"
                      >
                        <span
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
                          aria-hidden="true"
                        >
                          <Badge color={fileTypeBadgeColor(doc.file_type)}>
                            {fileTypeLabel(doc.file_type)}
                          </Badge>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-text">
                            {doc.title}
                          </span>
                          {doc.description ? (
                            <span className="mt-1 block text-[11px] text-text-muted">
                              {doc.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex-shrink-0 text-xs text-text-muted">
                          View &rarr;
                        </span>
                      </button>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
