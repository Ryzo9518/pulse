'use client'

// ── Expenses screen (W7) ──────────────────────────────────────────────────────
// Submitter: a THREE-part claim form — expenses incurred (receipts) + travel
// (AA rate) − advances already paid — with a live grand total computed via
// lib/expenseCalc (the single source of truth for money). Travel reimburses at
// the per-person AA Vehicle Rates Certificate: the FULL AA rate for travel
// invoiced to a client, the FIXED-COST rate for non-invoiced (DECISION D2). The
// AA certificate card + editor modal sets those rates; submit is BLOCKED until a
// timesheet is attached.
//
// Approver: a "Pending Approvals" tab listing submitted claims with expandable
// line items and Approve / Return-for-correction actions. Managers can approve
// (capability `approveExpenses`); marking a claim PAID is admin-only.
//
// Data layer (WS-4): lib/data/useExpenses — live mode persists claims + lines
// through the /api/rest proxy (RLS + the expense statechart triggers are the
// boundary); mock mode preserves the original in-memory behaviour. Attachments
// (timesheet / slips / receipts) are recorded by file name only until the
// SharePoint integration lands (WS-10/B5) — the pending-storage state.

import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Tabs,
  useToast,
  type BadgeColor,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import {
  useExpenseApprovals,
  useMyExpenseClaim,
  type AdvanceRow,
  type ApprovalClaim,
  type MyClaimController,
  type OtherRow,
  type TravelRow,
} from '@/lib/data/useExpenses'
import { can } from '@/lib/capabilities'
import { EXPENSE_DEADLINE_DAY } from '@/lib/constants'
import {
  claimTotals,
  formatRand,
  travelLineAmount,
  travelRateForLine,
  type AaRates,
} from '@/lib/expenseCalc'
import type { AaRateCertificate, ExpenseStatus } from '@/types/database'

let rowSeq = 0
const nextId = (prefix: string) => `${prefix}-${++rowSeq}`

const emptyOtherRow = (): OtherRow => ({
  id: nextId('or'),
  clientName: '',
  date: '',
  description: '',
  amount: '',
  receiptName: null,
})

const emptyTravelRow = (): TravelRow => ({
  id: nextId('tr'),
  clientName: '',
  date: '',
  reason: '',
  invoiced: true,
  invoiceNo: '',
  invoiceAmount: '',
  km: '',
})

const emptyAdvanceRow = (): AdvanceRow => ({
  id: nextId('ar'),
  date: '',
  details: '',
  amount: '',
})

const STATUS_BADGE: Record<ExpenseStatus, { color: BadgeColor; label: string }> = {
  draft: { color: 'grey', label: 'Draft' },
  submitted: { color: 'amber', label: 'Submitted' },
  approved: { color: 'green', label: 'Approved' },
  returned: { color: 'red', label: 'Returned' },
  paid: { color: 'blue', label: 'Paid' },
}

const FIELD_LABEL =
  'mb-[5px] block text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted'

// Default rates used when a person has no certificate on file, so the form
// still produces sensible numbers (mirrors the prototype DEFAULT_VEHICLE).
const FALLBACK_RATES: AaRates = { full_rate: 6.05, fixed_cost: 4.59 }

// Generic write-failure body (MSG-ERR-GENERIC); DB trigger raise text replaces
// it when the server said something specific (MSG-DENY-TRIGGER).
const GENERIC_SAVE_ERROR =
  'Something went wrong — your changes were not saved. Try again.'

function saveErrorMessage(e: unknown): string {
  return e instanceof Error && e.message.trim() !== ''
    ? e.message
    : GENERIC_SAVE_ERROR
}

// ── AA Rate Certificate card + editor ─────────────────────────────────────────
interface AaEditorDraft {
  make: string
  model: string
  year: string
  registration: string
  fullRate: string
  fixedCost: string
  runningCost: string
  fuelPrice: string
}

