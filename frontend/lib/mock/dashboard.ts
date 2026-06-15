// Pure dashboard helpers — no module state, safe to unit test.
//
// Source of truth: docs/prototype/Pulse.dc.html (dashboardData / dueInfo /
// addDays, the employee "this week" list, and the admin billable-readiness
// pipeline) + HANDOFF.md. These functions back the rebuilt Dashboard (W5):
//   • dueInfo()          — time-aware due-date badge from an ISO date
//   • addCalendarDays()  — re-used from training; days_offset projection
//   • buildThisWeek()    — the sorted, urgency-ranked "this week" action rows
//   • countBillableStages() — the 4-stage billable-readiness pipeline counts
//
// Kept out of the page component so the date maths and pipeline counts can be
// unit-tested without rendering React.

import type { BadgeColor } from '@/components/ui'
import type { BillableStage } from '@/types/database'
import { addCalendarDays, billableStage } from './training'

const DAY_MS = 24 * 60 * 60 * 1000

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** The ISO "today" the dashboard reckons due-dates against. Overridable in tests. */
export const DASHBOARD_NOW_ISO = '2026-06-15'

/** Urgency state of a due date — drives the left accent + badge colour. */
export type DueState = 'overdue' | 'today' | 'soon' | 'upcoming'

export interface DueInfo {
  /** Human label, e.g. "Due tomorrow", "Overdue · 2 days", "Due Mon 22 Jun". */
  label: string
  /** Whole days until due (negative = overdue). */
  days: number
  /** Urgency bucket. */
  state: DueState
  /** Badge palette colour matching the urgency. */
  badgeColor: BadgeColor
}

/**
 * Classify an ISO due-date relative to `now` (default DASHBOARD_NOW_ISO), mirroring
 * the prototype's dueInfo: overdue (red) → today (red) → tomorrow / within a week
 * (amber) → later (blue). Pure: depends only on its inputs.
 */
export function dueInfo(iso: string, nowIso: string = DASHBOARD_NOW_ISO): DueInfo {
  const now = new Date(`${nowIso}T00:00:00.000Z`)
  const d = new Date(`${iso}T00:00:00.000Z`)
  const days = Math.round((d.getTime() - now.getTime()) / DAY_MS)
  const dd = d.getUTCDate()
  const mon = MONTHS[d.getUTCMonth()]
  const wd = WEEKDAYS[d.getUTCDay()]

  if (days < 0) {
    return {
      label: days === -1 ? 'Overdue · 1 day' : `Overdue · ${-days} days`,
      days,
      state: 'overdue',
      badgeColor: 'red',
    }
  }
  if (days === 0) {
    return { label: 'Due today', days, state: 'today', badgeColor: 'red' }
  }
  if (days === 1) {
    return { label: 'Due tomorrow', days, state: 'soon', badgeColor: 'amber' }
  }
  if (days <= 7) {
    return { label: `Due ${wd} ${dd} ${mon}`, days, state: 'soon', badgeColor: 'amber' }
  }
  return { label: `Due ${dd} ${mon}`, days, state: 'upcoming', badgeColor: 'blue' }
}

/** A single "this week" action row, pre-computed and ready to render. */
export interface ThisWeekRow {
  /** Stable key for React. */
  key: string
  icon: string
  label: string
  detail: string
  cta: string
  /** Route the row links to (e.g. '/workflow'). */
  href: string
  due: DueInfo
}

/** What the caller supplies per candidate action (counts come from the seam). */
export interface ThisWeekInput {
  key: string
  icon: string
  label: string
  detail: string
  cta: string
  href: string
  /**
   * Calendar days after the employee's start date the action is due — i.e. the
   * task's days_offset. The due date is start_date + daysOffset.
   */
  daysOffset: number
  /** Drop the row when false (e.g. nothing outstanding for that area). */
  include: boolean
}

/**
 * Build the employee "this week" rows from their start date + each action's
 * days_offset, then sort by urgency (soonest / most overdue first). Rows whose
 * `include` is false are dropped (e.g. forms already complete). Pure: depends
 * only on its inputs. `startIso` is the employee's start date; `nowIso` defaults
 * to DASHBOARD_NOW_ISO.
 */
export function buildThisWeek(
  startIso: string,
  candidates: ThisWeekInput[],
  nowIso: string = DASHBOARD_NOW_ISO,
): ThisWeekRow[] {
  return candidates
    .filter((c) => c.include)
    .map((c) => {
      const dueDate = addCalendarDays(startIso, c.daysOffset)
      return {
        key: c.key,
        icon: c.icon,
        label: c.label,
        detail: c.detail,
        cta: c.cta,
        href: c.href,
        due: dueInfo(dueDate, nowIso),
      }
    })
    .sort((a, b) => a.due.days - b.due.days)
}

/** The four billable-readiness stages, in pipeline order. */
export const BILLABLE_STAGES: ReadonlyArray<{
  stage: BillableStage
  label: string
  accent: BadgeColor
}> = [
  { stage: 'pre', label: 'Pre-supervised', accent: 'grey' },
  { stage: 'supervised', label: 'Supervised-billable', accent: 'blue' },
  { stage: 'ilt', label: 'ILT complete', accent: 'amber' },
  { stage: 'certified', label: 'Certified', accent: 'green' },
]

/**
 * Count how many consultants sit in each billable-readiness stage, derived from
 * each one's flags via the shared billableStage() ladder. Accepts the flag
 * triples (as the billable summary rows already expose `stage`, callers can pass
 * those straight through, but this stays decoupled from the row shape). Pure.
 */
export function countBillableStages(
  rows: ReadonlyArray<{
    getting_started_done: boolean
    ilt_done: boolean
    certified: boolean
  }>,
): Record<BillableStage, number> {
  const counts: Record<BillableStage, number> = {
    pre: 0,
    supervised: 0,
    ilt: 0,
    certified: 0,
  }
  for (const row of rows) {
    counts[billableStage(row)] += 1
  }
  return counts
}

/**
 * Count billable stages directly from billable-summary rows (which already carry
 * a computed `stage`). Convenience over countBillableStages for the dashboard,
 * which reads getBillableSummary(). Pure.
 */
export function countSummaryStages(
  rows: ReadonlyArray<{ stage: BillableStage }>,
): Record<BillableStage, number> {
  const counts: Record<BillableStage, number> = {
    pre: 0,
    supervised: 0,
    ilt: 0,
    certified: 0,
  }
  for (const row of rows) {
    counts[row.stage] += 1
  }
  return counts
}
