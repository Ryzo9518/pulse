import { beforeEach, describe, expect, it } from 'vitest'

import {
  __resetMockState,
  getBillableSummary,
  getEmployeeMilestones,
  getEmployeeOverallProgress,
  getEmployeePathProgress,
  getProductPaths,
  getTrainingEnrolment,
  listIltSessions,
  listProducts,
  setTrainingIltDate,
  setTrainingMilestone,
  setTrainingModule,
  setTrainingProduct,
} from '../index'
import {
  IMPLEMENTING_COURSE,
  PRODUCTS,
  addCalendarDays,
  billableStage,
  computeMilestones,
  computeOverallProgress,
  computePathProgress,
  moduleKey,
  nextMilestone,
  pathsFor,
  CERT_PREP_DAYS,
  SUPERVISED_OFFSET_DAYS,
} from '../training'

beforeEach(() => {
  __resetMockState()
})

// ── billableStage() — the 4-stage ladder, single source of truth ──────────────

describe('billableStage', () => {
  it('returns "pre" (Pre-supervised) when nothing is done', () => {
    expect(
      billableStage({ getting_started_done: false, ilt_done: false, certified: false }),
    ).toBe('pre')
  })

  it('returns "supervised" once foundations are done', () => {
    expect(
      billableStage({ getting_started_done: true, ilt_done: false, certified: false }),
    ).toBe('supervised')
  })

  it('returns "ilt" once the ILT is complete', () => {
    expect(
      billableStage({ getting_started_done: true, ilt_done: true, certified: false }),
    ).toBe('ilt')
  })

  it('returns "certified" once certified, regardless of earlier flags', () => {
    expect(
      billableStage({ getting_started_done: true, ilt_done: true, certified: true }),
    ).toBe('certified')
    // certified short-circuits even if an earlier flag was somehow left false
    expect(
      billableStage({ getting_started_done: false, ilt_done: false, certified: true }),
    ).toBe('certified')
  })

  it('advances rung-by-rung as flags are toggled in order', () => {
    const stages = [
      billableStage({ getting_started_done: false, ilt_done: false, certified: false }),
      billableStage({ getting_started_done: true, ilt_done: false, certified: false }),
      billableStage({ getting_started_done: true, ilt_done: true, certified: false }),
      billableStage({ getting_started_done: true, ilt_done: true, certified: true }),
    ]
    expect(stages).toEqual(['pre', 'supervised', 'ilt', 'certified'])
  })
})

// ── computeMilestones() — date-derived transitions from start + entered ILT ────

describe('computeMilestones', () => {
  const fixedToday = new Date('2026-06-13T00:00:00.000Z')

  it('projects supervised (start+7), ILT (entered date) and certified (ILT+10)', () => {
    const employee = { start_date: '2026-06-15' }
    const enrolment = {
      employee_id: 'x',
      product_id: 'intacct' as const,
      cert_path: 'implementation' as const,
      ilt_date: '2026-07-24',
      getting_started_done: false,
      ilt_done: false,
      certified: false,
      modules_done: {},
      updated_at: '',
    }
    const [supervised, ilt, certified] = computeMilestones(employee, enrolment, fixedToday)

    expect(supervised.date).toBe(addCalendarDays('2026-06-15', SUPERVISED_OFFSET_DAYS))
    expect(ilt.date).toBe('2026-07-24')
    expect(certified.date).toBe(addCalendarDays('2026-07-24', CERT_PREP_DAYS))
  })

  it('cannot project ILT / certified dates until an ILT date is entered', () => {
    const employee = { start_date: '2026-06-15' }
    const enrolment = {
      employee_id: 'x',
      product_id: 'intacct' as const,
      cert_path: 'implementation' as const,
      ilt_date: null,
      getting_started_done: true,
      ilt_done: false,
      certified: false,
      modules_done: {},
      updated_at: '',
    }
    const [supervised, ilt, certified] = computeMilestones(employee, enrolment, fixedToday)
    expect(supervised.status).toBe('done') // foundations done
    expect(ilt.date).toBeNull()
    expect(certified.date).toBeNull()
  })

  it('marks ILT / certified done when their flags are set', () => {
    const employee = { start_date: '2026-05-04' }
    const enrolment = {
      employee_id: 'x',
      product_id: 'x3' as const,
      cert_path: 'implementation' as const,
      ilt_date: '2026-06-26',
      getting_started_done: true,
      ilt_done: true,
      certified: false,
      modules_done: {},
      updated_at: '',
    }
    const [, ilt, certified] = computeMilestones(employee, enrolment, fixedToday)
    expect(ilt.status).toBe('done')
    expect(certified.status).not.toBe('done')
  })

  it('handles a missing enrolment without throwing', () => {
    const milestones = computeMilestones({ start_date: '2026-06-15' }, undefined, fixedToday)
    expect(milestones).toHaveLength(3)
    expect(milestones.every((m) => m.status !== 'done')).toBe(true)
  })
})

