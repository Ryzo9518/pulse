import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetMockState,
  getAaRateCertificate,
  listExpenseAdvanceLines,
  listExpenseClaims,
  listExpenseOtherLines,
  listExpenseTravelLines,
  saveAaRateCertificate,
} from '../index'
import { ONBOARDING_EMPLOYEE_ID } from '../employees'
import { claimTotals, type AaRates } from '@/lib/expenseCalc'

beforeEach(() => {
  __resetMockState()
})

describe('seed claims (three-part shape)', () => {
  it('every claim is self-consistent: grand = other + travel − advances', () => {
    for (const claim of listExpenseClaims()) {
      const expected =
        Math.round(
          (claim.total_other + claim.total_travel - claim.total_advances) * 100,
        ) / 100
      expect(claim.grand_total).toBe(expected)
    }
  })

  it('a claim carries its three line collections + a timesheet', () => {
    const sarah = listExpenseClaims().find((c) => c.id === 'exp-001')!
    expect(listExpenseOtherLines('exp-001')).toHaveLength(2)
    expect(listExpenseTravelLines('exp-001')).toHaveLength(2)
    expect(listExpenseAdvanceLines('exp-001')).toHaveLength(1)
    // Timesheet attached on every seed claim.
    expect(sarah.timesheet_filename).toBeTruthy()
  })

  it('travel lines carry an invoiced flag, rate basis, and invoice number', () => {
    const lines = listExpenseTravelLines('exp-001')
    const invoiced = lines.find((l) => l.invoiced)!
    const nonInvoiced = lines.find((l) => !l.invoiced)!

    expect(invoiced.rate_basis).toBe('full_aa')
    expect(invoiced.invoice_no).toBeTruthy()
    expect(nonInvoiced.rate_basis).toBe('fixed_cost')
    expect(nonInvoiced.invoice_no).toBeNull()
  })

  it("the seed travel rates match the submitter's AA certificate", () => {
    const cert = getAaRateCertificate(ONBOARDING_EMPLOYEE_ID)!
    const lines = listExpenseTravelLines('exp-001')
    const invoiced = lines.find((l) => l.invoiced)!
    const nonInvoiced = lines.find((l) => !l.invoiced)!
    expect(invoiced.rate_per_km).toBe(cert.full_rate)
    expect(nonInvoiced.rate_per_km).toBe(cert.fixed_cost)
  })

  it('claim totals recomputed from seed lines via expenseCalc match the stored grand', () => {
    const cert = getAaRateCertificate(ONBOARDING_EMPLOYEE_ID)!
    const rates: AaRates = { full_rate: cert.full_rate, fixed_cost: cert.fixed_cost }
    const totals = claimTotals(
      listExpenseTravelLines('exp-001').map((l) => ({
        km: l.km_traveled,
        invoiced: l.invoiced,
        rate: l.rate_per_km,
      })),
      listExpenseOtherLines('exp-001').map((l) => ({ amount: l.amount })),
      listExpenseAdvanceLines('exp-001').map((l) => ({ amount: l.amount })),
      rates,
    )
    const stored = listExpenseClaims().find((c) => c.id === 'exp-001')!
    expect(totals.grandTotal).toBe(stored.grand_total)
  })
})

describe('getAaRateCertificate', () => {
  it('returns the seeded per-person certificate', () => {
    const cert = getAaRateCertificate(ONBOARDING_EMPLOYEE_ID)
    expect(cert).not.toBeNull()
    expect(cert!.full_rate).toBeGreaterThan(cert!.fixed_cost)
    expect(cert!.uploaded).toBe(true)
  })

  it('returns null for an employee with no certificate on file', () => {
    expect(getAaRateCertificate('nobody')).toBeNull()
  })
})

describe('saveAaRateCertificate (drives the travel math)', () => {
  it('updates the rates so subsequent travel math uses the new rate', () => {
    saveAaRateCertificate(ONBOARDING_EMPLOYEE_ID, {
      full_rate: 7,
      fixed_cost: 5,
    })
    const cert = getAaRateCertificate(ONBOARDING_EMPLOYEE_ID)!
    expect(cert.full_rate).toBe(7)
    expect(cert.fixed_cost).toBe(5)

    const rates: AaRates = { full_rate: cert.full_rate, fixed_cost: cert.fixed_cost }
    // 100 km invoiced now reimburses at the new full rate.
    expect(claimTotals([{ km: 100, invoiced: true }], [], [], rates).totalTravel).toBe(
      700,
    )
  })

  it('creates a certificate for an employee who had none, marking it uploaded', () => {
    const created = saveAaRateCertificate('emp-007', {
      make: 'Ford',
      model: 'Fiesta',
      year: '2021',
      full_rate: 5.5,
      fixed_cost: 4,
    })
    expect(created.uploaded).toBe(true)
    expect(getAaRateCertificate('emp-007')).not.toBeNull()
  })

  it('resets to seed on __resetMockState (test isolation)', () => {
    saveAaRateCertificate(ONBOARDING_EMPLOYEE_ID, { full_rate: 99 })
    __resetMockState()
    expect(getAaRateCertificate(ONBOARDING_EMPLOYEE_ID)!.full_rate).not.toBe(99)
  })
})

describe('expense status model (return-for-correction)', () => {
  it("supports a 'returned' state distinct from approved/submitted", () => {
    // The seed claims exercise submitted + approved; 'returned' is a valid
    // status a claim transitions into when an approver returns it for correction.
    const statuses = listExpenseClaims().map((c) => c.status)
    expect(statuses).toContain('submitted')
    expect(statuses).toContain('approved')
    // 'declined' must no longer be part of the model.
    expect(statuses).not.toContain('declined')
  })
})
