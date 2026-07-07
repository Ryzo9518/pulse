'use client'

// Expenses data controllers (WS-4). Behind NEXT_PUBLIC_PULSE_DATA=live the
// submitter and approver sides of app/expenses read and write the five expense
// tables through the authenticated /api/rest proxy (RLS-scoped, statechart
// triggers on the DB decide what actually changes). Otherwise both fall back to
// the mock seam, preserving the mock-phase behaviour so dev mode keeps working.
//
// Money rules live in lib/expenseCalc (single source of truth): AA-rate
// resolution (full rate for invoiced travel, fixed cost for non-invoiced),
// single-rounding (rate stays unrounded; the line amount rounds once), and
// non-negative clamps. This module only maps form rows <-> DB rows; it never
// re-implements the math.
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getAaRateCertificate as mockGetCert,
  getEmployee as mockGetEmployee,
  listExpenseAdvanceLines as mockAdvanceLines,
  listExpenseClaims as mockListClaims,
  listExpenseOtherLines as mockOtherLines,
  listExpenseTravelLines as mockTravelLines,
  saveAaRateCertificate as mockSaveCert,
} from '@/lib/mock'
import {
  claimTotals,
  sumLineAmounts,
  travelLineAmount,
  travelRateBasis,
  travelRateForLine,
  type AaRates,
  type ClaimTotals,
} from '@/lib/expenseCalc'
import type {
  AaRateCertificate,
  ExpenseAdvanceLine,
  ExpenseClaim,
  ExpenseOtherLine,
  ExpenseStatus,
  ExpenseTravelLine,
} from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

/** True when the expenses screens run against live data (exported for the UI
 * to show live-only affordances like "Save draft"). */
export const EXPENSES_LIVE = LIVE

// ── Form row models (string-backed, like real inputs) ────────────────────────
// Shared by the screen (which edits them) and the write-plan builder below.
export interface OtherRow {
  id: string
  clientName: string
  date: string
  description: string
  amount: string
  receiptName: string | null
}

export interface TravelRow {
  id: string
  clientName: string
  date: string
  reason: string
  invoiced: boolean
  invoiceNo: string
  invoiceAmount: string
  km: string
}

export interface AdvanceRow {
  id: string
  date: string
  details: string
  amount: string
}

export interface ClaimFormRows {
  travel: TravelRow[]
  other: OtherRow[]
  advances: AdvanceRow[]
}

export interface ClaimMeta {
  /** Claim period from the month input, e.g. "2026-07" (empty -> null). */
  period: string
  /** Timesheet attachment file name (metadata only — storage is WS-10/B5). */
  timesheetName: string | null
}

// ── Write plan (pure, unit-tested) ────────────────────────────────────────────
// DB line payloads (id/claim_id/created_at are server-side).
export type TravelLinePayload = Omit<ExpenseTravelLine, 'id' | 'claim_id' | 'created_at'>
export type OtherLinePayload = Omit<ExpenseOtherLine, 'id' | 'claim_id' | 'created_at'>
export type AdvanceLinePayload = Omit<ExpenseAdvanceLine, 'id' | 'claim_id' | 'created_at'>

export interface ClaimWritePlan {
  totals: ClaimTotals
  /** The expense_claims column patch (totals + period + timesheet metadata). */
  claim: {
    claim_period: string | null
    total_other: number
    total_travel: number
    total_advances: number
    grand_total: number
    timesheet_filename: string | null
  }
  travel: TravelLinePayload[]
  other: OtherLinePayload[]
  advances: AdvanceLinePayload[]
}

/** A row only persists when it carries a value; valueless rows contribute R0
 * and are skipped (they also can't satisfy the DB's line CHECK constraints). */
const hasValue = (s: string) => s.trim() !== ''

/**
 * Map the three-part form to DB payloads + claim totals. Totals come from
 * claimTotals (rounded once per figure), so the persisted grand_total always
 * satisfies the DB CHECK grand = other + travel − advances. Travel lines
 * resolve their per-km rate from the AA certificate via the invoiced toggle
 * and round once on the line amount (rate_per_km is stored as charged).
 */
