'use client'

// ── Expenses screen (Unit 10) ────────────────────────────────────────────────
// Submitter: an expense claim form (travel + other lines) with a live grand
// total computed via lib/expenseCalc (the single source of truth for money).
// Approver: a "Pending Approvals" tab listing submitted claims with expandable
// line items and approve/decline actions.
//
// Mock phase: there are no expense mutators in @/lib/mock yet, so approval state
// and the submitted form live in component state. Reads (seed claims + their
// lines) come from the accessor layer.

import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  Input,
  Tabs,
  useToast,
  type BadgeColor,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import {
  getEmployee,
  listExpenseClaims,
  listExpenseOtherLines,
  listExpenseTravelLines,
} from '@/lib/mock'
import { SARS_KM_RATE, EXPENSE_DEADLINE_DAY } from '@/lib/constants'
import {
  claimTotals,
  formatRand,
  travelLineAmount,
} from '@/lib/expenseCalc'
import type { ExpenseClaim, ExpenseStatus } from '@/types/database'

// ── Local form row models (pre-submit, string-backed like real inputs) ────────
interface TravelRow {
  id: string
  clientName: string
  date: string
  km: string
}

interface OtherRow {
  id: string
  clientName: string
  date: string
  description: string
  amount: string
  receiptName: string | null
}

let rowSeq = 0
const nextId = (prefix: string) => `${prefix}-${++rowSeq}`

const emptyTravelRow = (): TravelRow => ({
  id: nextId('tr'),
  clientName: '',
  date: '',
  km: '',
})

const emptyOtherRow = (): OtherRow => ({
  id: nextId('or'),
  clientName: '',
  date: '',
  description: '',
  amount: '',
  receiptName: null,
})

const STATUS_BADGE: Record<ExpenseStatus, { color: BadgeColor; label: string }> = {
  draft: { color: 'grey', label: 'Draft' },
  submitted: { color: 'amber', label: 'Submitted' },
  approved: { color: 'green', label: 'Approved' },
  declined: { color: 'red', label: 'Declined' },
  paid: { color: 'blue', label: 'Paid' },
}

const FIELD_LABEL =
  'mb-[5px] block text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted'

