'use client'

// ── Certifications ───────────────────────────────────────────────────────────
// Product + qualification certificates with expiry tracking and tender tooling.
// Role-scoped (HANDOFF §2/§3):
//  • Employee — sees only their own certs.
//  • Manager  — sees their team's certs (manager_id) + tender export.
//  • Admin    — sees all certs, can upload/edit any, and gets the tender tools.
// Mock-data phase: all reads/writes go through the '@/lib/mock' accessor seam.

import { useMemo, useReducer, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  StatCard,
  StatCardGrid,
  useToast,
  type BadgeColor,
} from '@/components/ui'
import { can } from '@/lib/capabilities'
import { useSession } from '@/lib/mock/session'
import {
  CERT_VENDORS,
  NQF_LEVELS,
  certExpiryInfo,
  deleteCertification,
  formatCertDate,
  getEmployee,
  listCertifications,
  listEmployees,
  needsRecert,
  productsForOrg,
  saveCertification,
  sortCertsByUrgency,
  type CertificationInput,
} from '@/lib/mock'
import type {
  CertClass,
  CertExpiryState,
  CertVendor,
  Certification,
} from '@/types/database'

// ── Presentation maps ─────────────────────────────────────────────────────────

const VENDOR_ICON: Record<CertVendor, string> = {
  Sage: '🟢',
  Nectari: '🔷',
  Microsoft: '🟦',
  Yooz: '🟠',
  AWS: '🟧',
  Other: '📄',
}

const EXPIRY_BADGE: Record<CertExpiryState, BadgeColor> = {
  expired: 'red',
  soon: 'amber',
  valid: 'green',
  none: 'green',
}

type FilterKey = 'all' | 'product' | 'graduate' | 'expiring'

type DraftState = {
  id: string | null
  employee_id: string
  cclass: CertClass
  vendor: CertVendor
  product: string
  name: string
  nqf_level: string
  issued: string
  expiry: string
  file_ref: string
}