function AaCertSection({
  cert,
  onSave,
}: {
  cert: AaRateCertificate | null
  onSave: MyClaimController['saveCert']
}) {
  const { toast } = useToast()
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<AaEditorDraft | null>(null)

  function openEditor() {
    setDraft({
      make: cert?.make ?? '',
      model: cert?.model ?? '',
      year: cert?.year ?? '',
      registration: cert?.registration ?? '',
      fullRate: cert ? String(cert.full_rate) : '',
      fixedCost: cert ? String(cert.fixed_cost) : '',
      runningCost: cert ? String(cert.running_cost) : '',
      fuelPrice: cert ? String(cert.fuel_price) : '',
    })
    setEditorOpen(true)
  }

  function update(patch: Partial<AaEditorDraft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d))
  }

  async function save() {
    if (!draft || saving) return
    const num = (v: string, fb: number) => {
      const n = parseFloat(v)
      return Number.isFinite(n) && n > 0 ? n : fb
    }
    setSaving(true)
    try {
      const saved = await onSave({
        make: draft.make.trim() || cert?.make || '',
        model: draft.model.trim() || cert?.model || '',
        year: draft.year.trim() || cert?.year || '',
        registration: draft.registration.trim() || null,
        full_rate: num(draft.fullRate, cert?.full_rate ?? 0),
        fixed_cost: num(draft.fixedCost, cert?.fixed_cost ?? 0),
        running_cost: num(draft.runningCost, cert?.running_cost ?? 0),
        fuel_price: num(draft.fuelPrice, cert?.fuel_price ?? 0),
        file_name: cert?.file_name ?? 'AA_Rate_Certificate.pdf',
        issued_date: cert?.issued_date ?? new Date().toISOString().slice(0, 10),
      })
      setEditorOpen(false)
      toast({
        variant: 'success',
        title: 'AA certificate saved',
        message: `${saved.make} ${saved.model} — full ${formatRand(
          saved.full_rate,
        )}/km, fixed ${formatRand(saved.fixed_cost)}/km.`,
      })
    } catch (e) {
      toast({
        variant: 'error',
        title: "Couldn't save",
        message: saveErrorMessage(e),
      })
    } finally {
      setSaving(false)
    }
  }

  const buttonLabel = cert?.uploaded ? 'Update AA certificate' : 'Upload AA certificate'

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex min-w-[200px] flex-1 items-center gap-3">
            <span className="text-2xl" aria-hidden>
              🚗
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                AA Vehicle Rate Certificate
              </div>
              <div className="text-sm font-bold text-text">
                {cert
                  ? `${cert.make} ${cert.model} (${cert.year})`
                  : 'No certificate on file'}
              </div>
              {cert?.uploaded ? (
                <div className="mt-[3px] flex items-center gap-[6px] text-[11.5px] font-semibold text-jera-green">
                  📎 {cert.file_name} · {cert.registration ?? '—'} · issued{' '}
                  {cert.issued_date ?? '—'}
                </div>
              ) : (
                <div className="mt-[3px] text-[11.5px] font-semibold text-jera-amber">
                  No certificate on file — upload to set your rates.
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <RateStat label="Full AA rate" value={`${formatRand(cert?.full_rate ?? FALLBACK_RATES.full_rate)}`} unit="/km" />
            <RateStat label="Fixed cost" value={`${formatRand(cert?.fixed_cost ?? FALLBACK_RATES.fixed_cost)}`} unit="/km" />
            <RateStat
              label="Fuel price"
              value={formatRand(cert?.fuel_price ?? 0)}
            />
            <Button variant="secondary" size="sm" onClick={openEditor}>
              ⬆ {buttonLabel}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        eyebrow="AA Vehicle Rates"
        title={buttonLabel}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} isLoading={saving}>
              Save certificate
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <p className="text-[11.5px] text-text-muted">
              The AA Vehicle Rates Calculator Certificate confirms your vehicle and
              rates. These rates drive your travel claim: the full rate for
              invoiced clients, the fixed cost for non-invoiced travel.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Make"
                placeholder="e.g. Volkswagen"
                value={draft.make}
                onChange={(e) => update({ make: e.target.value })}
              />
              <Input
                label="Model"
                placeholder="e.g. Polo 1.0 TSI"
                value={draft.model}
                onChange={(e) => update({ model: e.target.value })}
              />
              <Input
                label="Year"
                placeholder="2023"
                value={draft.year}
                onChange={(e) => update({ year: e.target.value })}
              />
              <Input
                label="Registration"
                placeholder="ABC 123 GP"
                value={draft.registration}
                onChange={(e) => update({ registration: e.target.value })}
              />
            </div>
            <div className="border-t border-surface-border pt-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                AA Rates (R/km)
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full AA rate"
                  inputMode="decimal"
                  placeholder="6.05"
                  value={draft.fullRate}
                  onChange={(e) => update({ fullRate: e.target.value })}
                />
                <Input
                  label="Fixed cost"
                  inputMode="decimal"
                  placeholder="4.59"
                  value={draft.fixedCost}
                  onChange={(e) => update({ fixedCost: e.target.value })}
                />
                <Input
                  label="Running cost"
                  inputMode="decimal"
                  placeholder="1.52"
                  value={draft.runningCost}
                  onChange={(e) => update({ runningCost: e.target.value })}
                />
                <Input
                  label="Fuel price used"
                  inputMode="decimal"
                  placeholder="21.74"
                  value={draft.fuelPrice}
                  onChange={(e) => update({ fuelPrice: e.target.value })}
                />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

function RateStat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div>
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className="font-mono text-[15px] font-extrabold text-text">
        {value}
        {unit ? (
          <span className="text-[11px] font-medium text-text-muted">{unit}</span>
        ) : null}
      </div>
    </div>
  )
}

