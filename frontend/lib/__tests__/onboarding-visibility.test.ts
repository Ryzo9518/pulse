import { describe, expect, it } from 'vitest'

import { listPhases, listTasks } from '@/lib/mock'

// ── Manager onboarding visibility (HANDOFF §2) ────────────────────────────────
// A manager may track a new starter's WORK tasks, but must never see the
// HR-admin phase (tax/banking/payroll/medical) or the employment contract / NDA.
// This is a POPIA boundary, pinned here independently of the workflow UI.

describe('listTasks(role) onboarding visibility', () => {
  it('a manager never sees any HR-admin phase task', () => {
    const tasks = listTasks('manager')
    expect(tasks.some((t) => t.phase_id === 'hr')).toBe(false)
  })

  it('a manager never sees the contract/NDA task, but an admin does', () => {
    expect(listTasks('manager').some((t) => t.id === 't7')).toBe(false)
    expect(listTasks('admin').some((t) => t.id === 't7')).toBe(true)
  })

  it('a manager still sees ordinary work tasks (e.g. IT setup)', () => {
    expect(listTasks('manager').some((t) => t.phase_id === 'it')).toBe(true)
  })

  it('an employee does not see admin-only tasks', () => {
    expect(listTasks('employee').some((t) => t.visibility === 'admin')).toBe(
      false,
    )
  })

  it('the employee STILL sees their own contract task (manager_hidden must not leak into the employee projection)', () => {
    // t7 is visibility 'both' and only hidden from managers; the onboarding
    // employee must still see it.
    expect(listTasks('employee').some((t) => t.id === 't7')).toBe(true)
  })
})

describe('listPhases(role) onboarding visibility', () => {
  it('hides the HR-admin phase from a manager only', () => {
    expect(listPhases('manager').some((p) => p.id === 'hr')).toBe(false)
    expect(listPhases('admin').some((p) => p.id === 'hr')).toBe(true)
    expect(listPhases('employee').some((p) => p.id === 'hr')).toBe(true)
    expect(listPhases().some((p) => p.id === 'hr')).toBe(true)
  })
})
