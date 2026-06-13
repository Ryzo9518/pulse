import { describe, expect, it } from 'vitest'
import {
  travelLineAmount,
  sumLineAmounts,
  claimTotals,
  formatRand,
} from '../expenseCalc'
import { SARS_KM_RATE } from '@/lib/constants'

describe('travelLineAmount', () => {
  it('computes R150.00 for a 100 km travel line at the SARS rate', () => {
    expect(SARS_KM_RATE).toBe(1.5)
    expect(travelLineAmount(100)).toBe(150)
    expect(formatRand(travelLineAmount(100))).toBe('R150.00')
  })

  it('returns 0 (never NaN) for 0 km, empty, null, or undefined input', () => {
    expect(travelLineAmount(0)).toBe(0)
    expect(travelLineAmount('')).toBe(0)
    expect(travelLineAmount(null)).toBe(0)
    expect(travelLineAmount(undefined)).toBe(0)
    expect(Number.isNaN(travelLineAmount(''))).toBe(false)
    expect(Number.isNaN(travelLineAmount(NaN))).toBe(false)
    expect(formatRand(travelLineAmount(''))).toBe('R0.00')
  })

  it('rounds a fractional km to a 2-decimal amount', () => {
    // 33.333 km * 1.50 = 49.9995 -> 50.00
    const amount = travelLineAmount(33.333)
    expect(amount).toBe(50)
    expect(formatRand(amount)).toBe('R50.00')

    // 12.5 km * 1.50 = 18.75 (exact 2-decimal)
    expect(travelLineAmount(12.5)).toBe(18.75)
    expect(formatRand(travelLineAmount(12.5))).toBe('R18.75')

    // 7.777 km * 1.50 = 11.6655 -> 11.67
    expect(travelLineAmount(7.777)).toBe(11.67)
  })

  it('accepts a custom rate but defaults to SARS_KM_RATE', () => {
    expect(travelLineAmount(10, 2)).toBe(20)
    expect(travelLineAmount(10)).toBe(15)
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

describe('claimTotals', () => {
  it('grand total sums travel + other lines correctly', () => {
    const travel = [{ km: 120 }, { km: 120 }] // 180 + 180 = 360
    const other = [{ amount: 45 }, { amount: 185.5 }] // 230.50
    const totals = claimTotals(travel, other)

    expect(totals.totalTravel).toBe(360)
    expect(totals.totalOther).toBe(230.5)
    expect(totals.grandTotal).toBe(590.5)
    expect(formatRand(totals.grandTotal)).toBe('R590.50')
  })

  it('returns all-zero totals (never NaN) for empty claims', () => {
    const totals = claimTotals([], [])
    expect(totals.totalTravel).toBe(0)
    expect(totals.totalOther).toBe(0)
    expect(totals.grandTotal).toBe(0)
    expect(Number.isNaN(totals.grandTotal)).toBe(false)
  })

  it('ignores empty km / empty amount rows without producing NaN', () => {
    const travel = [{ km: '' }, { km: 100 }] // 0 + 150
    const other = [{ amount: '' }, { amount: 50 }] // 0 + 50
    const totals = claimTotals(travel, other)
    expect(totals.totalTravel).toBe(150)
    expect(totals.totalOther).toBe(50)
    expect(totals.grandTotal).toBe(200)
    expect(Number.isNaN(totals.grandTotal)).toBe(false)
  })

  it('honours a per-line rate override on travel lines', () => {
    const travel = [{ km: 10, rate: 2 }] // 20
    const totals = claimTotals(travel, [])
    expect(totals.totalTravel).toBe(20)
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
