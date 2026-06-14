import { beforeEach, describe, expect, it } from 'vitest'

import {
  __resetMockState,
  getBillableSummary,
  getEmployeeMilestones,
  getTrainingEnrolment,
  listIltSessions,
  setTrainingMilestone,
  setTrainingSession,
} from '../index'
import {
  IMPLEMENTING_COURSE,
  addCalendarDays,
  computeMilestones,
  findSession,
  nextMilestone,
  CERT_PREP_DAYS,
  SUPERVISED_OFFSET_DAYS,
} from '../training'

beforeEach(() => {
  __resetMockState()
})

describe('listIltSessions', () => {
  it('returns Implementing ILT sessions with valid date ranges', () => {
    const sessions = listIltSessions()
    expect(sessions.length).toBeGreaterThan(0)
    for (const s of sessions) {
      expect(s.course).toBe(IMPLEMENTING_COURSE)
      expect(s.end_date >= s.start_date).toBe(true)
      expect(['fullday', 'spread']).toContain(s.format)
    }
  })
})

describe('computeMilestones', () => {
  const fixedToday = new Date('2026-06-13T00:00:00.000Z')

  it('projects supervised, ILT and certified dates from start date + session', () => {
    const session = listIltSessions()[5] // a future full-day block
    const employee = { start_date: '2026-06-15' }
    const enrolment = {
      employee_id: 'x',
      session_id: session.id,
      cert_path: 'implementation' as const,
      getting_started_done: false,
      ilt_done: false,
      certified: false,
      updated_at: '',
    }
    const [supervised, ilt, certified] = computeMilestones(employee, enrolment, fixedToday)

    expect(supervised.date).toBe(addCalendarDays('2026-06-15', SUPERVISED_OFFSET_DAYS))
    expect(ilt.date).toBe(session.end_date)
    expect(certified.date).toBe(addCalendarDays(session.end_date, CERT_PREP_DAYS))
  })

  it('marks a milestone done when its flag is set', () => {
    const employee = { start_date: '2026-06-15' }
    const enrolment = {
      employee_id: 'x',
      session_id: null,
      cert_path: 'implementation' as const,
      getting_started_done: true,
      ilt_done: false,
      certified: false,
      updated_at: '',
    }
    const [supervised, ilt] = computeMilestones(employee, enrolment, fixedToday)
    expect(supervised.status).toBe('done')
    // no session → ILT date cannot be projected and is not done
    expect(ilt.date).toBeNull()
    expect(ilt.status).not.toBe('done')
  })

  it('handles a missing enrolment without throwing', () => {
    const employee = { start_date: '2026-06-15' }
    const milestones = computeMilestones(employee, undefined, fixedToday)
    expect(milestones).toHaveLength(3)
    expect(milestones.every((m) => m.status !== 'done')).toBe(true)
  })
})

describe('nextMilestone', () => {
  it('returns the first milestone that is not done, or null when all done', () => {
    const employee = { start_date: '2026-06-15' }
    const base = {
      employee_id: 'x',
      session_id: findSession('ilt-2026-07-20-fd')?.id ?? null,
      cert_path: 'implementation' as const,
      getting_started_done: true,
      ilt_done: false,
      certified: false,
      updated_at: '',
    }
    expect(nextMilestone(computeMilestones(employee, base))).toBe('ilt')

    const allDone = { ...base, ilt_done: true, certified: true }
    expect(nextMilestone(computeMilestones(employee, allDone))).toBeNull()
  })
})

describe('setTrainingSession', () => {
  it('creates an enrolment for a consultant who had none', () => {
    expect(getTrainingEnrolment('emp-008')).toBeUndefined()
    setTrainingSession('emp-008', 'ilt-2026-07-20-fd')
    expect(getTrainingEnrolment('emp-008')?.session_id).toBe('ilt-2026-07-20-fd')
  })

  it('updates an existing enrolment and can clear it', () => {
    setTrainingSession('emp-009', 'ilt-2026-08-17-fd')
    expect(getTrainingEnrolment('emp-009')?.session_id).toBe('ilt-2026-08-17-fd')
    setTrainingSession('emp-009', null)
    expect(getTrainingEnrolment('emp-009')?.session_id).toBeNull()
  })
})

describe('setTrainingMilestone', () => {
  it('toggles a progress flag and reflects in computed milestones', () => {
    setTrainingMilestone('emp-011', 'getting_started_done', true)
    const supervised = getEmployeeMilestones('emp-011').find((m) => m.key === 'supervised')
    expect(supervised?.status).toBe('done')
  })
})

describe('getBillableSummary', () => {
  it('includes the seeded junior consultants and sorts certified date first', () => {
    const rows = getBillableSummary()
    const ids = rows.map((r) => r.employee_id)
    expect(ids).toEqual(expect.arrayContaining(['emp-009', 'emp-010', 'emp-011']))

    const withDates = rows.filter((r) => r.certified_date)
    const sorted = [...withDates].sort((a, b) =>
      (a.certified_date as string).localeCompare(b.certified_date as string),
    )
    expect(withDates).toEqual(sorted)
  })

  it('flags a consultant with no session as not enrolled (null session label)', () => {
    const naledi = getBillableSummary().find((r) => r.employee_id === 'emp-011')
    expect(naledi?.session_label).toBeNull()
  })
})
