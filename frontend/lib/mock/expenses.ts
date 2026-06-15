// Mock expense seed data — three-part claims + AA Rate Certificates.
//
// A claim is: expenses incurred (receipts) + travel (AA rate) − advances.
// Travel amounts use the per-person AA certificate rate selected by the
// invoiced toggle: invoiced -> full AA rate, non-invoiced -> fixed cost.
// grand_total = total_other + total_travel − total_advances (HANDOFF §4).
//
// Figures mirror the prototype's EXPENSE_CLAIMS / aaCert / VEHICLE
// (docs/prototype/Pulse.dc.html).

import type {
  AaRateCertificate,
  ExpenseClaim,
  ExpenseTravelLine,
  ExpenseOtherLine,
  ExpenseAdvanceLine,
} from '@/types/database'
import { ONBOARDING_EMPLOYEE_ID, ADMIN_EMPLOYEE_ID } from './employees'

const NOW = '2026-06-13T08:00:00.000Z'

// Helper: round to 2 decimals to avoid floating-point noise in money math.
const money = (n: number) => Math.round(n * 100) / 100

// ── AA Rate Certificates (per person) ─────────────────────────────────────────
// Seeded from the prototype's aaCert (Sarah) and a second consultant. The rates
// here DRIVE the travel math for that person's claim.
const sarahCert: AaRateCertificate = {
  id: 'aa-001',
  employee_id: ONBOARDING_EMPLOYEE_ID,
  make: 'Volkswagen',
  model: 'Polo 1.0 TSI',
  year: '2023',
  registration: 'JDK 482 GP',
  full_rate: 6.05,
  fixed_cost: 4.59,
  running_cost: 1.52,
  fuel_price: 21.74,
  file_name: 'AA_Rate_Certificate_SvdBerg.pdf',
  issued_date: '2026-05-02',
  uploaded: true,
  created_at: NOW,
  updated_at: NOW,
}

const thandiweCert: AaRateCertificate = {
  id: 'aa-002',
  employee_id: 'emp-006',
  make: 'Toyota',
  model: 'Corolla 1.8',
  year: '2022',
  registration: 'TND 119 GP',
  full_rate: 6.12,
  fixed_cost: 4.71,
  running_cost: 1.58,
  fuel_price: 21.74,
  file_name: 'AA_Rate_Certificate_TNkosi.pdf',
  issued_date: '2026-04-18',
  uploaded: true,
  created_at: NOW,
  updated_at: NOW,
}

export const aaRateCertificates: AaRateCertificate[] = [sarahCert, thandiweCert]

// ── Claim 1: Sarah (onboarding employee), submitted, awaiting approval ──
// Prototype: expenses 2179.99, travel 1121.74, advances 3276.
const claim1Travel: ExpenseTravelLine[] = [
  {
    id: 'etl-001',
    claim_id: 'exp-001',
    client_name: 'Acme Foods (Pty) Ltd',
    travel_date: '2026-06-04',
    reason: 'On-site Sage X3 implementation workshop',
    invoiced: true,
    invoice_no: 'INV-20418',
    invoice_amount: 18500,
    rate_basis: 'full_aa',
    rate_per_km: sarahCert.full_rate, // 6.05 → invoiced
    km_traveled: 120,
    amount: money(120 * sarahCert.full_rate), // 726.00
    sort_order: 1,
    created_at: NOW,
  },
  {
    id: 'etl-002',
    claim_id: 'exp-001',
    client_name: 'Strandveld',
    travel_date: '2026-06-09',
    reason: 'Demo with Sage',
    invoiced: false,
    invoice_no: null,
    invoice_amount: null,
    rate_basis: 'fixed_cost',
    rate_per_km: sarahCert.fixed_cost, // 4.59 → non-invoiced
    km_traveled: 86,
    amount: money(86 * sarahCert.fixed_cost), // 394.74
    sort_order: 2,
    created_at: NOW,
  },
]

const claim1Other: ExpenseOtherLine[] = [
  {
    id: 'eol-001',
    claim_id: 'exp-001',
    client_name: 'Acme Foods (Pty) Ltd',
    expense_date: '2026-06-04',
    description: 'Storewell for laptop bag at client site',
    amount: 680,
    receipt_url: null,
    sort_order: 1,
    created_at: NOW,
  },
  {
    id: 'eol-002',
    claim_id: 'exp-001',
    client_name: 'LinkedIn Sales Navigator',
    expense_date: '2026-06-09',
    description: 'For leads',
    amount: 1499.99,
    receipt_url: null,
    sort_order: 2,
    created_at: NOW,
  },
]

