import { describe, expect, it } from 'vitest'
import {
  travelLineAmount,
  travelRateBasis,
  travelRateForLine,
  sumLineAmounts,
  claimTotals,
  formatRand,
  type AaRates,
} from '../expenseCalc'

// A representative AA certificate (Sarah's, from the prototype aaCert).
const RATES: AaRates = { full_rate: 6.05, fixed_cost: 4.59 }

describe('travelRateBasis', () => {
  it('invoiced travel uses the full AA rate basis', () => {
    expect(travelRateBasis(true)).toBe('full_aa')
  })
  it('non-invoiced travel uses the fixed-cost basis (D2: still claimable)', () => {
    expect(travelRateBasis(false)).toBe('fixed_cost')
  })
})

describe('travelRateForLine', () => {
  it('invoiced -> full AA rate; non-invoiced -> fixed-cost rate', () => {
    expect(travelRateForLine(true, RATES)).toBe(6.05)
    expect(travelRateForLine(false, RATES)).toBe(4.59)
  })
  it('coerces missing/blank rates to 0 (never NaN)', () => {
    expect(travelRateForLine(true, { full_rate: '', fixed_cost: 4.59 })).toBe(0)
    expect(travelRateForLine(false, { full_rate: 6.05, fixed_cost: null })).toBe(0)
    expect(
      Number.isNaN(travelRateForLine(true, { full_rate: '', fixed_cost: '' })),
    ).toBe(false)
  })
})

describe('travelLineAmount', () => {
  it('computes km * rate at the supplied rate', () => {
    // 120 km invoiced at the full AA rate 6.05 = 726.00
    expect(travelLineAmount(120, 6.05)).toBe(726)
    expect(formatRand(travelLineAmount(120, 6.05))).toBe('R726.00')
    // 86 km non-invoiced at the fixed cost 4.59 = 394.74
    expect(travelLineAmount(86, 4.59)).toBe(394.74)
  })

  it('returns 0 (never NaN) for 0 km, empty, null, or undefined input', () => {
    expect(travelLineAmount(0, 6.05)).toBe(0)
    expect(travelLineAmount('', 6.05)).toBe(0)
    expect(travelLineAmount(null, 6.05)).toBe(0)
    expect(travelLineAmount(undefined, 6.05)).toBe(0)
    expect(Number.isNaN(travelLineAmount('', 6.05))).toBe(false)
    expect(Number.isNaN(travelLineAmount(NaN, NaN))).toBe(false)
    expect(formatRand(travelLineAmount('', 6.05))).toBe('R0.00')
  })

  it('rounds a fractional result to a 2-decimal amount', () => {
    // 7.777 km * 1.50 = 11.6655 -> 11.67
    expect(travelLineAmount(7.777, 1.5)).toBe(11.67)
    // 12.5 km * 1.50 = 18.75 (exact)
    expect(travelLineAmount(12.5, 1.5)).toBe(18.75)
  })
})

describe('sumLineAmounts', () => {
  it('sums amounts to a 2-decimal total, ignoring empty/NaN entries', () => {
    expect(sumLineAmounts([45, 185.5])).toBe(230.5)
    expect(sumLineAmounts([{ amount: 45 }, { amount: 185.5 }])).toBe(230.5)
    expect(sumLineAmounts([{ amount: '' }, { amount: 10 }])).toBe(10)
    expect(sumLineAmounts([])).toBe(0)
    expect(Number.isNaN(sumLineAmounts([{ amount: '' }]))).toBe(false)
  })

  it('avoids floating-point noise (0.1 + 0.2 -> 0.3)', () => {
    expect(sumLineAmounts([0.1, 0.2])).toBe(0.3)
  })
})

