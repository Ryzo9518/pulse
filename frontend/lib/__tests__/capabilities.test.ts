import { describe, expect, it } from 'vitest'

import {
  can,
  isStaffRole,
  roleLabel,
  type Capability,
} from '../capabilities'

// ── Role capability matrix (HANDOFF §2) ───────────────────────────────────────
// The manager boundary is a POPIA/payroll control, so it is pinned down here
// independently of any screen. Production must mirror these rules in RLS.

const ALL_CAPABILITIES: Capability[] = [
  'viewTeam',
  'approveExpenses',
  'scheduleOnboarding',
  'viewContractTask',
  'viewPayrollTasks',
  'viewPersonalData',
  'uploadCertificates',
  'assignTaskOwners',
  'publishPolicies',
  'uploadDocuments',
  'notifyAll',
]

describe('capabilities', () => {
  it('an employee has no elevated capabilities', () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(can('employee', cap)).toBe(false)
    }
  })

  it('a manager gets work-related team oversight only', () => {
    expect(can('manager', 'viewTeam')).toBe(true)
    expect(can('manager', 'approveExpenses')).toBe(true)
    expect(can('manager', 'scheduleOnboarding')).toBe(true)
  })

  it('a manager NEVER sees payroll, personal data, or the contract', () => {
    expect(can('manager', 'viewPayrollTasks')).toBe(false)
    expect(can('manager', 'viewPersonalData')).toBe(false)
    expect(can('manager', 'viewContractTask')).toBe(false)
  })

  it('a manager cannot perform admin-only actions', () => {
    expect(can('manager', 'publishPolicies')).toBe(false)
    expect(can('manager', 'uploadDocuments')).toBe(false)
    expect(can('manager', 'uploadCertificates')).toBe(false)
    expect(can('manager', 'assignTaskOwners')).toBe(false)
    expect(can('manager', 'notifyAll')).toBe(false)
  })

  it('an admin can do everything', () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(can('admin', cap)).toBe(true)
    }
  })

  it('isStaffRole is true for manager and admin only', () => {
    expect(isStaffRole('employee')).toBe(false)
    expect(isStaffRole('manager')).toBe(true)
    expect(isStaffRole('admin')).toBe(true)
  })

  it('roleLabel returns a human label per role', () => {
    expect(roleLabel('employee')).toBe('Employee')
    expect(roleLabel('manager')).toBe('Manager')
    expect(roleLabel('admin')).toBe('Administrator')
  })
})
