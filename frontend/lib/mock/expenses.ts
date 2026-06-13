// Mock expense claim seed data — claims + travel/other lines.
// Travel amounts = km_traveled * SARS_KM_RATE; grand_total = total_travel + total_other.

import type {
  ExpenseClaim,
  ExpenseTravelLine,
  ExpenseOtherLine,
} from '@/types/database'
import { SARS_KM_RATE } from '@/lib/constants'
import { ONBOARDING_EMPLOYEE_ID, ADMIN_EMPLOYEE_ID } from './employees'

const NOW = '2026-06-13T08:00:00.000Z'

// Helper: round to 2 decimals to avoid floating-point noise in money math.
const money = (n: number) => Math.round(n * 100) / 100

// ── Claim 1: Sarah (onboarding employee), submitted, awaiting approval ──
const claim1Travel: ExpenseTravelLine[] = [
  {
    id: 'etl-001',
    claim_id: 'exp-001',
    client_name: 'Acme Foods (Pty) Ltd',
    travel_date: '2026-06-04',
    reason: 'On-site Sage X3 implementation workshop',
    rate_per_km: SARS_KM_RATE,
    km_traveled: 120,
    amount: money(120 * SARS_KM_RATE),
    sort_order: 1,
    created_at: NOW,
  },
  {
    id: 'etl-002',
    claim_id: 'exp-001',
    client_name: 'Acme Foods (Pty) Ltd',
    travel_date: '2026-06-09',
    reason: 'Follow-up configuration session',
    rate_per_km: SARS_KM_RATE,
    km_traveled: 120,
    amount: money(120 * SARS_KM_RATE),
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
    description: 'Parking — client premises',
    amount: 45,
    receipt_url: null,
    sort_order: 1,
    created_at: NOW,
  },
  {
    id: 'eol-002',
    claim_id: 'exp-001',
    client_name: 'Acme Foods (Pty) Ltd',
    expense_date: '2026-06-09',
    description: 'Lunch with client stakeholders',
    amount: 185.5,
    receipt_url: null,
    sort_order: 2,
    created_at: NOW,
  },
]

const claim1TravelTotal = money(
  claim1Travel.reduce((sum, l) => sum + (l.amount ?? 0), 0)
)
const claim1OtherTotal = money(
  claim1Other.reduce((sum, l) => sum + (l.amount ?? 0), 0)
)

const claim1: ExpenseClaim = {
  id: 'exp-001',
  employee_id: ONBOARDING_EMPLOYEE_ID,
  claim_period: '2026-06',
  status: 'submitted',
  total_travel: claim1TravelTotal,
  total_other: claim1OtherTotal,
  grand_total: money(claim1TravelTotal + claim1OtherTotal),
  submitted_at: '2026-06-10T10:30:00.000Z',
  approver_id: ADMIN_EMPLOYEE_ID,
  reviewed_by: null,
  reviewed_at: null,
  review_notes: null,
  created_at: NOW,
  updated_at: NOW,
}

// ── Claim 2: Thandiwe (consultant), approved ──
const claim2Travel: ExpenseTravelLine[] = [
  {
    id: 'etl-003',
    claim_id: 'exp-002',
    client_name: 'Brightline Manufacturing',
    travel_date: '2026-05-21',
    reason: 'Quarterly Sage 300 People payroll review',
    rate_per_km: SARS_KM_RATE,
    km_traveled: 86,
    amount: money(86 * SARS_KM_RATE),
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
    description: 'Toll fees (N3)',
    amount: 62,
    receipt_url: null,
    sort_order: 1,
    created_at: NOW,
  },
]

const claim2TravelTotal = money(
  claim2Travel.reduce((sum, l) => sum + (l.amount ?? 0), 0)
)
const claim2OtherTotal = money(
  claim2Other.reduce((sum, l) => sum + (l.amount ?? 0), 0)
)

const claim2: ExpenseClaim = {
  id: 'exp-002',
  employee_id: 'emp-006',
  claim_period: '2026-05',
  status: 'approved',
  total_travel: claim2TravelTotal,
  total_other: claim2OtherTotal,
  grand_total: money(claim2TravelTotal + claim2OtherTotal),
  submitted_at: '2026-05-24T14:00:00.000Z',
  approver_id: ADMIN_EMPLOYEE_ID,
  reviewed_by: ADMIN_EMPLOYEE_ID,
  reviewed_at: '2026-05-25T09:15:00.000Z',
  review_notes: 'Approved. Receipts attached and within policy.',
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