describe('claimTotals (three-part: incurred + travel − advances)', () => {
  it('grand total = expenses incurred + travel − advances', () => {
    // Sarah's prototype claim:
    //   expenses incurred = 680 + 1499.99 = 2179.99
    //   travel = 120*6.05 (invoiced) + 86*4.59 (non-invoiced) = 726 + 394.74 = 1120.74
    //   advances = 3276
    const other = [{ amount: 680 }, { amount: 1499.99 }]
    const travel = [
      { km: 120, invoiced: true },
      { km: 86, invoiced: false },
    ]
    const advances = [{ amount: 3276 }]
    const totals = claimTotals(travel, other, advances, RATES)

    expect(totals.totalOther).toBe(2179.99)
    expect(totals.totalTravel).toBe(1120.74)
    expect(totals.totalAdvances).toBe(3276)
    // 2179.99 + 1120.74 − 3276 = 24.73
    expect(totals.grandTotal).toBe(24.73)
    expect(formatRand(totals.grandTotal)).toBe('R24.73')
  })

  it('selects full AA rate for invoiced and fixed cost for non-invoiced travel', () => {
    const invoicedOnly = claimTotals([{ km: 100, invoiced: true }], [], [], RATES)
    expect(invoicedOnly.totalTravel).toBe(605) // 100 * 6.05

    const fixedOnly = claimTotals([{ km: 100, invoiced: false }], [], [], RATES)
    expect(fixedOnly.totalTravel).toBe(459) // 100 * 4.59
  })

  it('returns all-zero totals (never NaN) for an empty claim', () => {
    const totals = claimTotals([], [], [], RATES)
    expect(totals.totalOther).toBe(0)
    expect(totals.totalTravel).toBe(0)
    expect(totals.totalAdvances).toBe(0)
    expect(totals.grandTotal).toBe(0)
    expect(Number.isNaN(totals.grandTotal)).toBe(false)
  })

  it('ignores empty km / amount rows without producing NaN', () => {
    const travel = [
      { km: '', invoiced: true },
      { km: 100, invoiced: true },
    ]
    const other = [{ amount: '' }, { amount: 50 }]
    const advances = [{ amount: '' }, { amount: 20 }]
    const totals = claimTotals(travel, other, advances, RATES)
    expect(totals.totalTravel).toBe(605)
    expect(totals.totalOther).toBe(50)
    expect(totals.totalAdvances).toBe(20)
    expect(totals.grandTotal).toBe(635) // 50 + 605 − 20
    expect(Number.isNaN(totals.grandTotal)).toBe(false)
  })

  it('honours a per-line rate override on a travel line (seed lines)', () => {
    const travel = [{ km: 10, invoiced: true, rate: 2 }] // override -> 20, not 60.5
    const totals = claimTotals(travel, [], [], RATES)
    expect(totals.totalTravel).toBe(20)
  })

  it('advances can exceed the claim, producing a negative grand total', () => {
    const totals = claimTotals(
      [{ km: 10, invoiced: false }], // 45.90
      [{ amount: 100 }],
      [{ amount: 500 }],
      RATES,
    )
    expect(totals.grandTotal).toBe(-354.1) // 100 + 45.90 − 500
  })
})

describe('formatRand', () => {
  it('always renders two decimals with an R prefix', () => {
    expect(formatRand(0)).toBe('R0.00')
    expect(formatRand(150)).toBe('R150.00')
    expect(formatRand(150.5)).toBe('R150.50')
    expect(formatRand(1234.5)).toBe('R1234.50')
  })

  it('never renders NaN', () => {
    expect(formatRand(NaN)).toBe('R0.00')
  })
})

// ── Adversarial edge cases (review hardening) ─────────────────────────────────
describe('money-math hardening', () => {
  it('a >2-decimal rate is not double-rounded (km*rate rounded once)', () => {
    // 100 * 6.055 = 605.5, NOT 606 (which a pre-rounded 6.06 rate would give).
    expect(travelLineAmount(100, travelRateForLine(true, { full_rate: 6.055, fixed_cost: 4.59 }))).toBe(605.5)
  })

  it('negative km cannot offset a claim (clamped to 0)', () => {
    expect(travelLineAmount(-100, 6.05)).toBe(0)
    const totals = claimTotals(
      [{ km: -100, invoiced: true }],
      [{ amount: 200 }],
      [],
      RATES,
    )
    expect(totals.totalTravel).toBe(0)
    expect(totals.grandTotal).toBe(200)
  })

  it('a negative receipt/advance amount is clamped to 0', () => {
    expect(sumLineAmounts([{ amount: -50 }, { amount: 100 }])).toBe(100)
  })

  it('a per-line rate override of 0 resolves from the certificate, not R0', () => {
    // Override 0 must not silently zero a billable invoiced line.
    const totals = claimTotals([{ km: 100, invoiced: true, rate: 0 }], [], [], RATES)
    expect(totals.totalTravel).toBe(605) // 100 * 6.05 full AA rate
  })

  it('a missing full rate (cert with 0) resolves to 0 for an invoiced line (caller must gate submit)', () => {
    // The page blocks submit on this; the calc itself reports the honest 0.
    expect(travelRateForLine(true, { full_rate: 0, fixed_cost: 4.59 })).toBe(0)
  })
})
