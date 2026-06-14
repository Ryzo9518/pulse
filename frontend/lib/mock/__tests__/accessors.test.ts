import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetMockState,
  acknowledgePolicy,
  getCurrentEmployee,
  getPolicyAckState,
  getTaskStatus,
  listMessages,
  listPolicies,
  listTaskStatuses,
  listTasks,
  postMessage,
  setTaskStatus,
  startReadingPolicy,
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

  it('throws on an unknown policy id', () => {
    expect(() => acknowledgePolicy('does-not-exist')).toThrow(
      /Unknown policy id: does-not-exist/
    )
  })
})

describe('startReadingPolicy', () => {
  it('sets read_started_at on first call and does not overwrite it on a second call', () => {
    const policyId = listPolicies()[0].id

    startReadingPolicy(policyId)
    const first = getPolicyAckState().acknowledgements.find(
      (a) => a.policy_id === policyId
    )
    expect(first).toBeDefined()
    expect(first!.read_started_at).not.toBeNull()
    const firstValue = first!.read_started_at

    startReadingPolicy(policyId)
    const second = getPolicyAckState().acknowledgements.find(
      (a) => a.policy_id === policyId
    )
    expect(second!.read_started_at).toBe(firstValue)
  })
})

describe('listTasks (employee positive both assertion)', () => {
  it("includes at least one 'both'-visibility task for the 'employee' role", () => {
    const employeeTasks = listTasks('employee')
    // Regression guard: a filter that wrongly dropped 'both' would fail here.
    expect(employeeTasks.some((t) => t.visibility === 'both')).toBe(true)
  })
})

describe('setTaskStatus (state machine)', () => {
  // 't1' is seeded as 'done'; 't11' is seeded as 'inprogress' with a fixed
  // started_at; neither id is fabricated, so these are deterministic.
  const KNOWN_TASK_ID = 't1'
  const SEEDED_INPROGRESS_ID = 't11'
  const SEEDED_STARTED_AT = '2026-06-11T09:00:00.000Z'

  it("marking a task 'done' sets completed_at and completed_by to the current employee", () => {
    const entry = setTaskStatus(KNOWN_TASK_ID, 'done')
    expect(entry.status).toBe('done')
    expect(entry.completed_at).not.toBeNull()
    expect(entry.completed_by).toBe(getCurrentEmployee().id)

    const read = getTaskStatus(KNOWN_TASK_ID)
    expect(read!.completed_at).not.toBeNull()
    expect(read!.completed_by).toBe(getCurrentEmployee().id)
  })

  it("moving a 'done' task back to 'inprogress' clears completion but preserves started_at", () => {
    setTaskStatus(KNOWN_TASK_ID, 'done')
    const startedAt = getTaskStatus(KNOWN_TASK_ID)!.started_at
    expect(startedAt).not.toBeNull()

    const entry = setTaskStatus(KNOWN_TASK_ID, 'inprogress')
    expect(entry.status).toBe('inprogress')
    expect(entry.completed_at).toBeNull()
    expect(entry.completed_by).toBeNull()
    expect(entry.started_at).toBe(startedAt)
  })

  it("moving a 'done' task back to 'pending' clears completion to null", () => {
    setTaskStatus(KNOWN_TASK_ID, 'done')
    const entry = setTaskStatus(KNOWN_TASK_ID, 'pending')
    expect(entry.status).toBe('pending')
    expect(entry.completed_at).toBeNull()
    expect(entry.completed_by).toBeNull()
  })

  it("setting 'inprogress' on an already-started task does not overwrite started_at", () => {
    expect(getTaskStatus(SEEDED_INPROGRESS_ID)!.started_at).toBe(
      SEEDED_STARTED_AT
    )
    const entry = setTaskStatus(SEEDED_INPROGRESS_ID, 'inprogress')
    expect(entry.started_at).toBe(SEEDED_STARTED_AT)
  })

  it('creates a new status entry for a task id that has none', () => {
    const NEW_TASK_ID = 't-unseeded-999'
    expect(getTaskStatus(NEW_TASK_ID)).toBeUndefined()
    const before = listTaskStatuses().length

    const entry = setTaskStatus(NEW_TASK_ID, 'inprogress')

    expect(listTaskStatuses().length).toBe(before + 1)
    expect(entry.task_id).toBe(NEW_TASK_ID)
    // New entry is attached to the onboarding workflow.
    expect(entry.workflow_id).toBe('wf-001')
    expect(getTaskStatus(NEW_TASK_ID)).toBeDefined()
  })
})

describe('postMessage + listMessages (round-trip)', () => {
  it('posting to a channel increases that channel length by 1 and stores the body', () => {
    const before = listMessages('general').length
    const msg = postMessage('general', 'hello from a test')

    const after = listMessages('general')
    expect(after.length).toBe(before + 1)
    expect(msg.body).toBe('hello from a test')
    expect(msg.channel).toBe('general')
    expect(after.some((m) => m.id === msg.id && m.body === 'hello from a test')).toBe(
      true
    )
  })

  it('listMessages() with no channel returns all messages across channels', () => {
    const announcements = listMessages('announcements').length
    const general = listMessages('general').length
    expect(listMessages().length).toBe(announcements + general)
  })
})
