// ── Expense money helpers ────────────────────────────────────────────────────
// The single source of truth for expense math. Pure functions only — no React,
// no I/O. All amounts are South African Rand, rounded to 2 decimals, and never
// NaN: empty strings, null, undefined, and NaN inputs all coerce to 0 so a
// half-filled form never renders "RNaN".
//
// A claim is THREE parts (HANDOFF §4):
//   expenses incurred (receipts) + travel (AA rate) − advances already paid.
// Travel reimburses at the per-person AA Vehicle Rates Certificate: the FULL AA
// rate for travel invoiced to a client, the FIXED-COST rate for non-invoiced
// travel (DECISION D2: non-invoiced travel IS claimable, at the fixed rate).

import type { TravelRateBasis } from '@/types/database'

/** Anything a numeric form field might hold before it's a clean number. */
export type NumericInput = number | string | null | undefined

/** The two per-km rates that come from a person's AA Rate Certificate. */
export interface AaRates {
  /** Full AA rate — applies to travel invoiced to a client. */
  full_rate: NumericInput
  /** Fixed-cost rate — applies to non-invoiced travel. */
  fixed_cost: NumericInput
}

/** A travel line's billable inputs (km + invoiced toggle, with optional rate override). */
export interface TravelLineInput {
  km: NumericInput
  /** Invoiced -> full AA rate; non-invoiced -> fixed-cost rate. */
  invoiced: boolean
  /**
   * Explicit per-line rate override. When omitted, the rate is resolved from
   * `rates` via the `invoiced` toggle. Used for pre-computed seed lines.
   */
  rate?: NumericInput
}

/** An "other expense" line's billable input. */
export interface OtherLineInput {
  amount: NumericInput
}

/** An advance line's input (deducted from the grand total). */
export interface AdvanceLineInput {
  amount: NumericInput
}

export interface ClaimTotals {
  totalOther: number
  totalTravel: number
  totalAdvances: number
  /** totalOther + totalTravel − totalAdvances. */
  grandTotal: number
}

/** Round to 2 decimals, killing floating-point noise (e.g. 0.1 + 0.2). */
function round2(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Coerce any form value to a finite number; empty/invalid -> 0 (never NaN). */
function toNumber(value: NumericInput): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Coerce a numeric INPUT magnitude (km, a line amount, a rate) to a finite,
 * non-negative number. Use for user-entered quantities that are never legitimately
 * negative — a mistyped/pasted "-100" must not silently offset a claim. NOTE: do
 * not use this on computed totals (e.g. the grand total, which may be negative
 * when advances exceed the claim).
 */
function toAmount(value: NumericInput): number {
  return Math.max(0, toNumber(value))
}

/**
 * Which rate basis applies to a travel line: invoiced travel claims the full AA
 * rate; non-invoiced travel claims the fixed-cost rate (D2).
 */
export function travelRateBasis(invoiced: boolean): TravelRateBasis {
  return invoiced ? 'full_aa' : 'fixed_cost'
}

/**
 * Resolve the per-km rate for a travel line from a person's AA certificate.
 * Invoiced -> full AA rate; non-invoiced -> fixed-cost rate.
 */
export function travelRateForLine(invoiced: boolean, rates: AaRates): number {
  // Not pre-rounded: rounding happens once, on the line amount, so a rate with
  // more than 2 decimals doesn't double-round (km * rate then round).
  return toAmount(invoiced ? rates.full_rate : rates.fixed_cost)
}

/**
 * Amount for a single travel line: km * rate, rounded to 2 decimals. km and rate
 * are clamped non-negative (a negative km can't offset the claim). Empty/0/invalid
 * -> 0.
 */
export function travelLineAmount(km: NumericInput, rate: NumericInput): number {
  return round2(toAmount(km) * toAmount(rate))
}

/**
 * Sum a list of amounts to a 2-decimal total. Accepts raw numeric inputs or
 * objects with an `amount` field. Empty/invalid entries contribute 0.
 */
export function sumLineAmounts(
  lines: ReadonlyArray<NumericInput | { amount: NumericInput }>,
): number {
  const total = lines.reduce<number>((sum, line) => {
    const raw =
      line !== null && typeof line === 'object' ? line.amount : (line as NumericInput)
    // Clamp non-negative: a negative receipt/advance entry can't offset the claim.
    return sum + toAmount(raw)
  }, 0)
  return round2(total)
}

/**
 * Claim totals for the three-part model:
 *   grand = sum(other) + sum(travel) − sum(advances).
 * Travel amounts are derived from km * rate, where the rate is the explicit
 * per-line override when present, else resolved from `rates` via the line's
 * invoiced toggle. All four figures are 2-decimal, never NaN.
 */
export function claimTotals(
  travel: ReadonlyArray<TravelLineInput>,
  other: ReadonlyArray<OtherLineInput>,
  advances: ReadonlyArray<AdvanceLineInput>,
  rates: AaRates,
): ClaimTotals {
  const totalTravel = round2(
    travel.reduce((sum, line) => {
      // A per-line override only counts when it's a real positive rate; 0/blank
      // means "not set" and we resolve from the cert via the invoiced toggle
      // (so a stray 0 can't silently zero out a billable line).
      const override = toAmount(line.rate)
      const rate = override > 0 ? override : travelRateForLine(line.invoiced, rates)
      return sum + travelLineAmount(line.km, rate)
    }, 0),
  )
  const totalOther = sumLineAmounts(other)
  const totalAdvances = sumLineAmounts(advances)
  return {
    totalOther,
    totalTravel,
    totalAdvances,
    grandTotal: round2(totalOther + totalTravel - totalAdvances),
  }
}

/** Format a Rand amount as "R0.00" (2 decimals, never "RNaN"). */
export function formatRand(amount: NumericInput): string {
  return `R${round2(toNumber(amount)).toFixed(2)}`
}
