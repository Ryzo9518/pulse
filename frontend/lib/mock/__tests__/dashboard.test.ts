import { beforeEach, describe, expect, it } from 'vitest'

import {
  __resetMockState,
  getBillableSummary,
} from '../index'
import {
  buildThisWeek,
  countBillableStages,
  countSummaryStages,
  dueInfo,
  type ThisWeekInput,
} from '../dashboard'

const NOW = '2026-06-15'

beforeEach(() => {
  __resetMockState()
})

// ── dueInfo() — time-aware due-date classification ────────────────────────────

describe('dueInfo', () => {
  it('flags an overdue date in red with a day count', () => {
    const info = dueInfo('2026-06-13', NOW)
    expect(info.days).toBe(-2)
    expect(info.state).toBe('overdue')
    expect(info.badgeColor).toBe('red')
    expect(info.label).toBe('Overdue · 2 days')
  })

  it('uses the singular form for one day overdue', () => {
    expect(dueInfo('2026-06-14', NOW).label).toBe('Overdue · 1 day')
  })

  it('flags today in red', () => {
    const info = dueInfo('2026-06-15', NOW)
    expect(info.days).toBe(0)
    expect(info.state).toBe('today')
    expect(info.badgeColor).toBe('red')
    expect(info.label).toBe('Due today')
  })

  it('flags tomorrow in amber', () => {
    const info = dueInfo('2026-06-16', NOW)
    expect(info.days).toBe(1)
    expect(info.state).toBe('soon')
    expect(info.badgeColor).toBe('amber')
    expect(info.label).toBe('Due tomorrow')
  })

  it('flags within a week in amber with a weekday label', () => {
    const info = dueInfo('2026-06-20', NOW)
    expect(info.days).toBe(5)
    expect(info.state).toBe('soon')
    expect(info.badgeColor).toBe('amber')
    // 2026-06-20 is a Saturday
    expect(info.label).toBe('Due Sat 20 Jun')
  })

  it('flags more than a week out in blue with a date label', () => {
    const info = dueInfo('2026-06-29', NOW)
    expect(info.days).toBe(14)
    expect(info.state).toBe('upcoming')
    expect(info.badgeColor).toBe('blue')
    expect(info.label).toBe('Due 29 Jun')
  })
})

// ── buildThisWeek() — start_date + days_offset projection, sorted by urgency ───

describe('buildThisWeek', () => {
  const start = '2026-06-16'
  const candidates: ThisWeekInput[] = [
    { key: 'training', icon: '🎓', label: 'Training', detail: '', cta: '', href: '/training', daysOffset: 13, include: true },
    { key: 'it', icon: '💻', label: 'IT', detail: '', cta: '', href: '/workflow', daysOffset: 1, include: true },
    { key: 'policies', icon: '📖', label: 'Policies', detail: '', cta: '', href: '/policies', daysOffset: 5, include: true },
  ]

  it('computes each due date as start_date + days_offset', () => {
    const rows = buildThisWeek(start, candidates, NOW)
    const it = rows.find((r) => r.key === 'it')
    // 2026-06-16 + 1 day = 2026-06-17, which is 2 days after NOW (2026-06-15).
    expect(it?.due.days).toBe(2)
  })

  it('sorts rows by urgency (soonest / most overdue first)', () => {
    const rows = buildThisWeek(start, candidates, NOW)
    expect(rows.map((r) => r.key)).toEqual(['it', 'policies', 'training'])
    // due.days is non-decreasing
    const days = rows.map((r) => r.due.days)
    expect([...days].sort((a, b) => a - b)).toEqual(days)
  })

  it('drops candidates whose include flag is false', () => {
    const rows = buildThisWeek(
      start,
      [
        { ...candidates[0], include: false },
        { ...candidates[1], include: true },
      ],
      NOW,
    )
    expect(rows.map((r) => r.key)).toEqual(['it'])
  })

  it('returns an empty list when nothing is outstanding', () => {
    const rows = buildThisWeek(start, candidates.map((c) => ({ ...c, include: false })), NOW)
    expect(rows).toEqual([])
  })
})

// ── countBillableStages() — the 4-stage pipeline counts ───────────────────────

describe('countBillableStages', () => {
  it('buckets each consultant by the shared billableStage ladder', () => {
    const counts = countBillableStages([
      { getting_started_done: false, ilt_done: false, certified: false }, // pre
      { getting_started_done: true, ilt_done: false, certified: false }, // supervised
      { getting_started_done: true, ilt_done: true, certified: false }, // ilt
      { getting_started_done: true, ilt_done: true, certified: true }, // certified
      { getting_started_done: true, ilt_done: false, certified: false }, // supervised
    ])
    expect(counts).toEqual({ pre: 1, supervised: 2, ilt: 1, certified: 1 })
  })

  it('returns all-zero counts for an empty roster', () => {
    expect(countBillableStages([])).toEqual({ pre: 0, supervised: 0, ilt: 0, certified: 0 })
  })

  it('counts certified regardless of earlier flags', () => {
    const counts = countBillableStages([
      { getting_started_done: false, ilt_done: false, certified: true },
    ])
    expect(counts.certified).toBe(1)
    expect(counts.pre).toBe(0)
  })
})

// ── countSummaryStages() — counts straight from billable-summary rows ─────────

describe('countSummaryStages', () => {
  it('totals stages from getBillableSummary() and matches the seeded roster', () => {
    const summary = getBillableSummary()
    const counts = countSummaryStages(summary)

    // Every consultant lands in exactly one stage.
    const sum = counts.pre + counts.supervised + counts.ilt + counts.certified
    expect(sum).toBe(summary.length)

    // Seeded enrolments (training.ts): Lerato (emp-009) foundations done → supervised;
    // Daniel (emp-010) foundations + ILT done → ilt; Naledi (emp-011) nothing → pre;
    // Pieter (emp-007) onboarding/probation consultant, no enrolment → pre.
    expect(counts.ilt).toBe(1)
    expect(counts.supervised).toBe(1)
    expect(counts.certified).toBe(0)
    expect(counts.pre).toBeGreaterThanOrEqual(1)
  })
})
