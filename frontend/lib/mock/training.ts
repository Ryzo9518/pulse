// Mock training / certification seed data — conforms to the training types in
// types/database.ts. Powers the Sage Intacct billable-readiness tracker.
//
// ILT sessions mirror the live Sage University "Sage Intacct: Implementing"
// schedule captured 13 Jun 2026. Seat notes are point-in-time and illustrative.
// Per the frontend-first phase, this is in-memory mock data only.

import type {
  BillableMilestone,
  Employee,
  IltSession,
  MilestoneKey,
  TrainingEnrolment,
} from '@/types/database'

const NOW = '2026-06-13T08:00:00.000Z'

// ── Milestone projection offsets ──────────────────────────────────────────────
// Supervised-billable: a junior can bill supervised hours once foundations +
// shadowing are done, ~5 working days after their start date.
export const SUPERVISED_OFFSET_DAYS = 7 // ~5 working days
// Certified: certification typically follows the ILT after prep + sitting the exam.
export const CERT_PREP_DAYS = 10

export const IMPLEMENTING_COURSE = 'Sage Intacct: Implementing'

// ── Sage U instructor-led sessions (captured 13 Jun 2026) ─────────────────────
export const iltSessions: IltSession[] = [
  {
    id: 'ilt-2026-06-16',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-06-16',
    end_date: '2026-06-26',
    format: 'spread',
    register_by: '2026-06-13',
    seats_note: '2 seats',
  },
  {
    id: 'ilt-2026-06-22-fd',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-06-22',
    end_date: '2026-06-26',
    format: 'fullday',
    register_by: '2026-06-19',
    seats_note: 'Waitlist',
  },
  {
    id: 'ilt-2026-06-22-sp',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-06-22',
    end_date: '2026-07-02',
    format: 'spread',
    register_by: '2026-06-19',
    seats_note: '2 seats',
  },
  {
    id: 'ilt-2026-07-06',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-07-06',
    end_date: '2026-07-16',
    format: 'spread',
    register_by: '2026-07-03',
    seats_note: '6 seats',
  },
  {
    id: 'ilt-2026-07-14',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-07-14',
    end_date: '2026-07-23',
    format: 'spread',
    register_by: '2026-07-11',
    seats_note: '16 seats',
  },
  {
    id: 'ilt-2026-07-20-fd',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-07-20',
    end_date: '2026-07-24',
    format: 'fullday',
    register_by: '2026-07-17',
    seats_note: '12 seats',
  },
  {
    id: 'ilt-2026-07-20-ev',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-07-20',
    end_date: '2026-07-24',
    format: 'spread',
    register_by: '2026-07-17',
    seats_note: '20 seats',
  },
  {
    id: 'ilt-2026-07-21',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-07-21',
    end_date: '2026-07-30',
    format: 'spread',
    register_by: '2026-07-18',
    seats_note: '19 seats',
  },
  {
    id: 'ilt-2026-08-17-fd',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-08-17',
    end_date: '2026-08-21',
    format: 'fullday',
    register_by: '2026-08-14',
    seats_note: '18 seats',
  },
  {
    id: 'ilt-2026-08-18',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-08-18',
    end_date: '2026-08-28',
    format: 'spread',
    register_by: '2026-08-15',
    seats_note: '19 seats',
  },
  {
    id: 'ilt-2026-08-24',
    course: IMPLEMENTING_COURSE,
    start_date: '2026-08-24',
    end_date: '2026-09-03',
    format: 'spread',
    register_by: '2026-08-21',
    seats_note: '20 seats',
  },
]