export function buildClaimWritePlan(
  rows: ClaimFormRows,
  rates: AaRates,
  meta: ClaimMeta,
): ClaimWritePlan {
  const totals = claimTotals(
    rows.travel.map((r) => ({ km: r.km, invoiced: r.invoiced })),
    rows.other.map((r) => ({ amount: r.amount })),
    rows.advances.map((r) => ({ amount: r.amount })),
    rates,
  )

  const travel = rows.travel.filter((r) => hasValue(r.km)).map((r, i): TravelLinePayload => {
    const rate = travelRateForLine(r.invoiced, rates)
    return {
      client_name: r.clientName.trim(),
      travel_date: r.date || null,
      reason: r.reason.trim() || null,
      invoiced: r.invoiced,
      invoice_no: r.invoiced ? r.invoiceNo.trim() || null : null,
      invoice_amount:
        r.invoiced && hasValue(r.invoiceAmount)
          ? sumLineAmounts([r.invoiceAmount])
          : null,
      rate_basis: travelRateBasis(r.invoiced),
      rate_per_km: rate,
      km_traveled: sumLineAmounts([r.km]),
      amount: travelLineAmount(r.km, rate),
      sort_order: i,
    }
  })

  const other = rows.other.filter((r) => hasValue(r.amount)).map((r, i): OtherLinePayload => ({
    client_name: r.clientName.trim(),
    expense_date: r.date || null,
    description: r.description.trim() || null,
    amount: sumLineAmounts([r.amount]),
    // Metadata only until SharePoint (WS-10/B5): the file name is recorded so
    // the claim is auditable; the binary upload is the pending-storage state.
    receipt_url: r.receiptName,
    sort_order: i,
  }))

  const advances = rows.advances.filter((r) => hasValue(r.amount)).map((r, i): AdvanceLinePayload => ({
    advance_date: r.date || null,
    details: r.details.trim() || null,
    amount: sumLineAmounts([r.amount]),
    sort_order: i,
  }))

  return {
    totals,
    claim: {
      claim_period: meta.period.trim() || null,
      total_other: totals.totalOther,
      total_travel: totals.totalTravel,
      total_advances: totals.totalAdvances,
      grand_total: totals.grandTotal,
      timesheet_filename: meta.timesheetName,
    },
    travel,
    other,
    advances,
  }
}

// ── Hydration (DB lines -> form rows, pure) ───────────────────────────────────
export function travelLineToRow(l: ExpenseTravelLine): TravelRow {
  return {
    id: l.id,
    clientName: l.client_name,
    date: l.travel_date ?? '',
    reason: l.reason ?? '',
    invoiced: l.invoiced,
    invoiceNo: l.invoice_no ?? '',
    invoiceAmount: l.invoice_amount === null ? '' : String(l.invoice_amount),
    km: l.km_traveled === null ? '' : String(l.km_traveled),
  }
}

export function otherLineToRow(l: ExpenseOtherLine): OtherRow {
  return {
    id: l.id,
    clientName: l.client_name,
    date: l.expense_date ?? '',
    description: l.description ?? '',
    amount: l.amount === null ? '' : String(l.amount),
    receiptName: l.receipt_url,
  }
}

export function advanceLineToRow(l: ExpenseAdvanceLine): AdvanceRow {
  return {
    id: l.id,
    date: l.advance_date ?? '',
    details: l.details ?? '',
    amount: l.amount === null ? '' : String(l.amount),
  }
}

// ── Proxy helpers ─────────────────────────────────────────────────────────────
async function readJson<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) throw new Error(`${what} (${res.status})`)
  return (await res.json()) as T
}

/** Extract the DB's own raise/error text (MSG-DENY-TRIGGER) when present, so
 * the trigger's message surfaces in the failed-write toast; otherwise generic. */
async function writeError(res: Response): Promise<Error> {
  try {
    const body = (await res.json()) as { message?: unknown }
    if (body && typeof body.message === 'string' && body.message.trim() !== '') {
      return new Error(body.message)
    }
  } catch {
    // fall through to the generic error
  }
  return new Error('Something went wrong — your changes were not saved. Try again.')
}

