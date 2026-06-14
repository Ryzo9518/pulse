// ── Expense money helpers ────────────────────────────────────────────────────
// The single source of truth for expense math. Pure functions only — no React,
// no I/O. All amounts are South African Rand, rounded to 2 decimals, and never
// NaN: empty strings, null, undefined, and NaN inputs all coerce to 0 so a
// half-filled form never renders "RNaN".

import { SARS_KM_RATE } from '@/lib/constants'

/** Anything a numeric form field might hold before it's a clean number. */
export type NumericInput = number | string | null | undefined

/** A travel line's billable inputs (km, with an optional per-line rate override). */
export interface TravelLineInput {
  km: NumericInput
  /** Per-km rate; defaults to SARS_KM_RATE when omitted. */
  rate?: NumericInput
}

/** An "other expense" line's billable input. */
export interface OtherLineInput {
  amount: NumericInput
}

export interface ClaimTotals {
  totalTravel: number
  totalOther: number
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
 * Amount for a single travel line: km * rate, rounded to 2 decimals.
 * Empty/0/invalid km -> 0. Rate defaults to SARS_KM_RATE.
 */
export function travelLineAmount(
  km: NumericInput,
  rate: NumericInput = SARS_KM_RATE,
): number {
  return round2(toNumber(km) * toNumber(rate))
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
    return sum + toNumber(raw)
  }, 0)
  return round2(total)
}

/**
 * Claim totals: sum(travel amounts) + sum(other amounts) -> grand total.
 * Travel amounts are derived from km * rate via travelLineAmount, so this is the
 * one place claim math lives. All three figures are 2-decimal, never NaN.
 */
export function claimTotals(
  travel: ReadonlyArray<TravelLineInput>,
  other: ReadonlyArray<OtherLineInput>,
): ClaimTotals {
  const totalTravel = round2(
    travel.reduce((sum, line) => sum + travelLineAmount(line.km, line.rate), 0),
  )
  const totalOther = sumLineAmounts(other)
  return {
    totalTravel,
    totalOther,
    grandTotal: round2(totalTravel + totalOther),
  }
}

/** Format a Rand amount as "R0.00" (2 decimals, never "RNaN"). */
export function formatRand(amount: NumericInput): string {
  return `R${round2(toNumber(amount)).toFixed(2)}`
}