describe('nextMilestone', () => {
  it('returns the first milestone not done, or null when all done', () => {
    const employee = { start_date: '2026-06-15' }
    const base = {
      employee_id: 'x',
      product_id: 'intacct' as const,
      cert_path: 'implementation' as const,
      ilt_date: '2026-07-24',
      getting_started_done: true,
      ilt_done: false,
      certified: false,
      modules_done: {},
      updated_at: '',
    }
    expect(nextMilestone(computeMilestones(employee, base))).toBe('ilt')

    const allDone = { ...base, ilt_done: true, certified: true }
    expect(nextMilestone(computeMilestones(employee, allDone))).toBeNull()
  })
})

// ── pathsFor() / per-path progress ────────────────────────────────────────────

describe('pathsFor', () => {
  it('returns curated path sets for the four mapped products', () => {
    expect(pathsFor('intacct').some((p) => p.id === 'core')).toBe(true)
    expect(pathsFor('x3').some((p) => p.id === 'financials')).toBe(true)
    expect(pathsFor('payroll').some((p) => p.id === 'implementation')).toBe(true)
    expect(pathsFor('300people').some((p) => p.id === 'hr-impl')).toBe(true)
  })

  it('falls back to a generic core path for unmapped products', () => {
    const paths = pathsFor('200evo')
    expect(paths).toHaveLength(1)
    expect(paths[0].id).toBe('core')
    expect(paths[0].groups.length).toBeGreaterThan(0)
  })
})

describe('computePathProgress', () => {
  const corePath = pathsFor('intacct').find((p) => p.id === 'core')!

  it('reports 0/total with an empty completion map', () => {
    const total = corePath.groups.reduce((n, g) => n + g.mods.length, 0)
    const p = computePathProgress('intacct', corePath, {})
    expect(p.done).toBe(0)
    expect(p.total).toBe(total)
    expect(p.percent).toBe(0)
  })

  it('counts only modules in this path/product and rounds the percentage', () => {
    const first = corePath.groups[0].mods[0]
    const key = moduleKey('intacct', corePath.id, first.name)
    // include an unrelated key that must NOT count toward this path
    const done = { [key]: true, 'x3:financials:get-started': true }
    const p = computePathProgress('intacct', corePath, done)
    expect(p.done).toBe(1)
    expect(p.percent).toBe(Math.round((1 / p.total) * 100))
  })

  it('reaches 100% when every module in the path is done', () => {
    const done: Record<string, boolean> = {}
    for (const g of corePath.groups) {
      for (const m of g.mods) done[moduleKey('intacct', corePath.id, m.name)] = true
    }
    const p = computePathProgress('intacct', corePath, done)
    expect(p.done).toBe(p.total)
    expect(p.percent).toBe(100)
  })
})

describe('computeOverallProgress', () => {
  it('sums module counts across every path for a product', () => {
    const manual = pathsFor('intacct').reduce(
      (acc, path) => acc + computePathProgress('intacct', path, {}).total,
      0,
    )
    expect(computeOverallProgress('intacct', {}).total).toBe(manual)
  })
})

// ── Catalogue + accessor behaviour ────────────────────────────────────────────

describe('products + paths catalogue', () => {
  it('exposes the six Sage products', () => {
    expect(listProducts()).toBe(PRODUCTS)
    expect(PRODUCTS.map((p) => p.id)).toEqual(
      expect.arrayContaining(['intacct', 'x3', '300people', 'payroll']),
    )
  })

  it('getProductPaths matches pathsFor', () => {
    expect(getProductPaths('x3')).toBe(pathsFor('x3'))
  })
})

