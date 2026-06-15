import { describe, expect, it } from 'vitest'

import { rosterColumnKeys } from '@/lib/roster'

// ── Roster column projection (POPIA) ──────────────────────────────────────────
// The column set IS the UI-level POPIA control: a manager must never get the
// phone (personal data), the role badge, or the admin Notify action. Proving the
// capability flag is false elsewhere isn't enough — this asserts the page's
// projection actually drops those columns.

describe('rosterColumnKeys — POPIA column projection', () => {
  it('a manager (no personal-data capability) gets work fields only', () => {
    const keys = rosterColumnKeys(false)
    expect(keys).toEqual(['name', 'department', 'status'])
    expect(keys).not.toContain('phone')
    expect(keys).not.toContain('role')
    expect(keys).not.toContain('actions')
  })

  it('the manager view excludes the 2FA column (W8 admin-only)', () => {
    // 2FA status is a security attribute the manager view must never surface.
    expect(rosterColumnKeys(false)).not.toContain('twofa')
  })

  it('an admin gets the full column set including phone and 2FA', () => {
    const keys = rosterColumnKeys(true)
    expect(keys).toContain('phone')
    expect(keys).toContain('twofa')
    expect(keys).toContain('role')
    expect(keys).toContain('actions')
  })
})
