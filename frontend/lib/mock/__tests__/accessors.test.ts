import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetMockState,
  acknowledgePolicy,
  getCurrentEmployee,
  getPolicyAckState,
  listPolicies,
  listTasks,
} from '../index'
import { TOTAL_POLICIES } from '@/lib/constants'

beforeEach(() => {
  __resetMockState()
})

describe('listPolicies', () => {
  it('returns exactly 20 policies', () => {
    expect(listPolicies()).toHaveLength(20)
    expect(TOTAL_POLICIES).toBe(20)
  })
})

describe('listTasks (role visibility)', () => {
  it("excludes admin-only tasks for the 'employee' role", () => {
    const employeeTasks = listTasks('employee')
    expect(employeeTasks.length).toBeGreaterThan(0)
    expect(employeeTasks.every((t) => t.visibility !== 'admin')).toBe(true)
    // employee-visible tasks are 'employee' or 'both'
    expect(
      employeeTasks.every(
        (t) => t.visibility === 'employee' || t.visibility === 'both'
      )
    ).toBe(true)
  })

  it("returns all tasks for the 'admin' role", () => {
    const adminTasks = listTasks('admin')
    const employeeTasks = listTasks('employee')
    expect(adminTasks.length).toBeGreaterThan(employeeTasks.length)
    // admin set includes at least one admin-only task
    expect(adminTasks.some((t) => t.visibility === 'admin')).toBe(true)
  })
})

describe('acknowledgePolicy', () => {
  it('is idempotent — re-acking a policy does not change the count', () => {
    const firstPolicyId = listPolicies()[0].id

    acknowledgePolicy(firstPolicyId)
    const afterFirst = getPolicyAckState().acknowledgedCount

    acknowledgePolicy(firstPolicyId)
    const afterSecond = getPolicyAckState().acknowledgedCount

    expect(afterFirst).toBe(1)
    expect(afterSecond).toBe(1)
  })

  it('sets acknowledged_at on first acknowledgement', () => {
    const policyId = listPolicies()[0].id
    const ack = acknowledgePolicy(policyId)
    expect(ack.acknowledged).toBe(true)
    expect(ack.acknowledged_at).not.toBeNull()
  })
})

describe('policy gate', () => {
  it('seeded onboarding employee starts with policies_completed === false', () => {
    expect(getCurrentEmployee().policies_completed).toBe(false)
    expect(getPolicyAckState().allAcknowledged).toBe(false)
  })

  it('acking all 20 policies flips policies_completed to true', () => {
    for (const policy of listPolicies()) {
      acknowledgePolicy(policy.id)
    }
    expect(getPolicyAckState().acknowledgedCount).toBe(20)
    expect(getPolicyAckState().allAcknowledged).toBe(true)
    expect(getCurrentEmployee().policies_completed).toBe(true)
  })
})
