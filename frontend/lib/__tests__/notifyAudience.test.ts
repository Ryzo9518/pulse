import { describe, expect, it } from 'vitest'

import {
  audienceCount,
  buildAudienceSegments,
  findSegment,
  recipientsFor,
} from '@/lib/notifyAudience'
import { listEmployees } from '@/lib/mock'
import type { Employee } from '@/types/database'

// ── Notify All — LIVE audience-count computation ──────────────────────────────
// The composer's audience options and Recipients card show counts computed from
// the real roster. These must be live (derived from the data), never hardcoded,
// so adding people to a segment changes the count.

function makeEmployee(over: Partial<Employee>): Employee {
  return {
    id: over.id ?? 'e?',
    email: 'x@jera.co.za',
    first_name: 'X',
    last_name: 'Y',
    display_name: 'X Y',
    avatar_initials: 'XY',
    role: 'employee',
    status: 'active',
    job_title: 'Consultant',
    department: 'Consulting',
    phone: null,
    avatar_color: '#911431',
    manager_id: null,
    start_date: null,
    two_factor_enabled: false,
    expense_role: 'submitter',
    policies_completed: false,
    onboarding_completed: false,
    created_at: '',
    updated_at: '',
    ...over,
  }
}

describe('notifyAudience — live recipient counts', () => {
  const roster: Employee[] = [
    makeEmployee({ id: 'a', status: 'active', department: 'Consulting' }),
    makeEmployee({ id: 'b', status: 'active', department: 'IT' }),
    makeEmployee({ id: 'c', status: 'onboarding', department: 'Consulting' }),
    makeEmployee({ id: 'd', status: 'onboarding', department: 'Development' }),
    makeEmployee({ id: 'e', status: 'probation', department: 'Consulting' }),
  ]

  it('Everyone counts the whole roster', () => {
    const segments = buildAudienceSegments(roster)
    const everyone = findSegment(segments, 'all')
    expect(audienceCount(everyone, roster)).toBe(5)
  })

  it('Onboarding and On probation count only matching statuses', () => {
    const segments = buildAudienceSegments(roster)
    expect(audienceCount(findSegment(segments, 'onboarding'), roster)).toBe(2)
    expect(audienceCount(findSegment(segments, 'probation'), roster)).toBe(1)
  })

  it('builds one segment per distinct department, sorted, with live counts', () => {
    const segments = buildAudienceSegments(roster)
    const deptSegments = segments.filter((s) => s.value.startsWith('dept:'))
    expect(deptSegments.map((s) => s.label)).toEqual([
      'Consulting dept',
      'Development dept',
      'IT dept',
    ])
    expect(audienceCount(findSegment(segments, 'dept:Consulting'), roster)).toBe(3)
    expect(audienceCount(findSegment(segments, 'dept:IT'), roster)).toBe(1)
  })

  it('counts are live: adding a matching person increases the count', () => {
    const before = buildAudienceSegments(roster)
    expect(audienceCount(findSegment(before, 'onboarding'), roster)).toBe(2)

    const bigger = [...roster, makeEmployee({ id: 'f', status: 'onboarding' })]
    const after = buildAudienceSegments(bigger)
    expect(audienceCount(findSegment(after, 'onboarding'), bigger)).toBe(3)
  })

  it('recipientsFor returns the actual matching employees', () => {
    const segments = buildAudienceSegments(roster)
    const onboarding = recipientsFor(findSegment(segments, 'onboarding'), roster)
    expect(onboarding.map((e) => e.id).sort()).toEqual(['c', 'd'])
  })

  it('findSegment falls back to Everyone for an unknown value', () => {
    const segments = buildAudienceSegments(roster)
    expect(findSegment(segments, 'does-not-exist').value).toBe('all')
  })

  it('Everyone over the real seeded roster equals the full roster length', () => {
    const real = listEmployees()
    const segments = buildAudienceSegments(real)
    expect(audienceCount(findSegment(segments, 'all'), real)).toBe(real.length)
  })
})