function nameFor(employeeId: string): string {
  return getEmployee(employeeId)?.display_name ?? 'Unknown'
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const { role, currentEmployee } = useSession()
  const { toast } = useToast()
  const [, forceRender] = useReducer((n: number) => n + 1, 0)

  const isStaff = role === 'admin' || role === 'manager'
  const canManage = can(role, 'uploadCertificates') // admin: manage anyone's certs
  const canUploadOwn = can(role, 'uploadOwnCertificates') // every role: own certs

  const [filter, setFilter] = useState<FilterKey>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [draft, setDraft] = useState<DraftState | null>(null)

  const employeeId = currentEmployee?.id ?? ''

  // Role-scoped read through the seam. Manager scopes by their own id (manager_id
  // of the team); employee scopes to self; admin sees all.
  const scoped = useMemo(
    () =>
      currentEmployee
        ? listCertifications(role, employeeId, employeeId)
        : [],
    // forceRender bumps after every mutation so the list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, employeeId, currentEmployee],
  )

  if (!currentEmployee) {
    return (
      <AppShell>
        <PageHeader eyebrow="Development" title="Certifications" />
        <div className="px-10 py-8">
          <EmptyState icon="🔒" title="Not signed in" description="Sign in to view certificates." />
        </div>
      </AppShell>
    )
  }

  // ── Derived stats (over the scoped set, independent of filters) ──
  const productCerts = scoped.filter((c) => c.cclass === 'product')
  const gradCerts = scoped.filter((c) => c.cclass === 'graduate')
  const expiringCount = productCerts.filter((c) => needsRecert(c)).length

  // ── Filtered + sorted cards ──
  const visible = scoped.filter((c) => {
    if (filter === 'product' && c.cclass !== 'product') return false
    if (filter === 'graduate' && c.cclass !== 'graduate') return false
    if (filter === 'expiring' && !needsRecert(c)) return false
    if (isStaff && vendorFilter !== 'all' && c.vendor !== vendorFilter) return false
    if (isStaff && productFilter !== 'all' && c.product !== productFilter) return false
    return true
  })
  const cards = sortCertsByUrgency(visible)

  // ── Tender filter option sets (cascading org → product) ──
  const vendorsPresent = Array.from(
    new Set(productCerts.map((c) => c.vendor).filter(Boolean) as string[]),
  ).sort()
  const productScope =
    vendorFilter === 'all'
      ? productCerts
      : productCerts.filter((c) => c.vendor === vendorFilter)
  const productsPresent = Array.from(
    new Set(productScope.map((c) => c.product).filter(Boolean) as string[]),
  ).sort()

  const selectedIds = cards.filter((c) => selected[c.id]).map((c) => c.id)
  const selCount = selectedIds.length

  // ── Mutation handlers ──
  function openEditor(cert?: Certification) {
    if (cert) {
      setDraft({
        id: cert.id,
        employee_id: cert.employee_id,
        cclass: cert.cclass,
        vendor: (cert.vendor ?? 'Sage') as CertVendor,
        product: cert.product ?? productsForOrg(cert.vendor ?? 'Sage')[0] ?? '',
        name: cert.name,
        nqf_level: cert.nqf_level ?? NQF_LEVELS[3],
        issued: cert.issued ?? '',
        expiry: cert.expiry ?? '',
        file_ref: cert.file_ref ?? '',
      })
      return
    }
    // New: admin can pick anyone; non-admin is locked to self.
    setDraft({
      id: null,
      employee_id: canManage ? '' : employeeId,
      cclass: 'product',
      vendor: 'Sage',
      product: productsForOrg('Sage')[0] ?? '',
      name: '',
      nqf_level: NQF_LEVELS[3],
      issued: '',
      expiry: '',
      file_ref: '',
    })
  }

  function handleSave() {
    if (!draft) return
    if (!draft.name.trim()) {
      toast({ title: 'Name required', message: 'Enter the certification / qualification name.', variant: 'error' })
      return
    }
    if (!draft.employee_id) {
      toast({ title: 'Person required', message: 'Select who this certificate belongs to.', variant: 'error' })
      return
    }
    const input: CertificationInput = {
      // Non-admins can only ever file a certificate against themselves — never
      // another person — regardless of what the draft holds.
      employee_id: canManage ? draft.employee_id : employeeId,
      cclass: draft.cclass,
      vendor: draft.vendor,
      product: draft.product,
      name: draft.name,
      nqf_level: draft.nqf_level,
      issued: draft.issued,
      expiry: draft.expiry,
      file_ref: draft.file_ref,
    }
    const isNew = !draft.id
    const saved = saveCertification(input, draft.id)
    setDraft(null)
    forceRender()
    toast({
      title: isNew ? 'Certificate uploaded' : 'Certificate updated',
      message: `${saved.name} ${isNew ? 'added for' : 'saved for'} ${nameFor(saved.employee_id)}.`,
      variant: 'success',
    })
  }

  function handleDelete() {
    if (!draft?.id) return
    deleteCertification(draft.id)
    setDraft(null)
    forceRender()
    toast({ title: 'Certificate removed', message: 'The certificate was deleted.' })
  }

  // ── Tender download stubs ──
  function downloadAll() {
    if (!cards.length) {
      toast({ title: 'Nothing to download', message: 'No certificates match these filters.', variant: 'error' })
      return
    }
    const parts: string[] = []
    if (vendorFilter !== 'all') parts.push(vendorFilter)
    if (productFilter !== 'all') parts.push(productFilter)
    const scope = parts.length ? parts.join(' · ') : 'all certificates'
    toast({ title: 'Preparing tender pack', message: `Bundling ${cards.length} certificates (${scope}) into a ZIP…` })
  }

  function downloadSelected() {
    if (!selCount) return
    toast({
      title: 'Preparing tender pack',
      message: `Bundling ${selCount} selected ${selCount === 1 ? 'certificate' : 'certificates'} into a ZIP…`,
    })
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = { ...s }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })
  }

  // ── Filter segmented control ──
  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'product', label: 'Product' },
    { key: 'graduate', label: 'Qualifications' },
    { key: 'expiring', label: `Expiring (${expiringCount})` },
  ]

  return (
    <AppShell>
      <PageHeader
        eyebrow="Development"
        title="Certifications"
        subtitle="Product & qualification certificates — uploaded, verified and tracked for expiry"
        actions={
          canUploadOwn ? (
            <Button onClick={() => openEditor()} leftIcon={<span aria-hidden>＋</span>}>
              Upload certificate
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6 px-10 py-8">
        {/* Stat cards */}
        <StatCardGrid>
          <StatCard value={scoped.length} label="Total certificates" accent="red" />
          <StatCard value={productCerts.length} label="Product certs" accent="blue" />
          <StatCard value={gradCerts.length} label="Qualifications" accent="pink" />
          <StatCard value={expiringCount} label="Need recertification" accent="amber" />
        </StatCardGrid>

        {/* Filter segmented control */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap gap-1 rounded-btn border border-surface-border bg-surface p-1">
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  className={`whitespace-nowrap rounded-[7px] px-[15px] py-2 font-display text-[12.5px] font-semibold transition-all ${
                    active
                      ? 'bg-surface-card text-jera-red shadow-card'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Admin / manager tender tools */}
        {isStaff ? (
          <Card title="Tender tools">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  label="Organisation"
                  value={vendorFilter}
                  onChange={(e) => {
                    setVendorFilter(e.target.value)
                    setProductFilter('all')
                  }}
                  options={[
                    { value: 'all', label: 'All organisations' },
                    ...vendorsPresent.map((v) => ({ value: v, label: v })),
                  ]}
                />
                <Select
                  label="Product"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All products' },
                    ...productsPresent.map((v) => ({ value: v, label: v })),
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(Object.fromEntries(cards.map((c) => [c.id, true])))}
                  disabled={cards.length === 0}
                >
                  Select all shown
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected({})}
                  disabled={selCount === 0}
                >
                  Clear
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadSelected}
                  disabled={selCount === 0}
                >
                  Download selected ({selCount})
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadAll}>
                  ⬇ Download all ({cards.length})
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Cert cards grid */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              icon="🏅"
              title={scoped.length === 0 ? 'No certificates yet' : 'No certificates'}
              description={
                scoped.length === 0
                  ? canUploadOwn
                    ? 'Add your product and qualification certificates here to track them and their expiry.'
                    : 'No certificates are on file yet.'
                  : filter === 'expiring'
                    ? 'Nothing is expiring or expired right now.'
                    : 'No certificates match the current filters.'
              }
            />
            {scoped.length === 0 && canUploadOwn ? (
              <Button onClick={() => openEditor()} leftIcon={<span aria-hidden>＋</span>}>
                Upload your first certificate
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[680px]:grid-cols-2 min-[1100px]:grid-cols-3">
            {cards.map((c) => (
              <CertCard
                key={c.id}
                cert={c}
                selectable={isStaff}
                selected={!!selected[c.id]}
                canEdit={canManage || c.employee_id === employeeId}
                onSelect={() => toggleSelect(c.id)}
                onEdit={() => openEditor(c)}
                onView={() =>
                  toast({ title: 'Opening certificate', message: `${c.file_ref} — download starting.` })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload / edit modal */}
      {draft ? (
        <CertEditor
          draft={draft}
          setDraft={setDraft}
          canPickPerson={canManage}
          onClose={() => setDraft(null)}
          onSave={handleSave}
          onDelete={draft.id ? handleDelete : undefined}
        />
      ) : null}
    </AppShell>
  )
}

// ── Cert card ─────────────────────────────────────────────────────────────────

function CertCard({
  cert,
  selectable,
  selected,
  canEdit,
  onSelect,
  onEdit,
  onView,
}: {
  cert: Certification
  selectable: boolean
  selected: boolean
  canEdit: boolean
  onSelect: () => void
  onEdit: () => void
  onView: () => void
}) {
  const exp = certExpiryInfo(cert.expiry)
  const isProduct = cert.cclass === 'product'
  const kindIcon = isProduct ? VENDOR_ICON[(cert.vendor ?? 'Other') as CertVendor] : '🎓'
  const kindLabel = isProduct ? cert.vendor ?? 'Product' : 'Qualification'
  const meta = isProduct
    ? `${cert.product ?? cert.vendor ?? 'Product'} · Issued ${formatCertDate(cert.issued)}`
    : `${cert.nqf_level ?? ''} · ${formatCertDate(cert.issued)}`

  return (
    <Card
      className={`flex flex-col gap-3 ${selected ? 'ring-2 ring-jera-red/60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {selectable ? (
          <button
            type="button"
            onClick={onSelect}
            role="checkbox"
            aria-checked={selected}
            aria-label={selected ? 'Deselect certificate' : 'Select certificate'}
            className={`mt-[2px] flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[6px] border text-[12px] font-bold transition-all ${
              selected
                ? 'border-jera-red bg-jera-red text-white'
                : 'border-surface-border bg-white text-transparent'
            }`}
          >
            ✓
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="text-lg leading-none" aria-hidden>
            {kindIcon}
          </span>
          <div className="min-w-0 flex-1">
            <Badge color={isProduct ? 'blue' : 'pink'}>{kindLabel}</Badge>
            <h3 className="mt-[6px] truncate text-[15px] font-bold text-text" title={cert.name}>
              {cert.name}
            </h3>
            <p className="mt-px truncate text-[12px] text-text-muted">{meta}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Avatar name={nameFor(cert.employee_id)} size="sm" />
        <span className="truncate text-[12.5px] font-medium text-text-secondary">
          {nameFor(cert.employee_id)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-surface-border pt-3">
        <Badge color={EXPIRY_BADGE[exp.state]}>{exp.label}</Badge>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onView}>
            View
          </Button>
          {canEdit ? (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

// ── Upload / edit modal ───────────────────────────────────────────────────────

function CertEditor({
  draft,
  setDraft,
  canPickPerson,
  onClose,
  onSave,
  onDelete,
}: {
  draft: DraftState
  setDraft: (next: DraftState) => void
  canPickPerson: boolean
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
}) {
  const people = listEmployees()
  const isProduct = draft.cclass === 'product'
  const set = (patch: Partial<DraftState>) => setDraft({ ...draft, ...patch })

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Certifications"
      title={draft.id ? 'Edit certificate' : 'Upload certificate'}
      footer={
        <>
          {onDelete ? (
            <Button variant="danger" onClick={onDelete} className="mr-auto">
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Class toggle */}
        <div className="flex gap-2">
          {(['product', 'graduate'] as CertClass[]).map((cls) => {
            const on = draft.cclass === cls
            return (
              <button
                key={cls}
                type="button"
                onClick={() => set({ cclass: cls })}
                aria-pressed={on}
                className={`flex flex-1 flex-col items-center gap-1 rounded-btn border p-3 font-display text-[13px] font-semibold transition-all ${
                  on
                    ? 'border-jera-red bg-jera-red/10 text-jera-red'
                    : 'border-surface-border bg-white text-text-secondary hover:border-surface-border'
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {cls === 'product' ? '🏅' : '🎓'}
                </span>
                {cls === 'product' ? 'Product cert' : 'Qualification'}
              </button>
            )
          })}
        </div>

        {/* Person */}
        {canPickPerson ? (
          <Select
            label="Person"
            value={draft.employee_id}
            placeholder="Select a person…"
            onChange={(e) => set({ employee_id: e.target.value })}
            options={people.map((p) => ({ value: p.id, label: p.display_name }))}
          />
        ) : (
          <Input label="Person" value={nameFor(draft.employee_id)} disabled />
        )}

        <Input
          label="Certificate name"
          value={draft.name}
          placeholder="e.g. Sage X3 Implementation Consultant"
          onChange={(e) => set({ name: e.target.value })}
        />

        {isProduct ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Organisation"
                value={draft.vendor}
                onChange={(e) => {
                  const vendor = e.target.value as CertVendor
                  set({ vendor, product: productsForOrg(vendor)[0] ?? '' })
                }}
                options={CERT_VENDORS.map((v) => ({ value: v, label: v }))}
              />
              <Select
                label="Product"
                value={draft.product}
                onChange={(e) => set({ product: e.target.value })}
                options={productsForOrg(draft.vendor).map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Issued"
                type="date"
                value={draft.issued}
                onChange={(e) => set({ issued: e.target.value })}
              />
              <Input
                label="Expiry"
                type="date"
                value={draft.expiry}
                onChange={(e) => set({ expiry: e.target.value })}
                hint="Leave blank for certs that do not expire."
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="NQF level"
              value={draft.nqf_level}
              onChange={(e) => set({ nqf_level: e.target.value })}
              options={NQF_LEVELS.map((l) => ({ value: l, label: l }))}
            />
            <Input
              label="Issued"
              type="date"
              value={draft.issued}
              onChange={(e) => set({ issued: e.target.value })}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