// ── Submitter: the three-part claim form ──────────────────────────────────────
function ClaimForm() {
  const { currentEmployee } = useSession()
  const { toast } = useToast()

  const employeeId = currentEmployee?.id ?? ''
  const controller = useMyExpenseClaim(employeeId)
  const { cert } = controller
  const rates: AaRates = cert
    ? { full_rate: cert.full_rate, fixed_cost: cert.fixed_cost }
    : FALLBACK_RATES

  const [otherRows, setOtherRows] = useState<OtherRow[]>([emptyOtherRow()])
  const [travelRows, setTravelRows] = useState<TravelRow[]>([emptyTravelRow()])
  const [advanceRows, setAdvanceRows] = useState<AdvanceRow[]>([emptyAdvanceRow()])
  const [period, setPeriod] = useState('')
  const [timesheetName, setTimesheetName] = useState<string | null>(null)
  const [slipNames, setSlipNames] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null)
  const [startedNew, setStartedNew] = useState(false)

  // Hydrate the form from the persisted draft/returned claim (once per claim).
  const hydratedClaimRef = useRef<string | null>(null)
  useEffect(() => {
    const claim = controller.activeClaim
    const rows = controller.activeRows
    if (!claim || !rows || hydratedClaimRef.current === claim.id) return
    hydratedClaimRef.current = claim.id
    if (rows.other.length > 0) setOtherRows(rows.other)
    if (rows.travel.length > 0) setTravelRows(rows.travel)
    if (rows.advances.length > 0) setAdvanceRows(rows.advances)
    setPeriod(claim.claim_period ?? '')
    setTimesheetName(claim.timesheet_filename)
  }, [controller.activeClaim, controller.activeRows])

  const totals = useMemo(
    () =>
      claimTotals(
        travelRows.map((r) => ({ km: r.km, invoiced: r.invoiced })),
        otherRows.map((r) => ({ amount: r.amount })),
        advanceRows.map((r) => ({ amount: r.amount })),
        rates,
      ),
    [travelRows, otherRows, advanceRows, rates],
  )

  // Validation: a line with a value needs its client/details; invoiced travel
  // needs an invoice number.
  const otherMissingClient = otherRows.some(
    (r) => r.amount.trim() !== '' && r.clientName.trim() === '',
  )
  const travelMissingClient = travelRows.some(
    (r) => r.km.trim() !== '' && r.clientName.trim() === '',
  )
  const travelMissingInvoiceNo = travelRows.some(
    (r) => r.km.trim() !== '' && r.invoiced && r.invoiceNo.trim() === '',
  )
  const advanceMissingDetails = advanceRows.some(
    (r) => r.amount.trim() !== '' && r.details.trim() === '',
  )
  const timesheetMissing = timesheetName === null
  // Receipt slips back the "expenses incurred" lines, so they're only required
  // when the claim actually has incurred expenses (a travel-only claim needs none).
  const slipsMissing = totals.totalOther > 0 && slipNames.length === 0
  // A travel line with distance but no resolvable per-km rate (e.g. an AA
  // certificate with a blank/zero rate) would silently reimburse R0 — block it.
  const travelMissingRate = travelRows.some(
    (r) => Number(r.km) > 0 && travelRateForLine(r.invoiced, rates) <= 0,
  )

  const incomplete =
    otherMissingClient ||
    travelMissingClient ||
    travelMissingInvoiceNo ||
    advanceMissingDetails

  function updateOther(id: string, patch: Partial<OtherRow>) {
    setOtherRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function updateTravel(id: string, patch: Partial<TravelRow>) {
    setTravelRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function updateAdvance(id: string, patch: Partial<AdvanceRow>) {
    setAdvanceRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const formRows = { travel: travelRows, other: otherRows, advances: advanceRows }
  const formMeta = { period, timesheetName }

  async function handleSaveDraft() {
    // Draft saves apply the completeness gate only (attachments can come later)
    // — persisted lines must satisfy the DB's own line CHECK constraints.
    if (incomplete) {
      setShowErrors(true)
      toast({
        variant: 'error',
        title: 'Claim incomplete',
        message:
          'Complete every line with a value — client/details, and an invoice number on invoiced travel.',
      })
      return
    }
    setSaving('draft')
    try {
      await controller.saveDraft(formRows, formMeta)
      toast({
        variant: 'success',
        title: 'Draft saved',
        message: 'Your claim was saved — submit it when it is complete.',
      })
    } catch (e) {
      toast({
        variant: 'error',
        title: "Couldn't save",
        message: saveErrorMessage(e),
      })
    } finally {
      setSaving(null)
    }
  }

  async function handleSubmit() {
    if (incomplete) {
      setShowErrors(true)
      toast({
        variant: 'error',
        title: 'Claim incomplete',
        message:
          'Complete every line with a value — client/details, and an invoice number on invoiced travel.',
      })
      return
    }
    // Timesheet gate: the claim cannot be submitted without it (HANDOFF §4).
    if (timesheetMissing) {
      setShowErrors(true)
      toast({
        variant: 'error',
        title: 'Timesheet required',
        message: 'A copy of your timesheet must accompany this claim form.',
      })
      return
    }
    // Slips gate: incurred expenses need receipt slips attached.
    if (slipsMissing) {
      setShowErrors(true)
      toast({
        variant: 'error',
        title: 'Receipt slips required',
        message: 'Attach the receipt slips for the expenses you incurred.',
      })
      return
    }
    // Rate gate: don't let a travel line submit at R0 because no AA rate is set.
    if (travelMissingRate) {
      setShowErrors(true)
      toast({
        variant: 'error',
        title: 'No travel rate on file',
        message:
          'Add your AA Rate Certificate rates before claiming travel — the per-km rate is missing.',
      })
      return
    }
    setSaving('submit')
    try {
      await controller.submit(formRows, formMeta)
      setSubmitted(true)
      toast({
        variant: 'success',
        title: 'Expense claim submitted',
        message: `Grand total ${formatRand(totals.grandTotal)} sent to finance for approval.`,
      })
    } catch (e) {
      // Write failed: the claim stays draft — nothing was submitted.
      toast({
        variant: 'error',
        title: "Couldn't save",
        message: saveErrorMessage(e),
      })
    } finally {
      setSaving(null)
    }
  }

  if (controller.loading) {
    return (
      <div className="mx-auto max-w-[820px]">
        <Card>
          <p className="text-[13px] text-text-muted">Loading your expense claim…</p>
        </Card>
      </div>
    )
  }

  if (controller.error) {
    return (
      <div className="mx-auto max-w-[820px]">
        <Card>
          <p className="mb-3 text-[13px] text-jera-red">
            Could not load your expense claim ({controller.error}).
          </p>
          <Button variant="secondary" size="sm" onClick={controller.reload}>
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  // A claim already awaiting review: show the submitted view (the approver
  // decides from here; a new claim can be started for the next period).
  if (!submitted && !startedNew && controller.submittedClaim) {
    const c = controller.submittedClaim
    return (
      <div className="mx-auto max-w-[820px] space-y-4">
        <Card>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Badge color="amber">Submitted</Badge>
            <p className="text-[13px] font-semibold text-text">
              Claim {c.claim_period ? `for ${c.claim_period} ` : ''}submitted —
              awaiting finance approval.
            </p>
            <p className="font-display text-2xl font-extrabold text-jera-red">
              {formatRand(c.grand_total)}
            </p>
            <Button variant="secondary" size="sm" onClick={() => setStartedNew(true)}>
              Start a new claim
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[820px] space-y-4">
      {/* Returned claim: back for correction with the reviewer's notes (E4). */}
      {controller.activeClaim?.status === 'returned' ? (
        <div
          className="rounded-card border border-jera-red/40 border-l-[3px] border-l-jera-red bg-jera-red-light p-4"
          role="note"
        >
          <p className="text-[13px] leading-relaxed text-jera-red">
            <strong>Returned for correction:</strong>{' '}
            {controller.activeClaim.review_notes ??
              'Your claim was sent back — correct it and resubmit.'}
          </p>
        </div>
      ) : null}

      {/* Policy banner — D2: non-invoiced travel IS claimable, at the fixed cost. */}
      <div
        className="rounded-card border border-jera-red/40 border-l-[3px] border-l-jera-red bg-jera-red-light p-4"
        role="note"
      >
        <p className="text-[13px] leading-relaxed text-jera-red">
          <strong>Important:</strong> A copy of your timesheet must accompany this
          claim. Travel reimburses at your AA Vehicle Rates Certificate:{' '}
          <strong>full AA rate</strong> for travel invoiced to a client,{' '}
          <strong>fixed-cost rate</strong> for non-invoiced travel. Claims must
          reach finance by the {EXPENSE_DEADLINE_DAY}th of the month — late
          submissions will not be processed.
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

      {/* 1. Expenses incurred (receipts) */}
      <Card title="Expenses Incurred (Receipts Required)">
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
                    onChange={(e) => updateOther(row.id, { clientName: e.target.value })}
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
                    title="Attach receipt — file name recorded; storage arrives with SharePoint"
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
        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOtherRows((rows) => [...rows, emptyOtherRow()])}
          >
            + Add Row
          </Button>
          <span className="text-[13px] text-text-secondary">
            Subtotal{' '}
            <strong className="font-mono">{formatRand(totals.totalOther)}</strong>
          </span>
        </div>
      </Card>

      {/* 2. Travel claim — AA rate, invoiced toggle drives the rate */}
      <Card title="Travel Claim (AA Rate)">
        <p className="mb-3 text-[11.5px] text-text-muted">
          <strong className="text-text-secondary">Full AA rate</strong> (
          {formatRand(rates.full_rate)}/km) for invoiced clients ·{' '}
          <strong className="text-text-secondary">Fixed cost</strong> (
          {formatRand(rates.fixed_cost)}/km) for non-invoiced. Rates come from your
          AA certificate.
        </p>
        <div className="space-y-4">
          {travelRows.map((row) => {
            const rate = travelRateForLine(row.invoiced, rates)
            const amount = travelLineAmount(row.km, rate)
            const clientError =
              showErrors && row.km.trim() !== '' && row.clientName.trim() === ''
            const invoiceError =
              showErrors &&
              row.km.trim() !== '' &&
              row.invoiced &&
              row.invoiceNo.trim() === ''
            return (
              <div
                key={row.id}
                className="space-y-2 rounded-btn border border-surface-border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] font-semibold text-text-secondary">
                    Invoiced client?
                  </span>
                  <Button
                    variant={row.invoiced ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateTravel(row.id, { invoiced: true })}
                  >
                    Yes — full AA
                  </Button>
                  <Button
                    variant={!row.invoiced ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() =>
                      updateTravel(row.id, {
                        invoiced: false,
                        invoiceNo: '',
                        invoiceAmount: '',
                      })
                    }
                  >
                    No — fixed cost
                  </Button>
                  <Badge color={row.invoiced ? 'blue' : 'grey'}>
                    {row.invoiced ? 'Full AA' : 'Fixed'}
                  </Badge>
                  <span className="ml-auto font-mono text-[12.5px] text-text-secondary">
                    {formatRand(rate)}/km · est. {formatRand(amount)}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_1.4fr]">
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
                    <label className={`${FIELD_LABEL} sm:hidden`}>Client</label>
                    <Input
                      aria-label="Travel client name"
                      placeholder="Client"
                      value={row.clientName}
                      error={clientError ? 'Required' : undefined}
                      onChange={(e) =>
                        updateTravel(row.id, { clientName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={`${FIELD_LABEL} sm:hidden`}>Reason</label>
                    <Input
                      aria-label="Reason for travel"
                      placeholder="Reason for travelling"
                      value={row.reason}
                      onChange={(e) => updateTravel(row.id, { reason: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_90px_1fr]">
                  {row.invoiced ? (
                    <>
                      <div>
                        <label className={`${FIELD_LABEL} sm:hidden`}>Invoice no.</label>
                        <Input
                          aria-label="Invoice number"
                          placeholder="Invoice no."
                          value={row.invoiceNo}
                          error={invoiceError ? 'Required' : undefined}
                          onChange={(e) =>
                            updateTravel(row.id, { invoiceNo: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className={`${FIELD_LABEL} sm:hidden`}>
                          Invoice amount
                        </label>
                        <Input
                          aria-label="Invoice amount"
                          type="number"
                          min={0}
                          inputMode="decimal"
                          placeholder="Invoice amount"
                          value={row.invoiceAmount}
                          onChange={(e) =>
                            updateTravel(row.id, { invoiceAmount: e.target.value })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="hidden sm:col-span-2 sm:block" />
                  )}
                  <div>
                    <label className={`${FIELD_LABEL} sm:hidden`}>Km</label>
                    <Input
                      aria-label="Kilometres travelled"
                      type="number"
                      min={0}
                      inputMode="decimal"
                      placeholder="Km"
                      value={row.km}
                      onChange={(e) => updateTravel(row.id, { km: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`${FIELD_LABEL} sm:hidden`}>Total</label>
                    <Input
                      aria-label="Travel line amount"
                      value={formatRand(amount)}
                      readOnly
                      tabIndex={-1}
                      className="bg-surface text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTravelRows((rows) => [...rows, emptyTravelRow()])}
          >
            + Add Travel
          </Button>
          <span className="text-[13px] text-text-secondary">
            Subtotal{' '}
            <strong className="font-mono">{formatRand(totals.totalTravel)}</strong>
          </span>
        </div>
      </Card>

      {/* 3. Advances already paid out */}
      <Card title="Advances Already Paid Out">
        <p className="mb-3 text-[11.5px] text-text-muted">
          Deducted from the total · e.g. petty cash, pre-paid flights.
        </p>
        <div className="space-y-3">
          <div className="hidden grid-cols-[1fr_2fr_1fr] gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted sm:grid">
            <span>Date</span>
            <span>Details</span>
            <span>Amount (R)</span>
          </div>
          {advanceRows.map((row) => {
            const rowError =
              showErrors && row.amount.trim() !== '' && row.details.trim() === ''
            return (
              <div
                key={row.id}
                className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_2fr_1fr]"
              >
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Date</label>
                  <Input
                    aria-label="Advance date"
                    type="date"
                    value={row.date}
                    onChange={(e) => updateAdvance(row.id, { date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Details</label>
                  <Input
                    aria-label="Advance details"
                    placeholder="e.g. Pre-paid flights"
                    value={row.details}
                    error={rowError ? 'Required' : undefined}
                    onChange={(e) => updateAdvance(row.id, { details: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`${FIELD_LABEL} sm:hidden`}>Amount (R)</label>
                  <Input
                    aria-label="Advance amount"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={row.amount}
                    onChange={(e) => updateAdvance(row.id, { amount: e.target.value })}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdvanceRows((rows) => [...rows, emptyAdvanceRow()])}
          >
            + Add Row
          </Button>
          <span className="text-[13px] text-text-secondary">
            Subtotal{' '}
            <strong className="font-mono">
              − {formatRand(totals.totalAdvances)}
            </strong>
          </span>
        </div>
      </Card>

      {/* AA certificate card + editor */}
      <AaCertSection cert={cert} onSave={controller.saveCert} />

      {/* Totals + timesheet + submit */}
      <Card>
        <div className="mb-4 space-y-[6px]">
          <TotalLine label="Expenses incurred" value={formatRand(totals.totalOther)} />
          <TotalLine label="Travel claim" value={formatRand(totals.totalTravel)} />
          <TotalLine
            label="Less advances"
            value={`− ${formatRand(totals.totalAdvances)}`}
          />
          <div className="flex items-center justify-between gap-4 border-t border-surface-border pt-3">
            <span className="font-display text-sm font-bold text-text">
              Grand Total Payable
            </span>
            <span className="font-display text-2xl font-extrabold text-jera-red">
              {formatRand(totals.grandTotal)}
            </span>
          </div>
        </div>

        {/* Attachments — timesheet (always required) + receipt slips (required
            when there are incurred expenses). Submit is blocked until present.
            File names are recorded now; the binary upload lands with SharePoint
            (WS-10/B5) — the pending-storage state. */}
        <div className="mb-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-btn border px-4 py-[11px] text-[13px] font-semibold transition-colors ${
                timesheetName
                  ? 'border-jera-green/40 bg-jera-green/10 text-jera-green'
                  : 'border-dashed border-surface-border bg-surface text-text-secondary hover:bg-surface-border-light'
              }`}
              title="Attach timesheet — file name recorded; storage arrives with SharePoint"
            >
              {timesheetName ? '✓ Timesheet attached' : '📎 Attach timesheet'}
              <input
                type="file"
                accept="image/*,application/pdf,.xlsx,.csv"
                className="sr-only"
                aria-label="Attach timesheet"
                onChange={(e) =>
                  setTimesheetName(e.target.files?.[0]?.name ?? null)
                }
              />
            </label>

            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-btn border px-4 py-[11px] text-[13px] font-semibold transition-colors ${
                slipNames.length > 0
                  ? 'border-jera-green/40 bg-jera-green/10 text-jera-green'
                  : 'border-dashed border-surface-border bg-surface text-text-secondary hover:bg-surface-border-light'
              }`}
              title="Attach receipt slips — file names recorded; storage arrives with SharePoint"
            >
              {slipNames.length > 0
                ? `✓ ${slipNames.length} slip${slipNames.length === 1 ? '' : 's'} attached`
                : '📎 Attach slips'}
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="sr-only"
                aria-label="Attach receipt slips"
                onChange={(e) =>
                  setSlipNames((prev) => [
                    ...prev,
                    ...Array.from(e.target.files ?? []).map((f) => f.name),
                  ])
                }
              />
            </label>
          </div>

          <div className="flex flex-col gap-[2px] text-[11.5px] text-text-muted">
            <span className={timesheetName ? '' : 'text-text-muted'}>
              {timesheetName
                ? `Timesheet: ${timesheetName}`
                : 'Timesheet required — a copy must accompany this claim.'}
            </span>
            <span className="max-w-full truncate">
              {slipNames.length > 0
                ? `Slips: ${slipNames.join(', ')}`
                : totals.totalOther > 0
                  ? 'Receipt slips required for the expenses you incurred.'
                  : 'Slips optional — no expenses incurred on this claim.'}
            </span>
          </div>
        </div>

        {showErrors && timesheetMissing && !submitted ? (
          <p className="mb-3 text-xs font-semibold text-jera-red">
            Attach your timesheet before submitting.
          </p>
        ) : null}
        {showErrors && slipsMissing && !submitted ? (
          <p className="mb-3 text-xs font-semibold text-jera-red">
            Attach receipt slips for your expenses incurred before submitting.
          </p>
        ) : null}

        {submitted ? (
          <div className="flex items-center justify-center gap-2 rounded-btn border border-jera-green/30 bg-jera-green/10 px-4 py-3 text-[13px] font-semibold text-jera-green">
            <Badge color="amber">Submitted</Badge>
            Claim submitted — awaiting finance approval.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              onClick={() => void handleSubmit()}
              isLoading={saving === 'submit'}
              disabled={saving === 'draft'}
            >
              Submit Claim to Finance
            </Button>
            {controller.live ? (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => void handleSaveDraft()}
                isLoading={saving === 'draft'}
                disabled={saving === 'submit'}
              >
                Save draft
              </Button>
            ) : null}
          </div>
        )}
        <p className="mt-3 text-[11.5px] text-text-muted">
          Submit by the {EXPENSE_DEADLINE_DAY}th of the month.
        </p>
      </Card>
    </div>
  )
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-8 text-[13px] text-text-secondary">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

// ── Approver: pending approvals ───────────────────────────────────────────────
function PendingApprovals() {
  const { currentEmployee, role } = useSession()
  const { toast } = useToast()

  const meId = currentEmployee?.id ?? ''
  const isAdmin = role === 'admin'
  const controller = useExpenseApprovals(meId)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const [pendingAction, setPendingAction] = useState<{
    claimId: string
    action: 'approved' | 'returned' | 'paid'
  } | null>(null)

  async function review(claim: ApprovalClaim, decision: 'approved' | 'returned') {
    const notes = notesById[claim.id]?.trim() || null
    setPendingAction({ claimId: claim.id, action: decision })
    try {
      await controller.review(claim.id, decision, notes)
      toast({
        variant: decision === 'approved' ? 'success' : 'error',
        title: decision === 'approved' ? 'Claim approved' : 'Claim returned',
        message:
          decision === 'approved'
            ? `${claim.submitterName} — ${formatRand(claim.grand_total)}. Submitter notified.`
            : `${claim.submitterName}'s claim was sent back for correction.`,
      })
    } catch (e) {
      toast({
        variant: 'error',
        title: "Couldn't save",
        message: saveErrorMessage(e),
      })
    } finally {
      setPendingAction(null)
    }
  }

  async function markPaid(claim: ApprovalClaim) {
    setPendingAction({ claimId: claim.id, action: 'paid' })
    try {
      // Terminal transition (E5): the badge flips to Paid — no toast by design.
      await controller.markPaid(claim.id)
    } catch (e) {
      toast({
        variant: 'error',
        title: "Couldn't save",
        message: saveErrorMessage(e),
      })
    } finally {
      setPendingAction(null)
    }
  }

  function toggleExpand(claimId: string) {
    const next = expandedId === claimId ? null : claimId
    setExpandedId(next)
    if (next) {
      controller.loadLines(next).catch(() => {
        // Line fetch failed — the card shows its loading text; retry on re-open.
      })
    }
  }

  function renderClaimCard(claim: ApprovalClaim) {
    // A submitter never reviews their own claim (self-approve is blocked by the
    // DB trigger; the controls are hidden here — REJ-UI-HIDDEN).
    const actionable = claim.status === 'submitted' && claim.employee_id !== meId
    const lines = controller.linesFor(claim.id)
    const isOpen = expandedId === claim.id
    const badge = STATUS_BADGE[claim.status]
    const busy = pendingAction?.claimId === claim.id ? pendingAction.action : null
    return (
      <Card key={claim.id} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-[15px] font-bold text-text">
              {claim.submitterName}
            </div>
            <div className="text-xs text-text-muted">
              Period {claim.claim_period ?? '—'}
            </div>
            <div className="mt-[2px] font-mono text-[11.5px] text-text-muted">
              Expenses {formatRand(claim.total_other)} + Travel{' '}
              {formatRand(claim.total_travel)} − Advances{' '}
              {formatRand(claim.total_advances)}
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
              onClick={() => toggleExpand(claim.id)}
            >
              {isOpen ? 'Hide lines' : 'View lines'}
            </Button>
          </div>
        </div>

        {isOpen ? (
          <div className="space-y-3 border-t border-surface-border pt-3">
            {lines === null ? (
              <p className="text-[12.5px] text-text-muted">Loading line items…</p>
            ) : (
              <>
                {lines.other.length > 0 ? (
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                      Expenses Incurred
                    </div>
                    <ul className="space-y-1">
                      {lines.other.map((l) => (
                        <li
                          key={l.id}
                          className="flex justify-between gap-3 text-[13px] text-text"
                        >
                          <span className="min-w-0 truncate">
                            {l.client_name}
                            {l.description ? ` · ${l.description}` : ''}
                          </span>
                          <span className="font-semibold">{formatRand(l.amount ?? 0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {lines.travel.length > 0 ? (
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                      Travel
                    </div>
                    <ul className="space-y-1">
                      {lines.travel.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-center justify-between gap-3 text-[13px] text-text"
                        >
                          <span className="flex min-w-0 items-center gap-2 truncate">
                            <Badge color={l.invoiced ? 'blue' : 'grey'}>
                              {l.invoiced ? 'Full AA' : 'Fixed'}
                            </Badge>
                            <span className="min-w-0 truncate">
                              {l.client_name}
                              {l.travel_date ? ` · ${l.travel_date}` : ''}
                              {l.km_traveled != null ? ` · ${l.km_traveled} km` : ''}
                            </span>
                          </span>
                          <span className="font-semibold">{formatRand(l.amount ?? 0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {lines.advances.length > 0 ? (
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                      Advances (Deducted)
                    </div>
                    <ul className="space-y-1">
                      {lines.advances.map((l) => (
                        <li
                          key={l.id}
                          className="flex justify-between gap-3 text-[13px] text-text"
                        >
                          <span className="min-w-0 truncate">
                            {l.details}
                            {l.advance_date ? ` · ${l.advance_date}` : ''}
                          </span>
                          <span className="font-semibold">
                            − {formatRand(l.amount ?? 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
            <div className="text-[11.5px] text-text-muted">
              📎 Timesheet: {claim.timesheet_filename ?? 'not attached'}
            </div>
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
              <Button
                onClick={() => void review(claim, 'approved')}
                isLoading={busy === 'approved'}
                disabled={busy !== null && busy !== 'approved'}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => void review(claim, 'returned')}
                isLoading={busy === 'returned'}
                disabled={busy !== null && busy !== 'returned'}
              >
                Return for correction
              </Button>
            </div>
          </div>
        ) : (
          <>
            {claim.review_notes ? (
              <p className="border-t border-surface-border pt-3 text-xs text-text-muted">
                <strong className="text-text-secondary">Notes:</strong>{' '}
                {claim.review_notes}
              </p>
            ) : null}
            {/* Mark paid is ADMIN-ONLY (managers approve but never pay — E5). */}
            {isAdmin && claim.status === 'approved' ? (
              <div className="border-t border-surface-border pt-3">
                <Button
                  size="sm"
                  onClick={() => void markPaid(claim)}
                  isLoading={busy === 'paid'}
                >
                  Mark paid
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>
    )
  }

  if (controller.loading) {
    return (
      <Card>
        <p className="text-[13px] text-text-muted">Loading expense claims…</p>
      </Card>
    )
  }

  if (controller.error) {
    return (
      <Card>
        <p className="mb-3 text-[13px] text-jera-red">
          Could not load expense claims ({controller.error}).
        </p>
        <Button variant="secondary" size="sm" onClick={controller.reload}>
          Try again
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-3 font-display text-sm font-bold text-text">
          Awaiting your review ({controller.pending.length})
        </h2>
        {controller.pending.length === 0 ? (
          <Card>
            <p className="text-[13px] text-text-muted">
              No claims are waiting for your approval right now.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {controller.pending.map((c) => renderClaimCard(c))}
          </div>
        )}
      </div>

      {controller.reviewed.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-sm font-bold text-text">
            Recently reviewed
          </h2>
          <div className="space-y-3">
            {controller.reviewed.map((c) => renderClaimCard(c))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { role } = useSession()

  // Managers and admins can approve expenses (capability `approveExpenses`).
  const isApprover = can(role, 'approveExpenses')

  return (
    <AppShell>
      <PageHeader
        eyebrow="Finance"
        title="Expense Claims"
        subtitle="Expenses, travel (AA rate) & advances — submit with your timesheet for finance approval."
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
