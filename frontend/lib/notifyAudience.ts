// ── Notify All audience resolution ────────────────────────────────────────────
// Pure helpers for the admin "Notify All" composer (frontend/app/admin/notify).
// Kept out of the page module so the live recipient-count logic has its own unit
// tests (Next.js forbids arbitrary named exports from page files) and so the
// audience boundary is verifiable independent of rendering.
//
// Mirrors the prototype's AUDIENCES array in notifyData(): a set of fixed
// segments (Everyone / Onboarding / On probation) plus one option per department.
// Counts are LIVE — computed from the passed roster — so adding people to a
// segment immediately changes the option label and the Recipients card.

import type { Employee } from '@/types/database'

/** A selectable broadcast audience, identified by a stable value. */
export interface AudienceSegment {
  value: string
  /** Base human label without the count (e.g. "Onboarding", "Consulting dept"). */
  label: string
  /** Predicate deciding whether an employee is in this audience. */
  matches: (employee: Employee) => boolean
}

/** The three fixed segments, in display order, mirroring the prototype. */
const FIXED_SEGMENTS: AudienceSegment[] = [
  { value: 'all', label: 'Everyone', matches: () => true },
  {
    value: 'onboarding',
    label: 'Onboarding',
    matches: (e) => e.status === 'onboarding',
  },
  {
    value: 'probation',
    label: 'On probation',
    matches: (e) => e.status === 'probation',
  },
]

/**
 * Build the full ordered list of audience segments for a roster: the three fixed
 * segments followed by one "<Dept> dept" segment per distinct department, sorted
 * alphabetically. Departments are derived from the roster so the options always
 * reflect who actually exists.
 */
export function buildAudienceSegments(roster: Employee[]): AudienceSegment[] {
  const departments = Array.from(
    new Set(
      roster
        .map((e) => e.department)
        .filter((d): d is string => Boolean(d)),
    ),
  ).sort()

  const deptSegments: AudienceSegment[] = departments.map((dept) => ({
    value: `dept:${dept}`,
    label: `${dept} dept`,
    matches: (e) => e.department === dept,
  }))

  return [...FIXED_SEGMENTS, ...deptSegments]
}

/** The employees matching a segment — the LIVE recipient list. */
export function recipientsFor(
  segment: AudienceSegment,
  roster: Employee[],
): Employee[] {
  return roster.filter(segment.matches)
}

/** The LIVE recipient count for a segment over a roster. */
export function audienceCount(
  segment: AudienceSegment,
  roster: Employee[],
): number {
  return recipientsFor(segment, roster).length
}

/** Find a segment by value, falling back to "Everyone" for unknown values. */
export function findSegment(
  segments: AudienceSegment[],
  value: string,
): AudienceSegment {
  return segments.find((s) => s.value === value) ?? segments[0]
}