const claim1Advances: ExpenseAdvanceLine[] = [
  {
    id: 'ead-001',
    claim_id: 'exp-001',
    advance_date: '2026-06-11',
    details: 'Flights to and from Johannesburg',
    amount: 3276,
    sort_order: 1,
    created_at: NOW,
  },
]

const claim1TravelTotal = money(claim1Travel.reduce((s, l) => s + (l.amount ?? 0), 0))
const claim1OtherTotal = money(claim1Other.reduce((s, l) => s + (l.amount ?? 0), 0))
const claim1AdvancesTotal = money(
  claim1Advances.reduce((s, l) => s + (l.amount ?? 0), 0),
)

const claim1: ExpenseClaim = {
  id: 'exp-001',
  employee_id: ONBOARDING_EMPLOYEE_ID,
  claim_period: '2026-06',
  status: 'submitted',
  total_other: claim1OtherTotal,
  total_travel: claim1TravelTotal,
  total_advances: claim1AdvancesTotal,
  grand_total: money(claim1OtherTotal + claim1TravelTotal - claim1AdvancesTotal),
  timesheet_filename: 'Timesheet_June2026_SvdBerg.pdf',
  submitted_at: '2026-06-10T10:30:00.000Z',
  approver_id: ADMIN_EMPLOYEE_ID,
  reviewed_by: null,
  reviewed_at: null,
  review_notes: null,
  created_at: NOW,
  updated_at: NOW,
}

// ── Claim 2: Thandiwe (consultant), approved ──
// Prototype: expenses 940, travel 1530.65, advances 0.
const claim2Travel: ExpenseTravelLine[] = [
  {
    id: 'etl-003',
    claim_id: 'exp-002',
    client_name: 'Brightline Manufacturing',
    travel_date: '2026-05-21',
    reason: 'Quarterly Sage 300 People payroll review',
    invoiced: true,
    invoice_no: 'INV-20377',
    invoice_amount: 24200,
    rate_basis: 'full_aa',
    rate_per_km: thandiweCert.full_rate, // 6.12
    km_traveled: 250.1,
    amount: money(250.1 * thandiweCert.full_rate), // 1530.61
    sort_order: 1,
    created_at: NOW,
  },
]

const claim2Other: ExpenseOtherLine[] = [
  {
    id: 'eol-003',
    claim_id: 'exp-002',
    client_name: 'Brightline Manufacturing',
    expense_date: '2026-05-21',
    description: 'Toll fees (N3) and parking',
    amount: 940,
    receipt_url: null,
    sort_order: 1,
    created_at: NOW,
  },
]

const claim2Advances: ExpenseAdvanceLine[] = []

const claim2TravelTotal = money(claim2Travel.reduce((s, l) => s + (l.amount ?? 0), 0))
const claim2OtherTotal = money(claim2Other.reduce((s, l) => s + (l.amount ?? 0), 0))
const claim2AdvancesTotal = money(
  claim2Advances.reduce((s, l) => s + (l.amount ?? 0), 0),
)

const claim2: ExpenseClaim = {
  id: 'exp-002',
  employee_id: 'emp-006',
  claim_period: '2026-05',
  status: 'approved',
  total_other: claim2OtherTotal,
  total_travel: claim2TravelTotal,
  total_advances: claim2AdvancesTotal,
  grand_total: money(claim2OtherTotal + claim2TravelTotal - claim2AdvancesTotal),
  timesheet_filename: 'Timesheet_May2026_TNkosi.pdf',
  submitted_at: '2026-05-24T14:00:00.000Z',
  approver_id: ADMIN_EMPLOYEE_ID,
  reviewed_by: ADMIN_EMPLOYEE_ID,
  reviewed_at: '2026-05-25T09:15:00.000Z',
  review_notes: 'Approved. Receipts and timesheet attached, within policy.',
  created_at: NOW,
  updated_at: NOW,
}

export const expenseClaims: ExpenseClaim[] = [claim1, claim2]
export const expenseTravelLines: ExpenseTravelLine[] = [
  ...claim1Travel,
  ...claim2Travel,
]
export const expenseOtherLines: ExpenseOtherLine[] = [
  ...claim1Other,
  ...claim2Other,
]
export const expenseAdvanceLines: ExpenseAdvanceLine[] = [
  ...claim1Advances,
  ...claim2Advances,
]
