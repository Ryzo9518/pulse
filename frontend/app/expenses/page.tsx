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
// (capability `approveExpenses`).
//
// Mock phase: there are no per-claim line mutators yet, so the submitted form
// and approval state live in component state. Reads (seed claims, lines, and the
// AA certificate) come from the accessor layer; the AA cert editor persists via
// the saveAaRateCertificate mutator.

import { useMemo, useState } from 'react'

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
  getAaRateCertificate,
  getEmployee,
  listExpenseAdvanceLines,
  listExpenseClaims,
  listExpenseOtherLines,
  listExpenseTravelLines,
  saveAaRateCertificate,
} from '@/lib/mock'
import { can } from '@/lib/capabilities'
import { EXPENSE_DEADLINE_DAY } from '@/lib/constants'
import {
  claimTotals,
  formatRand,
  travelLineAmount,
  travelRateForLine,
  type AaRates,
} from '@/lib/expenseCalc'
import type {
  AaRateCertificate,
  ExpenseClaim,
  ExpenseStatus,
} from '@/types/database'

// ── Local form row models (pre-submit, string-backed like real inputs) ────────
interface OtherRow {
  id: string
  clientName: string
  date: string
  description: string
  amount: string
  receiptName: string | null
}

interface TravelRow {
  id: string
  clientName: string
  date: string
  reason: string
  invoiced: boolean
  invoiceNo: string
  invoiceAmount: string
  km: string
}

interface AdvanceRow {
  id: string
  date: string
  details: string
  amount: string
}

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
  employeeId,
  cert,
  onSaved,
}: {
  employeeId: string
  cert: AaRateCertificate | null
  onSaved: (cert: AaRateCertificate) => void
}) {
  const { toast } = useToast()
  const [editorOpen, setEditorOpen] = useState(false)
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

  function save() {
    if (!draft) return
    const num = (v: string, fb: number) => {
      const n = parseFloat(v)
      return Number.isFinite(n) && n > 0 ? n : fb
    }
    const saved = saveAaRateCertificate(employeeId, {
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
    onSaved(saved)
    setEditorOpen(false)
    toast({
      variant: 'success',
      title: 'AA certificate saved',
      message: `${saved.make} ${saved.model} — full ${formatRand(
        saved.full_rate,
      )}/km, fixed ${formatRand(saved.fixed_cost)}/km.`,
    })
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
            <Button onClick={save}>Save certificate</Button>
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
  const [cert, setCert] = useState<AaRateCertificate | null>(() =>
    employeeId ? getAaRateCertificate(employeeId) : null,
  )
  const rates: AaRates = cert
    ? { full_rate: cert.full_rate, fixed_cost: cert.fixed_cost }
    : FALLBACK_RATES

  const [otherRows, setOtherRows] = useState<OtherRow[]>([emptyOtherRow()])
  const [travelRows, setTravelRows] = useState<TravelRow[]>([emptyTravelRow()])
  const [advanceRows, setAdvanceRows] = useState<AdvanceRow[]>([emptyAdvanceRow()])
  const [period, setPeriod] = useState('')
  const [timesheetName, setTimesheetName] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

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

  function updateOther(id: string, patch: Partial<OtherRow>) {
    setOtherRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function updateTravel(id: string, patch: Partial<TravelRow>) {
    setTravelRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function updateAdvance(id: string, patch: Partial<AdvanceRow>) {
    setAdvanceRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function handleSubmit() {
    if (
      otherMissingClient ||
      travelMissingClient ||
      travelMissingInvoiceNo ||
      advanceMissingDetails
    ) {
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
    setSubmitted(true)
    toast({
      variant: 'success',
      title: 'Expense claim submitted',
      message: `Grand total ${formatRand(totals.grandTotal)} sent to finance for approval.`,
    })
  }

  return (
    <div className="mx-auto max-w-[820px] space-y-4">
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
      <AaCertSection
        employeeId={employeeId}
        cert={cert}
        onSaved={(c) => setCert(c)}
      />

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

        {/* Timesheet attach control — submit is blocked until attached */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-btn border px-4 py-[11px] text-[13px] font-semibold transition-colors ${
              timesheetName
                ? 'border-jera-green/40 bg-jera-green/10 text-jera-green'
                : 'border-dashed border-surface-border bg-surface text-text-secondary hover:bg-surface-border-light'
            }`}
            title="Attach timesheet (mock)"
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
          {timesheetName ? (
            <span className="max-w-[220px] truncate text-[11px] text-text-muted">
              {timesheetName}
            </span>
          ) : (
            <span className="text-[11.5px] text-text-muted">
              Required — a copy of your timesheet must accompany this claim.
            </span>
          )}
        </div>

        {showErrors && timesheetMissing && !submitted ? (
          <p className="mb-3 text-xs font-semibold text-jera-red">
            Attach your timesheet before submitting.
          </p>
        ) : null}

        {submitted ? (
          <div className="flex items-center justify-center gap-2 rounded-btn border border-jera-green/30 bg-jera-green/10 px-4 py-3 text-[13px] font-semibold text-jera-green">
            <Badge color="amber">Submitted</Badge>
            Claim submitted — awaiting finance approval.
          </div>
        ) : (
          <Button fullWidth onClick={handleSubmit}>
            Submit Claim to Finance
          </Button>
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

  function review(claimId: string, decision: 'approved' | 'returned') {
    const notes = notesById[claimId]?.trim() || null
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, localStatus: decision, localNotes: notes } : c,
      ),
    )
    const claim = claims.find((c) => c.id === claimId)
    toast({
      variant: decision === 'approved' ? 'success' : 'error',
      title: decision === 'approved' ? 'Claim approved' : 'Claim returned',
      message:
        decision === 'approved'
          ? `${claim?.submitterName ?? 'Claim'} — ${formatRand(
              claim?.grand_total ?? 0,
            )}. Submitter notified.`
          : `${claim?.submitterName ?? 'Claim'}'s claim was sent back for correction.`,
    })
  }

  function renderClaimCard(claim: ApproverClaimRow, actionable: boolean) {
    const travel = listExpenseTravelLines(claim.id)
    const other = listExpenseOtherLines(claim.id)
    const advances = listExpenseAdvanceLines(claim.id)
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
              onClick={() => setExpandedId(isOpen ? null : claim.id)}
            >
              {isOpen ? 'Hide lines' : 'View lines'}
            </Button>
          </div>
        </div>

        {isOpen ? (
          <div className="space-y-3 border-t border-surface-border pt-3">
            {other.length > 0 ? (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                  Expenses Incurred
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
                      <span className="font-semibold">{formatRand(l.amount ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {travel.length > 0 ? (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                  Travel
                </div>
                <ul className="space-y-1">
                  {travel.map((l) => (
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
            {advances.length > 0 ? (
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                  Advances (Deducted)
                </div>
                <ul className="space-y-1">
                  {advances.map((l) => (
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
              <Button onClick={() => review(claim.id, 'approved')}>Approve</Button>
              <Button
                variant="secondary"
                onClick={() => review(claim.id, 'returned')}
              >
                Return for correction
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
          <div className="space-y-3">{pending.map((c) => renderClaimCard(c, true))}</div>
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