async function proxyWrite(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  prefer = 'return=minimal',
): Promise<Response> {
  const res = await fetch(`/api/rest/${path}`, {
    method,
    headers:
      body === undefined
        ? { Prefer: prefer }
        : { 'Content-Type': 'application/json', Prefer: prefer },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw await writeError(res)
  return res
}

const LINE_TABLES = [
  'expense_travel_lines',
  'expense_other_lines',
  'expense_advance_lines',
] as const

/** Replace a claim's lines wholesale (delete-then-insert while draft/returned). */
async function replaceLines(claimId: string, plan: ClaimWritePlan): Promise<void> {
  const enc = encodeURIComponent(claimId)
  for (const t of LINE_TABLES) {
    await proxyWrite(`${t}?claim_id=eq.${enc}`, 'DELETE')
  }
  const inserts: Array<[string, object[]]> = [
    ['expense_travel_lines', plan.travel],
    ['expense_other_lines', plan.other],
    ['expense_advance_lines', plan.advances],
  ]
  for (const [table, lines] of inserts) {
    if (lines.length === 0) continue
    await proxyWrite(
      table,
      'POST',
      lines.map((l) => ({ ...l, claim_id: claimId })),
    )
  }
}

// ── Submitter controller ──────────────────────────────────────────────────────
export interface ClaimLines {
  travel: ExpenseTravelLine[]
  other: ExpenseOtherLine[]
  advances: ExpenseAdvanceLine[]
}

export interface MyClaimController {
  live: boolean
  /** The signed-in person's AA rate certificate (rates drive travel math). */
  cert: AaRateCertificate | null
  /** The latest editable claim (status draft/returned), if any. */
  activeClaim: ExpenseClaim | null
  /** The active claim's lines mapped to form rows, ready to hydrate the form. */
  activeRows: ClaimFormRows | null
  /** The latest claim when it is submitted (awaiting review) — read-only view. */
  submittedClaim: ExpenseClaim | null
  loading: boolean
  error: string | null
  /** Upsert the AA certificate (live: via proxy; mock: in-memory). */
  saveCert: (
    input: Parameters<typeof mockSaveCert>[1],
  ) => Promise<AaRateCertificate>
  /** Persist the claim + lines as a draft (live only; mock resolves quietly). */
  saveDraft: (rows: ClaimFormRows, meta: ClaimMeta) => Promise<void>
  /** Persist then transition draft/returned -> submitted (T-EXP-1 / T-EXP-4). */
  submit: (rows: ClaimFormRows, meta: ClaimMeta) => Promise<void>
  reload: () => void
}

export function useMyExpenseClaim(employeeId: string): MyClaimController {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<{
    cert: AaRateCertificate | null
    activeClaim: ExpenseClaim | null
    activeRows: ClaimFormRows | null
    submittedClaim: ExpenseClaim | null
    loading: boolean
    error: string | null
  }>(() => ({
    cert: LIVE ? null : employeeId ? mockGetCert(employeeId) : null,
    activeClaim: null,
    activeRows: null,
    submittedClaim: null,
    loading: LIVE,
    error: null,
  }))
  // The claim being edited (also covers the just-created draft before refetch).
  const activeIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!LIVE || !employeeId) return
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    const enc = encodeURIComponent(employeeId)
    Promise.all([
      fetch(`/api/rest/aa_rate_certificates?employee_id=eq.${enc}&limit=1`, {
        cache: 'no-store',
      }).then((r) => readJson<AaRateCertificate[]>(r, 'AA certificate')),
      fetch(
        `/api/rest/expense_claims?employee_id=eq.${enc}&order=created_at.desc&limit=10`,
        { cache: 'no-store' },
      ).then((r) => readJson<ExpenseClaim[]>(r, 'claims')),
    ])
      .then(async ([certs, claims]) => {
        const latest = claims[0] ?? null
        const editable =
          latest && (latest.status === 'draft' || latest.status === 'returned')
            ? latest
            : null
        let rows: ClaimFormRows | null = null
        if (editable) {
          const cid = encodeURIComponent(editable.id)
          const [travel, other, advances] = await Promise.all([
            fetch(`/api/rest/expense_travel_lines?claim_id=eq.${cid}&order=sort_order`, {
              cache: 'no-store',
            }).then((r) => readJson<ExpenseTravelLine[]>(r, 'travel lines')),
            fetch(`/api/rest/expense_other_lines?claim_id=eq.${cid}&order=sort_order`, {
              cache: 'no-store',
            }).then((r) => readJson<ExpenseOtherLine[]>(r, 'expense lines')),
            fetch(`/api/rest/expense_advance_lines?claim_id=eq.${cid}&order=sort_order`, {
              cache: 'no-store',
            }).then((r) => readJson<ExpenseAdvanceLine[]>(r, 'advance lines')),
          ])
          rows = {
            travel: travel.map(travelLineToRow),
            other: other.map(otherLineToRow),
            advances: advances.map(advanceLineToRow),
          }
        }
        if (!active) return
        activeIdRef.current = editable?.id ?? null
        setState({
          cert: certs[0] ?? null,
          activeClaim: editable,
          activeRows: rows,
          submittedClaim: latest?.status === 'submitted' ? latest : null,
          loading: false,
          error: null,
        })
      })
      .catch((e: unknown) => {
        if (active) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load',
          }))
        }
      })
    return () => {
      active = false
    }
  }, [employeeId, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const saveCert = useCallback(
    async (input: Parameters<typeof mockSaveCert>[1]) => {
      if (!LIVE) {
        const saved = mockSaveCert(employeeId, input)
        setState((s) => ({ ...s, cert: saved }))
        return saved
      }
      const res = await proxyWrite(
        'aa_rate_certificates?on_conflict=employee_id',
        'POST',
        { employee_id: employeeId, uploaded: true, ...input },
        'resolution=merge-duplicates,return=representation',
      )
      const rows = (await res.json()) as AaRateCertificate[]
      const saved = rows[0]
      if (!saved) throw new Error('Certificate did not save')
      setState((s) => ({ ...s, cert: saved }))
      return saved
    },
    [employeeId],
  )

  /** Create-or-update the draft claim + replace its lines; returns the claim id. */
  const persistDraft = useCallback(
    async (rows: ClaimFormRows, meta: ClaimMeta): Promise<string> => {
      const cert = state.cert
      const rates: AaRates = cert
        ? { full_rate: cert.full_rate, fixed_cost: cert.fixed_cost }
        : { full_rate: 0, fixed_cost: 0 }
      const plan = buildClaimWritePlan(rows, rates, meta)
      let claimId = activeIdRef.current
      if (claimId) {
        await proxyWrite(
          `expense_claims?id=eq.${encodeURIComponent(claimId)}`,
          'PATCH',
          plan.claim,
        )
      } else {
        const res = await proxyWrite(
          'expense_claims',
          'POST',
          { employee_id: employeeId, ...plan.claim },
          'return=representation',
        )
        const created = (await res.json()) as ExpenseClaim[]
        claimId = created[0]?.id ?? null
        if (!claimId) throw new Error('Claim did not save')
        activeIdRef.current = claimId
      }
      await replaceLines(claimId, plan)
      return claimId
    },
    [employeeId, state.cert],
  )

  const saveDraft = useCallback(
    async (rows: ClaimFormRows, meta: ClaimMeta) => {
      if (!LIVE) return // mock phase: drafts live in component state only
      await persistDraft(rows, meta)
      reload()
    },
    [persistDraft, reload],
  )

  const submit = useCallback(
    async (rows: ClaimFormRows, meta: ClaimMeta) => {
      if (!LIVE) return // mock phase: the screen shows the submitted banner
      const claimId = await persistDraft(rows, meta)
      // Real statechart edge: draft/returned -> submitted (T-EXP-1 / T-EXP-4).
      await proxyWrite(
        `expense_claims?id=eq.${encodeURIComponent(claimId)}`,
        'PATCH',
        { status: 'submitted', submitted_at: new Date().toISOString() },
      )
      activeIdRef.current = null
      reload()
    },
    [persistDraft, reload],
  )

  return {
    live: LIVE,
    cert: state.cert,
    activeClaim: state.activeClaim,
    activeRows: state.activeRows,
    submittedClaim: state.submittedClaim,
    loading: state.loading,
    error: state.error,
    saveCert,
    saveDraft,
    submit,
    reload,
  }
}

