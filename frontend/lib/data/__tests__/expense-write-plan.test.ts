// WS-4: the pure form <-> DB mapping behind useExpenses. These tests pin the
// money rules the outcome contract certifies: AA-rate resolution (full rate for
// invoiced, fixed cost for non-invoiced), single-rounding (rate unrounded, the
// line amount rounds once), non-negative clamps, and the grand-total identity
// the DB CHECK enforces (grand = other + travel − advances).
import { describe, it, expect } from 'vitest'

import {
  advanceLineToRow,
  buildClaimWritePlan,
  otherLineToRow,
  travelLineToRow,
  type AdvanceRow,
  type ClaimFormRows,
  type OtherRow,
  type TravelRow,
} from '../useExpenses'
import type {
  ExpenseAdvanceLine,
  ExpenseOtherLine,
  ExpenseTravelLine,
} from '@/types/database'

const RATES = { full_rate: 6.05, fixed_cost: 4.59 }
const META = { period: '2026-07', timesheetName: 'timesheet-jul.pdf' }

const travelRow = (over: Partial<TravelRow> = {}): TravelRow => ({
  id: 't1',
  clientName: 'Acme',
  date: '2026-07-01',
  reason: 'Site visit',
  invoiced: true,
  invoiceNo: 'INV-1',
  invoiceAmount: '1000',
  km: '100',
  ...over,
})

const otherRow = (over: Partial<OtherRow> = {}): OtherRow => ({
  id: 'o1',
  clientName: 'Acme',
  date: '2026-07-02',
  description: 'Parking',
  amount: '50',
  receiptName: 'slip.pdf',
  ...over,
})

const advanceRow = (over: Partial<AdvanceRow> = {}): AdvanceRow => ({
  id: 'a1',
  date: '2026-07-03',
  details: 'Petty cash',
  amount: '20',
  ...over,
})

const rows = (over: Partial<ClaimFormRows> = {}): ClaimFormRows => ({
  travel: [],
  other: [],
  advances: [],
  ...over,
})

describe('buildClaimWritePlan — AA-rate resolution', () => {
  it('bills invoiced travel at the full AA rate with rate_basis full_aa', () => {
    const plan = buildClaimWritePlan(
      rows({ travel: [travelRow({ invoiced: true })] }),
      RATES,
      META,
    )
    expect(plan.travel).toHaveLength(1)
    expect(plan.travel[0].rate_per_km).toBe(6.05)
    expect(plan.travel[0].rate_basis).toBe('full_aa')
    expect(plan.travel[0].amount).toBe(605)
  })

  it('bills non-invoiced travel at the fixed cost and nulls invoice fields', () => {
    const plan = buildClaimWritePlan(
      rows({
        travel: [
          travelRow({ invoiced: false, invoiceNo: 'STRAY', invoiceAmount: '9' }),
        ],
      }),
      RATES,
      META,
    )
    expect(plan.travel[0].rate_per_km).toBe(4.59)
    expect(plan.travel[0].rate_basis).toBe('fixed_cost')
    expect(plan.travel[0].invoice_no).toBeNull()
    expect(plan.travel[0].invoice_amount).toBeNull()
    expect(plan.travel[0].amount).toBe(459)
  })
})

describe('buildClaimWritePlan — money rules', () => {
  it('rounds once per line (km × rate, then round — the rate is not pre-rounded)', () => {
    // A cert rate with 3 decimals: 100 km × 6.055 = 605.50. Pre-rounding the
    // rate (6.06 or 6.05) would give 606/605 — the double-rounding bug.
    const plan = buildClaimWritePlan(
      rows({ travel: [travelRow({ km: '100' })] }),
      { full_rate: 6.055, fixed_cost: 4.59 },
      META,
    )
    expect(plan.travel[0].rate_per_km).toBe(6.055)
    expect(plan.travel[0].amount).toBe(605.5)
    expect(plan.totals.totalTravel).toBe(605.5)
  })

  it('clamps negative inputs to zero (a pasted "-100" cannot offset a claim)', () => {
    const plan = buildClaimWritePlan(
      rows({
        travel: [travelRow({ km: '-50' })],
        other: [otherRow({ amount: '-100' })],
        advances: [advanceRow({ amount: '-20' })],
      }),
      RATES,
      META,
    )
    expect(plan.travel[0].km_traveled).toBe(0)
    expect(plan.travel[0].amount).toBe(0)
    expect(plan.other[0].amount).toBe(0)
    expect(plan.advances[0].amount).toBe(0)
    expect(plan.totals.grandTotal).toBe(0)
  })

  it('keeps the DB grand-total identity: grand = other + travel − advances', () => {
    const plan = buildClaimWritePlan(
      rows({
        travel: [travelRow({ km: '100' })],
        other: [otherRow({ amount: '0.1' }), otherRow({ id: 'o2', amount: '0.2' })],
        advances: [advanceRow({ amount: '605.3' })],
      }),
      RATES,
      META,
    )
    const { total_other, total_travel, total_advances, grand_total } = plan.claim
    expect(total_other).toBe(0.3)
    expect(total_travel).toBe(605)
    expect(total_advances).toBe(605.3)
    expect(grand_total).toBe(0)
    // The identity the CHECK constraint verifies, on the rounded figures:
    expect(Math.round((total_other + total_travel - total_advances) * 100) / 100).toBe(
      grand_total,
    )
  })

  it('allows a negative grand total when advances exceed the claim', () => {
    const plan = buildClaimWritePlan(
      rows({ other: [otherRow({ amount: '50' })], advances: [advanceRow({ amount: '80' })] }),
      RATES,
      META,
    )
    expect(plan.claim.grand_total).toBe(-30)
  })
})