// ── Submitter: the claim form ─────────────────────────────────────────────────
function ClaimForm() {
  const { currentEmployee } = useSession()
  const { toast } = useToast()

  const [travelRows, setTravelRows] = useState<TravelRow[]>([emptyTravelRow()])
  const [otherRows, setOtherRows] = useState<OtherRow[]>([emptyOtherRow()])
  const [period, setPeriod] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const totals = useMemo(
    () =>
      claimTotals(
        travelRows.map((r) => ({ km: r.km })),
        otherRows.map((r) => ({ amount: r.amount })),
      ),
    [travelRows, otherRows],
  )

  // A travel row needs a client name once the user has entered km for it; an
  // other row needs a client name once an amount is entered. Empty rows are
  // ignored so a stray blank row never blocks submission.
  const travelMissingClient = travelRows.some(
    (r) => r.km.trim() !== '' && r.clientName.trim() === '',
  )
  const otherMissingClient = otherRows.some(
    (r) => r.amount.trim() !== '' && r.clientName.trim() === '',
  )
  const hasMissingClient = travelMissingClient || otherMissingClient

  function updateTravel(id: string, patch: Partial<TravelRow>) {
    setTravelRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function updateOther(id: string, patch: Partial<OtherRow>) {
    setOtherRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function handleSubmit() {
    if (hasMissingClient) {
      setShowErrors(true)
      toast({
        variant: 'error',
        title: 'Client Name required',
        message: 'Every travel and expense line needs a client name before submitting.',
      })
      return
    }
    setSubmitted(true)
    toast({
      variant: 'success',
      title: 'Expense claim submitted',
      message: `Grand total ${formatRand(totals.grandTotal)} sent to your approver for review.`,
    })
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-4">
      {/* Policy warning banner */}
      <div
        className="rounded-card border border-jera-red/40 border-l-[3px] border-l-jera-red bg-jera-red-light p-4"
        role="note"
      >
        <p className="text-[13px] leading-relaxed text-jera-red">
          <strong>Important:</strong> A copy of your timesheet must accompany this
          claim. Client-billable travel that has not been invoiced to the client may
          NOT be claimed. Claims must reach HR (copy Ryan) by the{' '}
          {EXPENSE_DEADLINE_DAY}th of the month — late submissions will not be
          processed.
        </p>
      </div>

      {/* Claimant details */}
      <Card title="Claimant Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name & Surname"
            value={currentEmployee?.display_name ?? ''}
            readOnly
          />
          <Input
            label="Claim Period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </Card>

      {/* Travel claim */}
      <Card title="Travel Claim">
        <div className="space-y-3">
          <div className="hidden grid-cols-[2fr_1fr_90px_70px_1fr] gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted sm:grid">
            <span>Client Name</span>
            <span>Date</span>
            <span>Rate /km</span>
            <span>KMs</span>
            <span className="text-right">Amount</span>
          </div>
          {travelRows.map((row) => {
            const amount = travelLineAmount(row.km)
            const rowError =
              showErrors && row.km.trim() !== '' && row.clientName.trim() === ''
            return (
              <div
                key={row.id}
                className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[2fr_1fr_90px_70px_1fr]"
              >
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Client Name</label>
                  <Input
                    aria-label="Travel client name"
                    placeholder="Client name"
                    value={row.clientName}
                    error={rowError ? 'Required' : undefined}
                    onChange={(e) =>
                      updateTravel(row.id, { clientName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Date</label>
                  <Input
                    aria-label="Travel date"
                    type="date"
                    value={row.date}
                    onChange={(e) => updateTravel(row.id, { date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Rate /km</label>
                  <Input
                    aria-label="Rate per km"
                    value={formatRand(SARS_KM_RATE)}
                    readOnly
                    tabIndex={-1}
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>KMs</label>
                  <Input
                    aria-label="Kilometres travelled"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="0"
                    value={row.km}
                    onChange={(e) => updateTravel(row.id, { km: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Amount</label>
                  <Input
                    aria-label="Travel line amount"
                    value={formatRand(amount)}
                    readOnly
                    tabIndex={-1}
                    className="bg-surface text-right font-semibold"
                  />
                </div>
              </div>
            )
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setTravelRows((rows) => [...rows, emptyTravelRow()])}
        >
          + Add Row
        </Button>
      </Card>

      {/* Other expenses */}
      <Card title="Other Expenses (Receipts Required)">
        <div className="space-y-3">
          <div className="hidden grid-cols-[1.4fr_1fr_2fr_1fr_auto] gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted sm:grid">
            <span>Client Name</span>
            <span>Date</span>
            <span>Description</span>
            <span>Amount (R)</span>
            <span>Receipt</span>
          </div>
          {otherRows.map((row) => {
            const rowError =
              showErrors && row.amount.trim() !== '' && row.clientName.trim() === ''
            return (
              <div
                key={row.id}
                className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1.4fr_1fr_2fr_1fr_auto]"
              >
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Client Name</label>
                  <Input
                    aria-label="Expense client name"
                    placeholder="Client name"
                    value={row.clientName}
                    error={rowError ? 'Required' : undefined}
                    onChange={(e) =>
                      updateOther(row.id, { clientName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Date</label>
                  <Input
                    aria-label="Expense date"
                    type="date"
                    value={row.date}
                    onChange={(e) => updateOther(row.id, { date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Description</label>
                  <Input
                    aria-label="Expense description"
                    placeholder="e.g. Client lunch, parking, toll fees"
                    value={row.description}
                    onChange={(e) =>
                      updateOther(row.id, { description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Amount (R)</label>
                  <Input
                    aria-label="Expense amount"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={row.amount}
                    onChange={(e) => updateOther(row.id, { amount: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className={`${FIELD_LABEL} sm:hidden`}>Receipt</label>
                  <label
                    className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-btn border border-surface-border bg-surface px-3 py-[11px] text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-border-light"
                    title="Attach receipt (mock)"
                  >
                    {row.receiptName ? '✓ Attached' : '📎 Receipt'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      aria-label="Upload receipt"
                      onChange={(e) =>
                        updateOther(row.id, {
                          receiptName: e.target.files?.[0]?.name ?? null,
                        })
                      }
                    />
                  </label>
                  {row.receiptName ? (
                    <span className="mt-1 max-w-[120px] truncate text-[10px] text-text-muted">
                      {row.receiptName}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setOtherRows((rows) => [...rows, emptyOtherRow()])}
        >
          + Add Row
        </Button>
      </Card>

      {/* Grand total + submit */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="font-display text-sm font-bold text-text">
            Grand Total Payable
          </span>
          <span className="font-display text-2xl font-extrabold text-jera-red">
            {formatRand(totals.grandTotal)}
          </span>
        </div>
        {hasMissingClient ? (
          <p className="mb-3 text-xs font-semibold text-jera-red">
            Add a client name to every line with a value before submitting.
          </p>
        ) : null}
        {submitted ? (
          <div className="flex items-center justify-center gap-2 rounded-btn border border-jera-green/30 bg-jera-green/10 px-4 py-3 text-[13px] font-semibold text-jera-green">
            <Badge color="amber">Submitted</Badge>
            Claim submitted — awaiting approver review.
          </div>
        ) : (
          <Button fullWidth onClick={handleSubmit}>
            Submit Expense Claim
          </Button>
        )}
      </Card>
    </div>
  )
}

// ── Approver: pending approvals ───────────────────────────────────────────────
interface ApproverClaimRow extends ExpenseClaim {
  submitterName: string
  localStatus: ExpenseStatus
  localNotes: string | null
}

function PendingApprovals() {
  const { toast } = useToast()

  const [claims, setClaims] = useState<ApproverClaimRow[]>(() =>
    listExpenseClaims().map((c) => ({
      ...c,
      submitterName: getEmployee(c.employee_id)?.display_name ?? c.employee_id,
      localStatus: c.status,
      localNotes: c.review_notes,
    })),
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesById, setNotesById] = useState<Record<string, string>>({})

  const pending = claims.filter((c) => c.localStatus === 'submitted')
  const reviewed = claims.filter((c) => c.localStatus !== 'submitted')

  function review(claimId: string, decision: 'approved' | 'declined') {
    const notes = notesById[claimId]?.trim() || null
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, localStatus: decision, localNotes: notes } : c,
      ),
    )
    const claim = claims.find((c) => c.id === claimId)
    toast({
      variant: decision === 'approved' ? 'success' : 'error',
      title: decision === 'approved' ? 'Claim approved' : 'Claim declined',
      message: `${claim?.submitterName ?? 'Claim'} — ${formatRand(
        claim?.grand_total ?? 0,
      )}. Submitter notified.`,
    })
  }

  function renderClaimCard(claim: ApproverClaimRow, actionable: boolean) {
    const travel = listExpenseTravelLines(claim.id)
    const other = listExpenseOtherLines(claim.id)
    const isOpen = expandedId === claim.id
    const badge = STATUS_BADGE[claim.localStatus]
    return (
      <Card key={claim.id} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-[15px] font-bold text-text">
              {claim.submitterName}
            </div>
            <div className="text-xs text-text-muted">
              Period {claim.claim_period ?? '—'} · Travel{' '}
              {formatRand(claim.total_travel)} · Other {formatRand(claim.total_other)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge color={badge.color}>{badge.label}</Badge>
            <span className="font-display text-lg font-extrabold text-jera-red">
              {formatRand(claim.grand_total)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={isOpen}
              onClick={() => setExpandedId(isOpen ? null : claim.id)}
            >
              {isOpen ? 'Hide lines' : 'View lines'}
            </Button>
          </div>
        </div>

        {isOpen ? (
          <div className="space-y-3 border-t border-surface-border pt-3">
            {travel.length > 0 ? (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                  Travel
                </div>
                <ul className="space-y-1">
                  {travel.map((l) => (
                    <li
                      key={l.id}
                      className="flex justify-between gap-3 text-[13px] text-text"
                    >
                      <span className="min-w-0 truncate">
                        {l.client_name}
                        {l.travel_date ? ` · ${l.travel_date}` : ''}
                        {l.km_traveled != null ? ` · ${l.km_traveled} km` : ''}
                      </span>
                      <span className="font-semibold">
                        {formatRand(l.amount ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {other.length > 0 ? (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                  Other Expenses
                </div>
                <ul className="space-y-1">
                  {other.map((l) => (
                    <li
                      key={l.id}
                      className="flex justify-between gap-3 text-[13px] text-text"
                    >
                      <span className="min-w-0 truncate">
                        {l.client_name}
                        {l.description ? ` · ${l.description}` : ''}
                      </span>
                      <span className="font-semibold">
                        {formatRand(l.amount ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {actionable ? (
          <div className="space-y-2 border-t border-surface-border pt-3">
            <Input
              label="Review notes (optional)"
              placeholder="Add a note for the submitter…"
              value={notesById[claim.id] ?? ''}
              onChange={(e) =>
                setNotesById((prev) => ({ ...prev, [claim.id]: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <Button onClick={() => review(claim.id, 'approved')}>Approve</Button>
              <Button variant="danger" onClick={() => review(claim.id, 'declined')}>
                Decline
              </Button>
            </div>
          </div>
        ) : claim.localNotes ? (
          <p className="border-t border-surface-border pt-3 text-xs text-text-muted">
            <strong className="text-text-secondary">Notes:</strong> {claim.localNotes}
          </p>
        ) : null}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-3 font-display text-sm font-bold text-text">
          Awaiting your review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card>
            <p className="text-[13px] text-text-muted">
              No claims are waiting for your approval right now.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => renderClaimCard(c, true))}
          </div>
        )}
      </div>

      {reviewed.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-sm font-bold text-text">
            Recently reviewed
          </h2>
          <div className="space-y-3">
            {reviewed.map((c) => renderClaimCard(c, false))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { currentEmployee, role } = useSession()

  // The dev RoleSwitch flips `role` (employee/admin) but not expense_role. Show
  // the approver tab when the user is an expense approver OR when viewing as
  // admin, so the approver experience is reachable via the existing dev switch.
  const isApprover =
    currentEmployee?.expense_role === 'approver' ||
    currentEmployee?.expense_role === 'both' ||
    role === 'admin'

  return (
    <AppShell>
      <PageHeader
        eyebrow="Finance"
        title="Expense Claim Form"
        subtitle="Submit travel and expense claims — receipts must be attached. Due by the 25th of each month."
      />
      <div className="px-10 py-8">
        {isApprover ? (
          <Tabs
            tabs={[
              { value: 'claim', label: 'My Claim', content: <ClaimForm /> },
              {
                value: 'approvals',
                label: 'Pending Approvals',
                content: <PendingApprovals />,
              },
            ]}
          />
        ) : (
          <ClaimForm />
        )}
      </div>
    </AppShell>
  )
}
