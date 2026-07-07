import { describe, expect, it } from 'vitest'

import type {
  Employee,
  OnboardingPhase,
  OnboardingTask,
  TaskStatus,
} from '@/types/database'

import {
  buildStatusPatch,
  progressOf,
  resolveOwner,
  visiblePhases,
  visibleTasks,
} from '../workflow-live'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const phases: OnboardingPhase[] = [
  { id: 'pre', name: 'Pre-Arrival', icon: '📋', days_label: 'Before Day 1', visibility: 'admin', sort_order: 1 },
  { id: 'day1', name: 'Day 1', icon: '🎉', days_label: 'Day 1', visibility: 'both', sort_order: 2 },
  { id: 'hr', name: 'HR Admin', icon: '📑', days_label: 'Day 2–3', visibility: 'admin', sort_order: 4 },
  { id: 'training', name: 'Orientation', icon: '🎓', days_label: 'Week 1–2', visibility: 'employee', sort_order: 5 },
]

function task(
  id: string,
  overrides: Partial<OnboardingTask> = {},
): OnboardingTask {
  return {
    id,
    phase_id: 'day1',
    title: `Task ${id}`,
    default_owner: null,
    priority: 'medium',
    system: null,
    days_offset: 0,
    visibility: 'both',
    manager_hidden: false,
    sort_order: 0,
    ...overrides,
  }
}

const tasks: OnboardingTask[] = [
  task('admin-only', { visibility: 'admin' }),
  task('shared'),
  task('employee-own', { visibility: 'employee' }),
  task('contract', { manager_hidden: true }),
  task('payroll', { phase_id: 'hr', visibility: 'admin' }),
]

// ── Visibility (HANDOFF §2 role scoping) ──────────────────────────────────────

describe('visiblePhases', () => {
  it('drops the HR-admin phase for managers only', () => {
    expect(visiblePhases(phases, 'manager').map((p) => p.id)).toEqual([
      'pre',
      'day1',
      'training',
    ])
    expect(visiblePhases(phases, 'admin')).toHaveLength(4)
    expect(visiblePhases(phases, 'employee')).toHaveLength(4)
  })
})

describe('visibleTasks', () => {
  it('admin sees everything', () => {
    expect(visibleTasks(tasks, 'admin')).toHaveLength(5)
  })

  it('manager never sees hr-phase or manager_hidden tasks', () => {
    const ids = visibleTasks(tasks, 'manager').map((t) => t.id)
    expect(ids).toEqual(['admin-only', 'shared', 'employee-own'])
  })

  it("employee sees 'employee' + 'both' visibility (not admin-only)", () => {
    const ids = visibleTasks(tasks, 'employee').map((t) => t.id)
    expect(ids).toEqual(['shared', 'employee-own', 'contract'])
  })
})

// ── GOV §3.6 status edges (P-OTS-EDGE payloads) ───────────────────────────────

const NOW = '2026-07-07T00:00:00.000Z'
const ME = 'emp-1'

describe('buildStatusPatch', () => {
  it('pending -> inprogress (start) stamps started_at', () => {
    expect(buildStatusPatch('pending', 'inprogress', ME, NOW)).toEqual({
      status: 'inprogress',
      started_at: NOW,
    })
  })

  it('inprogress -> done (complete) stamps completed_at/completed_by', () => {
    expect(buildStatusPatch('inprogress', 'done', ME, NOW)).toEqual({
      status: 'done',
      completed_at: NOW,
      completed_by: ME,
    })
  })

  it('pending -> done (direct-tick fast path) stamps completion', () => {
    expect(buildStatusPatch('pending', 'done', ME, NOW)).toEqual({
      status: 'done',
      completed_at: NOW,
      completed_by: ME,
    })
  })

  it('done -> inprogress (reopen) clears completion, keeps started_at', () => {
    const patch = buildStatusPatch('done', 'inprogress', ME, NOW)
    expect(patch).toEqual({
      status: 'inprogress',
      completed_at: null,
      completed_by: null,
    })
    expect(patch).not.toHaveProperty('started_at')
  })

  it.each<TaskStatus>(['inprogress', 'done'])(
    '%s -> pending (reset) clears all work-tracking columns',
    (from) => {
      expect(buildStatusPatch(from, 'pending', ME, NOW)).toEqual({
        status: 'pending',
        started_at: null,
        completed_at: null,
        completed_by: null,
      })
    },
  )

  it.each<TaskStatus>(['pending', 'inprogress', 'done'])(
    'rejects the illegal %s self-loop (GATE-OTS-ORDER pair)',
    (status) => {
      expect(buildStatusPatch(status, status, ME, NOW)).toBeNull()
    },
  )
})

// ── Progress (done/total over visible tasks) ─────────────────────────────────

describe('progressOf', () => {
  it('computes done/total and a rounded percent', () => {
    const statusMap: Record<string, TaskStatus> = {
      'admin-only': 'done',
      shared: 'inprogress',
      'employee-own': 'done',
    }
    const statusOf = (id: string) => statusMap[id] ?? 'pending'
    expect(progressOf(tasks, statusOf)).toEqual({ done: 2, total: 5, pct: 40 })
  })

  it('is 0% (not NaN) for an empty task list — no phantom progress', () => {
    expect(progressOf([], () => 'pending')).toEqual({
      done: 0,
      total: 0,
      pct: 0,
    })
  })
})

// ── Owner resolution ──────────────────────────────────────────────────────────

function employee(id: string, email: string): Employee {
  return {
    id,
    email,
    display_name: email,
  } as unknown as Employee
}

const roster = [
  employee('e-ryan', 'ryan@jera.co.za'),
  employee('e-siko', 'sikod@jera.co.za'),
  employee('e-other', 'other@jera.co.za'),
]

describe('resolveOwner', () => {
  it('an explicit assigned_to wins over the template default', () => {
    expect(resolveOwner('e-other', 'ryan', roster)?.id).toBe('e-other')
  })

  it('falls back to the seeded default_owner token by email', () => {
    expect(resolveOwner(null, 'siko', roster)?.id).toBe('e-siko')
  })

  it('unassigned self-service tasks resolve to no owner', () => {
    expect(resolveOwner(null, null, roster)).toBeUndefined()
    expect(resolveOwner(null, 'unknown-token', roster)).toBeUndefined()
  })
})
