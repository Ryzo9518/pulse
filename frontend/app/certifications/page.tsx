'use client'

// ── Certification Registry ────────────────────────────────────────────────────
// Two experiences off the shared mock session role:
//  • Employee — a consultant sees their own credentials and uploads new ones
//    (upload is independent of training; lands in "pending verification").
//  • Admin — Ryan works a verification queue (confirming validity dates) and
//    sees a firm-wide registry filtered by family/status.
// Mock-data phase: reads/writes go through the '@/lib/mock' accessor seam.

import { useReducer, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  Modal,
  Select,
  StatCard,
  Tabs,
  useToast,
  type BadgeColor,
  type DataTableColumn,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import {
  addCertificationUpload,
  formatDate,
  getCertificationsForEmployee,
  getEmployee,
  listAllCertifications,
  listPendingCertifications,
  rejectCertification,
  verifyCertification,
} from '@/lib/mock'
import type {
  CertFamily,
  Certification,
  CertStatus,
} from '@/types/database'

// Status is conveyed by the badge LABEL (not colour alone) so it stays legible
// to screen readers and colour-blind users (accessibility).
const STATUS_BADGE: Record<CertStatus, { color: BadgeColor; label: string }> = {
  active: { color: 'green', label: 'Active' },
  expiring_soon: { color: 'amber', label: 'Expiring soon' },
  expired: { color: 'red', label: 'Expired' },
  pending_verification: { color: 'grey', label: 'Pending verification' },
}

const FAMILY_LABEL: Record<CertFamily, string> = {
  sage: 'Sage Product',
  professional: 'Professional',
  vendor: 'Vendor / Tech',
}

const FAMILY_OPTIONS = (Object.keys(FAMILY_LABEL) as CertFamily[]).map((f) => ({
  value: f,
  label: FAMILY_LABEL[f],
}))

function StatusBadge({ status }: { status: CertStatus }) {
  const b = STATUS_BADGE[status]
  return <Badge color={b.color}>{b.label}</Badge>
}

export default function CertificationsPage() {
  const { role } = useSession()
  return (
    <AppShell>
      <PageHeader
        eyebrow="People"
        title="Certifications"
        subtitle="Every consultant's credentials, validity, and renewals in one place"
      />
      <div className="px-10 py-8">
        {role === 'admin' ? <AdminView /> : <EmployeeView />}
      </div>
    </AppShell>
  )
}

// ── Employee view ─────────────────────────────────────────────────────────────

interface UploadForm {
  family: CertFamily
  name: string
  issuing_body: string
  issued_date: string
  expiry_date: string
  renew_by_date: string
  non_expiring: boolean
  proof_name: string
}

const EMPTY_UPLOAD: UploadForm = {
  family: 'sage',
  name: '',
  issuing_body: '',
  issued_date: '',
  expiry_date: '',
  renew_by_date: '',
  non_expiring: false,
  proof_name: '',
}

function EmployeeView() {
  const { currentEmployee } = useSession()
  const { toast: notify } = useToast()
  const [, forceRender] = useReducer((n: number) => n + 1, 0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [form, setForm] = useState<UploadForm>(EMPTY_UPLOAD)

  if (!currentEmployee) {
    return <EmptyState icon="🔒" title="Not signed in" description="Sign in to view your certifications." />
  }

  const employeeId = currentEmployee.id
  const certs = getCertificationsForEmployee(employeeId)

  const canSubmit = form.name.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    addCertificationUpload({
      employee_id: employeeId,
      family: form.family,
      name: form.name.trim(),
      issuing_body: form.issuing_body.trim() || null,
      issued_date: form.issued_date || null,
      expiry_date: form.non_expiring ? null : form.expiry_date || null,
      renew_by_date: form.non_expiring ? null : form.renew_by_date || null,
      non_expiring: form.non_expiring,
      proof_path: form.proof_name ? `certifications/${employeeId}/${form.proof_name}` : null,
    })
    setUploadOpen(false)
    setForm(EMPTY_UPLOAD)
    forceRender()
    notify({ variant: 'success', title: 'Certification submitted', message: 'An admin will verify the dates before it goes active.' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-text">My certifications</h2>
        <Button onClick={() => setUploadOpen(true)}>Upload a certification</Button>
      </div>

      {certs.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No certifications yet"
          description="Upload any Sage, professional, or vendor certifications you already hold — you don't need to finish training first."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {certs.map((c) => (
            <Card key={c.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-text">{c.name}</div>
                  <div className="text-[12px] text-text-muted">
                    {FAMILY_LABEL[c.family]}{c.issuing_body ? ` · ${c.issuing_body}` : ''}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="text-[12px] text-text-muted">
                {c.non_expiring ? 'Does not expire' : `Expires ${formatDate(c.expiry_date)} · renew by ${formatDate(c.renew_by_date)}`}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        eyebrow="Certifications"
        title="Upload a certification"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>Submit for verification</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Type"
            value={form.family}
            options={FAMILY_OPTIONS}
            onChange={(e) => setForm({ ...form, family: e.target.value as CertFamily })}
          />
          <Input
            label="Certification name"
            placeholder="e.g. Sage Intacct Implementation Specialist"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Issuing body"
            placeholder="e.g. Sage, ACCA, Microsoft"
            value={form.issuing_body}
            onChange={(e) => setForm({ ...form, issuing_body: e.target.value })}
          />
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input
              type="checkbox"
              className="h-4 w-4 accent-jera-red"
              checked={form.non_expiring}
              onChange={(e) => setForm({ ...form, non_expiring: e.target.checked })}
            />
            This certification does not expire
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Issued" type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
            <Input label="Expires" type="date" value={form.expiry_date} disabled={form.non_expiring} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            <Input label="Renew by" type="date" value={form.renew_by_date} disabled={form.non_expiring} onChange={(e) => setForm({ ...form, renew_by_date: e.target.value })} />
          </div>
          <Input
            label="Proof file"
            placeholder="filename.pdf (file upload wired in a later step)"
            value={form.proof_name}
            onChange={(e) => setForm({ ...form, proof_name: e.target.value })}
            hint="PDF / JPG / PNG. Real upload + storage lands when the backend is wired."
          />
        </div>
      </Modal>
    </div>
  )
}

// ── Admin view ────────────────────────────────────────────────────────────────

function AdminView() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const all = listAllCertifications()

  const counts = {
    total: all.length,
    active: all.filter((c) => c.status === 'active').length,
    expiring: all.filter((c) => c.status === 'expiring_soon').length,
    expired: all.filter((c) => c.status === 'expired').length,
    pending: all.filter((c) => c.status === 'pending_verification').length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value={counts.active} label="Active" accent="green" />
        <StatCard value={counts.expiring} label="Expiring soon" accent="amber" />
        <StatCard value={counts.expired} label="Expired" accent="red" />
        <StatCard value={counts.pending} label="Pending verification" accent="blue" />
      </div>

      <Tabs
        variant="pill"
        tabs={[
          { value: 'queue', label: `Verification queue (${counts.pending})`, content: <VerificationQueue onChange={bump} /> },
          { value: 'all', label: 'All certifications', content: <FirmWideTable onChange={bump} /> },
        ]}
      />
    </div>
  )
}

function VerificationQueue({ onChange }: { onChange: () => void }) {
  const { currentEmployee } = useSession()
  const { toast: notify } = useToast()
  const adminId = currentEmployee?.id ?? 'emp-001'
  const pending = listPendingCertifications()
  const [verifying, setVerifying] = useState<Certification | null>(null)

  if (pending.length === 0) {
    return <EmptyState icon="✅" title="Nothing to verify" description="Uploaded certifications awaiting a date check will appear here." />
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((c) => {
        const owner = getEmployee(c.employee_id)
        return (
          <Card key={c.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {owner ? <Avatar name={owner.display_name} initials={owner.avatar_initials} color={owner.avatar_color} size="sm" /> : null}
              <div>
                <div className="font-semibold text-text">{c.name}</div>
                <div className="text-[12px] text-text-muted">
                  {owner?.display_name ?? c.employee_id} · {FAMILY_LABEL[c.family]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  rejectCertification(c.id, adminId, 'Rejected from verification queue')
                  onChange()
                  notify({ variant: 'default', title: 'Upload rejected', message: `${c.name} returned to ${owner?.display_name ?? 'the consultant'}.` })
                }}
              >
                Reject
              </Button>
              <Button onClick={() => setVerifying(c)}>Verify dates</Button>
            </div>
          </Card>
        )
      })}

      {verifying ? (
        <VerifyModal
          cert={verifying}
          adminId={adminId}
          onClose={() => setVerifying(null)}
          onVerified={(name) => {
            setVerifying(null)
            onChange()
            notify({ variant: 'success', title: 'Verified', message: `${name} is now active.` })
          }}
        />
      ) : null}
    </div>
  )
}

function VerifyModal({
  cert,
  adminId,
  onClose,
  onVerified,
}: {
  cert: Certification
  adminId: string
  onClose: () => void
  onVerified: (name: string) => void
}) {
  const [issued, setIssued] = useState(cert.issued_date ?? '')
  const [expiry, setExpiry] = useState(cert.expiry_date ?? '')
  const [renewBy, setRenewBy] = useState(cert.renew_by_date ?? '')
  const [nonExpiring, setNonExpiring] = useState(cert.non_expiring)

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Verify certification"
      title={cert.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              verifyCertification(
                cert.id,
                {
                  issued_date: issued || null,
                  expiry_date: nonExpiring ? null : expiry || null,
                  renew_by_date: nonExpiring ? null : renewBy || null,
                  non_expiring: nonExpiring,
                },
                adminId,
              )
              onVerified(cert.name)
            }}
          >
            Confirm &amp; activate
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[13px] text-text-muted">
        Confirm the validity dates are correct before activating this credential.
      </p>
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-[13px] text-text">
          <input type="checkbox" className="h-4 w-4 accent-jera-red" checked={nonExpiring} onChange={(e) => setNonExpiring(e.target.checked)} />
          Does not expire
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Issued" type="date" value={issued} onChange={(e) => setIssued(e.target.value)} />
          <Input label="Expires" type="date" value={expiry} disabled={nonExpiring} onChange={(e) => setExpiry(e.target.value)} />
          <Input label="Renew by" type="date" value={renewBy} disabled={nonExpiring} onChange={(e) => setRenewBy(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function FirmWideTable({ onChange }: { onChange: () => void }) {
  const [familyFilter, setFamilyFilter] = useState<'all' | CertFamily>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | CertStatus>('all')

  let rows = listAllCertifications()
  if (familyFilter !== 'all') rows = rows.filter((c) => c.family === familyFilter)
  if (statusFilter !== 'all') rows = rows.filter((c) => c.status === statusFilter)
  // Surface expiring/expired first.
  const ORDER: Record<CertStatus, number> = { expired: 0, expiring_soon: 1, pending_verification: 2, active: 3 }
  rows = [...rows].sort((a, b) => ORDER[a.status] - ORDER[b.status])

  const columns: DataTableColumn<Certification>[] = [
    {
      key: 'consultant',
      header: 'Consultant',
      render: (c) => {
        const owner = getEmployee(c.employee_id)
        return owner ? (
          <div className="flex items-center gap-3">
            <Avatar name={owner.display_name} initials={owner.avatar_initials} color={owner.avatar_color} size="sm" />
            <span className="font-semibold text-text">{owner.display_name}</span>
          </div>
        ) : (
          <span>{c.employee_id}</span>
        )
      },
    },
    { key: 'name', header: 'Certification', render: (c) => <span className="text-text">{c.name}</span> },
    { key: 'family', header: 'Type', render: (c) => <Badge color="grey">{FAMILY_LABEL[c.family]}</Badge> },
    { key: 'expiry', header: 'Expires', render: (c) => (c.non_expiring ? '—' : formatDate(c.expiry_date)) },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Select
            label="Filter by type"
            value={familyFilter}
            options={[{ value: 'all', label: 'All types' }, ...FAMILY_OPTIONS]}
            onChange={(e) => setFamilyFilter(e.target.value as 'all' | CertFamily)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Filter by status"
            value={statusFilter}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'expiring_soon', label: 'Expiring soon' },
              { value: 'expired', label: 'Expired' },
              { value: 'pending_verification', label: 'Pending verification' },
            ]}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CertStatus)}
          />
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon="🔍" title="No matches" description="No certifications match the current filters." />
        ) : (
          <div className="p-2">
            <DataTable columns={columns} rows={rows} headerTone="dark" rowKey={(c) => c.id} onRowClick={() => onChange()} />
          </div>
        )}
      </Card>
    </div>
  )
}