// ── Approver controller ───────────────────────────────────────────────────────
export interface ApprovalClaim extends ExpenseClaim {
  submitterName: string
}

interface ClaimEmbedRow extends ExpenseClaim {
  submitter: { display_name: string } | null
}

export interface ApprovalsController {
  live: boolean
  /** Submitted claims awaiting review (RLS: admin sees all, manager team-only). */
  pending: ApprovalClaim[]
  /** Recently reviewed claims (approved / returned / paid). */
  reviewed: ApprovalClaim[]
  loading: boolean
  error: string | null
  /** Line items for an expanded claim (null until loadLines resolves). */
  linesFor: (claimId: string) => ClaimLines | null
  loadLines: (claimId: string) => Promise<void>
  /** Approve or return a submitted claim (T-EXP-2 / T-EXP-3). */
  review: (
    claimId: string,
    decision: 'approved' | 'returned',
    notes: string | null,
  ) => Promise<void>
  /** Admin-only terminal transition approved -> paid (T-EXP-5). */
  markPaid: (claimId: string) => Promise<void>
  reload: () => void
}

export function useExpenseApprovals(reviewerId: string): ApprovalsController {
  const [tick, setTick] = useState(0)
  const [claims, setClaims] = useState<ApprovalClaim[]>([])
  const [loading, setLoading] = useState(LIVE)
  const [error, setError] = useState<string | null>(null)
  const [linesById, setLinesById] = useState<Record<string, ClaimLines>>({})

  useEffect(() => {
    if (!LIVE) {
      // Mock seam: seed claims with submitter names; review mutates local state.
      setClaims(
        mockListClaims().map((c) => ({
          ...c,
          submitterName: mockGetEmployee(c.employee_id)?.display_name ?? c.employee_id,
        })),
      )
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    fetch(
      '/api/rest/expense_claims?status=neq.draft&order=created_at.desc&limit=50' +
        '&select=*,submitter:employees!expense_claims_employee_id_fkey(display_name)',
      { cache: 'no-store' },
    )
      .then((r) => readJson<ClaimEmbedRow[]>(r, 'claims'))
      .then((rows) => {
        if (!active) return
        setClaims(
          rows.map(({ submitter, ...c }) => ({
            ...c,
            submitterName: submitter?.display_name ?? c.employee_id,
          })),
        )
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (active) {
          setLoading(false)
          setError(e instanceof Error ? e.message : 'Failed to load')
        }
      })
    return () => {
      active = false
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const linesFor = useCallback(
    (claimId: string) => linesById[claimId] ?? null,
    [linesById],
  )

  const loadLines = useCallback(
    async (claimId: string) => {
      if (!LIVE) {
        setLinesById((prev) =>
          prev[claimId]
            ? prev
            : {
                ...prev,
                [claimId]: {
                  travel: mockTravelLines(claimId),
                  other: mockOtherLines(claimId),
                  advances: mockAdvanceLines(claimId),
                },
              },
        )
        return
      }
      if (linesById[claimId]) return
      const cid = encodeURIComponent(claimId)
      const [travel, other, advances] = await Promise.all([
        fetch(`/api/rest/expense_travel_lines?claim_id=eq.${cid}&order=sort_order`, {
          cache: 'no-store',
        }).then((r) => readJson<ExpenseTravelLine[]>(r, 'travel lines')),
        fetch(`/api/rest/expense_other_lines?claim_id=eq.${cid}&order=sort_order`, {
          cache: 'no-store',
        }).then((r) => readJson<ExpenseOtherLine[]>(r, 'expense lines')),
        fetch(`/api/rest/expense_advance_lines?claim_id=eq.${cid}&order=sort_order`, {
          cache: 'no-store',
        }).then((r) => readJson<ExpenseAdvanceLine[]>(r, 'advance lines')),
      ])
      setLinesById((prev) => ({ ...prev, [claimId]: { travel, other, advances } }))
    },
    [linesById],
  )

  const setLocalStatus = useCallback(
    (claimId: string, status: ExpenseStatus, notes: string | null) => {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? { ...c, status, review_notes: notes ?? c.review_notes }
            : c,
        ),
      )
    },
    [],
  )

  const review = useCallback(
    async (claimId: string, decision: 'approved' | 'returned', notes: string | null) => {
      if (!LIVE) {
        setLocalStatus(claimId, decision, notes)
        return
      }
      await proxyWrite(`expense_claims?id=eq.${encodeURIComponent(claimId)}`, 'PATCH', {
        status: decision,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      reload()
    },
    [reviewerId, reload, setLocalStatus],
  )

  const markPaid = useCallback(
    async (claimId: string) => {
      if (!LIVE) {
        setLocalStatus(claimId, 'paid', null)
        return
      }
      await proxyWrite(`expense_claims?id=eq.${encodeURIComponent(claimId)}`, 'PATCH', {
        status: 'paid',
      })
      reload()
    },
    [reload, setLocalStatus],
  )

  return {
    live: LIVE,
    pending: claims.filter((c) => c.status === 'submitted'),
    reviewed: claims.filter((c) => c.status !== 'submitted'),
    loading,
    error,
    linesFor,
    loadLines,
    review,
    markPaid,
    reload,
  }
}