describe('listIltSessions (reference catalogue)', () => {
  it('returns Implementing ILT sessions with valid date ranges', () => {
    const sessions = listIltSessions()
    expect(sessions.length).toBeGreaterThan(0)
    for (const s of sessions) {
      expect(s.course).toBe(IMPLEMENTING_COURSE)
      expect(s.end_date >= s.start_date).toBe(true)
    }
  })
})

describe('setTrainingIltDate', () => {
  it('sets and clears the entered ILT date and reflects in milestones', () => {
    setTrainingIltDate('emp-011', '2026-08-10')
    expect(getTrainingEnrolment('emp-011')?.ilt_date).toBe('2026-08-10')
    const ilt = getEmployeeMilestones('emp-011').find((m) => m.key === 'ilt')
    expect(ilt?.date).toBe('2026-08-10')

    setTrainingIltDate('emp-011', null)
    expect(getTrainingEnrolment('emp-011')?.ilt_date).toBeNull()
  })

  it('creates an enrolment for a consultant who had none', () => {
    expect(getTrainingEnrolment('emp-008')).toBeUndefined()
    setTrainingIltDate('emp-008', '2026-09-01')
    expect(getTrainingEnrolment('emp-008')?.ilt_date).toBe('2026-09-01')
    expect(getTrainingEnrolment('emp-008')?.product_id).toBe('intacct')
  })
})

describe('setTrainingProduct', () => {
  it('switches the product a consultant trains on', () => {
    setTrainingProduct('emp-011', 'payroll')
    expect(getTrainingEnrolment('emp-011')?.product_id).toBe('payroll')
    expect(getEmployeePathProgress('emp-011').length).toBe(pathsFor('payroll').length)
  })
})

describe('setTrainingModule', () => {
  it('toggles per-module completion and reflects in path progress', () => {
    const corePath = pathsFor('intacct').find((p) => p.id === 'core')!
    const key = moduleKey('intacct', 'core', corePath.groups[0].mods[0].name)
    setTrainingModule('emp-009', key, true)
    const progress = getEmployeePathProgress('emp-009').find((p) => p.path_id === 'core')
    expect(progress?.done).toBe(1)

    setTrainingModule('emp-009', key, false)
    const after = getEmployeePathProgress('emp-009').find((p) => p.path_id === 'core')
    expect(after?.done).toBe(0)
  })

  it('overall progress counts a completed module', () => {
    const before = getEmployeeOverallProgress('emp-009').done
    const corePath = pathsFor('intacct').find((p) => p.id === 'core')!
    const key = moduleKey('intacct', 'core', corePath.groups[0].mods[1].name)
    setTrainingModule('emp-009', key, true)
    expect(getEmployeeOverallProgress('emp-009').done).toBe(before + 1)
  })
})

describe('setTrainingMilestone', () => {
  it('toggles a billable flag and advances the derived stage', () => {
    setTrainingMilestone('emp-011', 'getting_started_done', true)
    const naledi = getBillableSummary().find((r) => r.employee_id === 'emp-011')
    expect(naledi?.stage).toBe('supervised')
  })
})

// ── Admin roll-up — multi-product, stage-aware ────────────────────────────────

describe('getBillableSummary', () => {
  it('spans multiple products and derives each stage', () => {
    const rows = getBillableSummary()
    const byId = Object.fromEntries(rows.map((r) => [r.employee_id, r]))

    // Lerato — Intacct, foundations done, ILT booked → supervised stage.
    expect(byId['emp-009'].product_name).toBe('Sage Intacct')
    expect(byId['emp-009'].stage).toBe('supervised')
    expect(byId['emp-009'].ilt_date_entered).toBe('2026-07-24')

    // Daniel — X3, foundations + ILT done → ilt stage.
    expect(byId['emp-010'].product_name).toBe('Sage X3')
    expect(byId['emp-010'].stage).toBe('ilt')

    // Naledi — 300 People, nothing done → pre-supervised, no ILT date.
    expect(byId['emp-011'].product_name).toBe('Sage 300 People')
    expect(byId['emp-011'].stage).toBe('pre')
    expect(byId['emp-011'].ilt_date_entered).toBeNull()
  })

  it('sorts soonest certified date first; unscheduled to the bottom', () => {
    const rows = getBillableSummary()
    const withDates = rows.filter((r) => r.certified_date)
    const sorted = [...withDates].sort((a, b) =>
      (a.certified_date as string).localeCompare(b.certified_date as string),
    )
    expect(withDates).toEqual(sorted)
  })
})