// ── Per-employee enrolments (seeded for the junior consultants) ───────────────
// The current/onboarding employee (Sarah, emp-008) is intentionally left without
// an enrolment so the employee view demonstrates the "choose your session" flow.
export const trainingEnrolments: TrainingEnrolment[] = [
  {
    employee_id: 'emp-009',
    session_id: 'ilt-2026-07-20-fd',
    cert_path: 'implementation',
    getting_started_done: true,
    ilt_done: false,
    certified: false,
    updated_at: NOW,
  },
  {
    employee_id: 'emp-010',
    session_id: 'ilt-2026-06-22-fd',
    cert_path: 'implementation',
    getting_started_done: true,
    ilt_done: true,
    certified: false,
    updated_at: NOW,
  },
  {
    employee_id: 'emp-011',
    session_id: null,
    cert_path: 'implementation',
    getting_started_done: false,
    ilt_done: false,
    certified: false,
    updated_at: NOW,
  },
]

// ── Pure helpers (no module state; safe to unit test) ─────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

/** Add `n` calendar days to an ISO date (YYYY-MM-DD). Returns YYYY-MM-DD. */
export function addCalendarDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10)
}

/** Find a session by id. */
export function findSession(sessionId: string | null): IltSession | undefined {
  if (!sessionId) return undefined
  return iltSessions.find((s) => s.id === sessionId)
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "20–24 Jul 2026" style range from two ISO dates. */
export function formatDateRange(startIso: string, endIso: string): string {
  const s = new Date(`${startIso}T00:00:00.000Z`)
  const e = new Date(`${endIso}T00:00:00.000Z`)
  const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()
  const sd = s.getUTCDate()
  const ed = e.getUTCDate()
  if (sameMonth) {
    return `${sd}–${ed} ${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`
  }
  return `${sd} ${MONTHS[s.getUTCMonth()]} – ${ed} ${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`
}

/** Single ISO date as "24 Jul 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00.000Z`)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Human label for a session: date range + format. */
export function formatSessionLabel(session: IltSession): string {
  const fmt = session.format === 'fullday' ? 'full-day week' : 'part-days'
  return `${formatDateRange(session.start_date, session.end_date)} (${fmt})`
}

const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  supervised: 'Supervised-billable',
  ilt: 'ILT complete',
  certified: 'Certified',
}

/** The ISO "today" used for status. Overridable for deterministic tests. */
function todayIso(reference?: Date): string {
  return (reference ?? new Date()).toISOString().slice(0, 10)
}

/**
 * Project the three billable milestone dates for a consultant, given their
 * enrolment. Pure: depends only on its inputs.
 */
export function computeMilestones(
  employee: Pick<Employee, 'start_date'>,
  enrolment: TrainingEnrolment | undefined,
  reference?: Date,
): BillableMilestone[] {
  const today = todayIso(reference)
  const session = findSession(enrolment?.session_id ?? null)

  const supervisedDate = employee.start_date
    ? addCalendarDays(employee.start_date, SUPERVISED_OFFSET_DAYS)
    : null
  const iltDate = session ? session.end_date : null
  const certifiedDate = session ? addCalendarDays(session.end_date, CERT_PREP_DAYS) : null

  const status = (done: boolean, date: string | null): BillableMilestone['status'] => {
    if (done) return 'done'
    if (date && date < today) return 'pending'
    return 'on_track'
  }

  return [
    {
      key: 'supervised',
      label: MILESTONE_LABELS.supervised,
      date: supervisedDate,
      status: status(Boolean(enrolment?.getting_started_done), supervisedDate),
    },
    {
      key: 'ilt',
      label: MILESTONE_LABELS.ilt,
      date: iltDate,
      status: status(Boolean(enrolment?.ilt_done), iltDate),
    },
    {
      key: 'certified',
      label: MILESTONE_LABELS.certified,
      date: certifiedDate,
      status: status(Boolean(enrolment?.certified), certifiedDate),
    },
  ]
}

/** The next milestone a consultant has not yet reached, or null when certified. */
export function nextMilestone(milestones: BillableMilestone[]): MilestoneKey | null {
  const next = milestones.find((m) => m.status !== 'done')
  return next ? next.key : null
}