describe('buildClaimWritePlan — row filtering + claim metadata', () => {
  it('skips valueless rows (blank km / blank amounts) and keeps sort order', () => {
    const plan = buildClaimWritePlan(
      rows({
        travel: [travelRow({ km: '' }), travelRow({ id: 't2', km: '10' })],
        other: [otherRow({ amount: '' }), otherRow({ id: 'o2', amount: '5' })],
        advances: [advanceRow({ amount: '' })],
      }),
      RATES,
      META,
    )
    expect(plan.travel).toHaveLength(1)
    expect(plan.travel[0].sort_order).toBe(0)
    expect(plan.other).toHaveLength(1)
    expect(plan.advances).toHaveLength(0)
  })

  it('carries period + timesheet metadata (empty period -> null)', () => {
    const plan = buildClaimWritePlan(rows(), RATES, { period: '', timesheetName: null })
    expect(plan.claim.claim_period).toBeNull()
    expect(plan.claim.timesheet_filename).toBeNull()
    const plan2 = buildClaimWritePlan(rows(), RATES, META)
    expect(plan2.claim.claim_period).toBe('2026-07')
    expect(plan2.claim.timesheet_filename).toBe('timesheet-jul.pdf')
  })

  it('trims the invoice number on invoiced lines and never sends empty string', () => {
    const plan = buildClaimWritePlan(
      rows({ travel: [travelRow({ invoiceNo: '  INV-9  ' })] }),
      RATES,
      META,
    )
    expect(plan.travel[0].invoice_no).toBe('INV-9')
    const blank = buildClaimWritePlan(
      rows({ travel: [travelRow({ invoiceNo: '   ' })] }),
      RATES,
      META,
    )
    // The screen's submit gate blocks this case; the plan still nulls it so a
    // draft save can never write an empty-string invoice reference.
    expect(blank.travel[0].invoice_no).toBeNull()
  })
})

describe('DB line -> form row hydration', () => {
  it('round-trips a travel line', () => {
    const line: ExpenseTravelLine = {
      id: 'tl-1',
      claim_id: 'c-1',
      client_name: 'Acme',
      travel_date: '2026-07-01',
      reason: 'Site visit',
      invoiced: true,
      invoice_no: 'INV-1',
      invoice_amount: 1000,
      rate_basis: 'full_aa',
      rate_per_km: 6.05,
      km_traveled: 100,
      amount: 605,
      sort_order: 0,
      created_at: '2026-07-01T00:00:00Z',
    }
    const row = travelLineToRow(line)
    expect(row).toEqual({
      id: 'tl-1',
      clientName: 'Acme',
      date: '2026-07-01',
      reason: 'Site visit',
      invoiced: true,
      invoiceNo: 'INV-1',
      invoiceAmount: '1000',
      km: '100',
    })
    const plan = buildClaimWritePlan(rows({ travel: [row] }), RATES, META)
    expect(plan.travel[0].amount).toBe(605)
  })

  it('maps null fields to empty inputs on other + advance lines', () => {
    const other: ExpenseOtherLine = {
      id: 'ol-1',
      claim_id: 'c-1',
      client_name: 'Acme',
      expense_date: null,
      description: null,
      amount: null,
      receipt_url: null,
      sort_order: 0,
      created_at: '2026-07-01T00:00:00Z',
    }
    expect(otherLineToRow(other)).toEqual({
      id: 'ol-1',
      clientName: 'Acme',
      date: '',
      description: '',
      amount: '',
      receiptName: null,
    })
    const advance: ExpenseAdvanceLine = {
      id: 'al-1',
      claim_id: 'c-1',
      advance_date: '2026-07-03',
      details: 'Petty cash',
      amount: 20,
      sort_order: 0,
      created_at: '2026-07-01T00:00:00Z',
    }
    expect(advanceLineToRow(advance)).toEqual({
      id: 'al-1',
      date: '2026-07-03',
      details: 'Petty cash',
      amount: '20',
    })
  })
})
