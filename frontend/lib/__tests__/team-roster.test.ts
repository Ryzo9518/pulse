import { describe, expect, it } from 'vitest'

import { listTeam } from '@/lib/mock'

// ── Manager roster scoping (POPIA / least-exposure) ───────────────────────────
// The manager "My Team" roster must show only the manager's direct reports —
// never the whole company. This is the projection that actually renders people to
// a manager, so it is pinned independently of the page.

describe('listTeam — manager roster scoping', () => {
  it('returns only the direct reports of the given manager', () => {
    const team = listTeam('emp-001')
    expect(team.length).toBeGreaterThan(0)
    expect(team.every((e) => e.manager_id === 'emp-001')).toBe(true)
    expect(team.some((e) => e.id === 'emp-001')).toBe(false) // never includes self
  })

  it('scopes correctly to a different manager', () => {
    const team = listTeam('emp-003')
    expect(team.map((e) => e.id)).toContain('emp-004')
    expect(team.every((e) => e.manager_id === 'emp-003')).toBe(true)
  })

  it('returns [] for an empty or unknown id — never the whole roster', () => {
    expect(listTeam('')).toEqual([])
    expect(listTeam('does-not-exist')).toEqual([])
  })
})
