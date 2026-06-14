import { beforeEach, describe, expect, it } from 'vitest'

import {
  GATED_ONBOARDING_ROUTES,
  isGatedRoute,
  shouldRedirectToPolicies,
} from '../policyGate'
import {
  __resetMockState,
  acknowledgePolicy,
  getCurrentEmployee,
  getPolicyAckState,
  listPolicies,
} from '@/lib/mock'
import { TOTAL_POLICIES } from '@/lib/constants'

// ── Pure helper: the compliance gate decision (plan R4) ───────────────────────
// These tests are written test-first: the gate is a compliance control, so its
// exact decision boundary is pinned down before (and independently of) any UI.

describe('GATED_ONBOARDING_ROUTES', () => {
  it('contains the onboarding sections behind the gate', () => {
    expect(GATED_ONBOARDING_ROUTES).toContain('/workflow')
    expect(GATED_ONBOARDING_ROUTES).toContain('/sop')
    expect(GATED_ONBOARDING_ROUTES).toContain('/forms')
  })

  it('never gates /policies or /dashboard', () => {
    expect(GATED_ONBOARDING_ROUTES).not.toContain('/policies')
    expect(GATED_ONBOARDING_ROUTES).not.toContain('/dashboard')
  })
})

describe('isGatedRoute', () => {
  it('treats nested paths under a gated section as gated', () => {
    expect(isGatedRoute('/workflow')).toBe(true)
    expect(isGatedRoute('/sop/projects')).toBe(true)
    expect(isGatedRoute('/forms?step=2')).toBe(true)
  })

  it('does not gate /policies, /dashboard, or unknown routes', () => {
    expect(isGatedRoute('/policies')).toBe(false)
    expect(isGatedRoute('/dashboard')).toBe(false)
    expect(isGatedRoute('/expenses')).toBe(false)
  })
})

describe('shouldRedirectToPolicies', () => {
  it('CORE CASE: employee with 19/20 acked navigating to /workflow is redirected', () => {
    expect(
      shouldRedirectToPolicies({
        role: 'employee',
        policiesCompleted: false,
        acknowledgedCount: 19,
        totalPolicies: 20,
        targetPath: '/workflow',
      })
    ).toBe(true)
  })

  it('employee with all 20 acked is NOT redirected for gated routes', () => {
    for (const targetPath of ['/workflow', '/sop', '/forms', '/sop/desk']) {
      expect(
        shouldRedirectToPolicies({
          role: 'employee',
          policiesCompleted: true,
          acknowledgedCount: 20,
          totalPolicies: 20,
          targetPath,
        })
      ).toBe(false)
    }
  })

  it('admins are NEVER redirected, regardless of ack state or route', () => {
    for (const targetPath of ['/workflow', '/sop', '/forms', '/policies', '/dashboard']) {
      expect(
        shouldRedirectToPolicies({
          role: 'admin',
          policiesCompleted: false,
          acknowledgedCount: 0,
          totalPolicies: 20,
          targetPath,
        })
      ).toBe(false)
    }
  })

  it('/policies and /dashboard are never gated, even at 0/20 for an employee', () => {
    for (const targetPath of ['/policies', '/dashboard']) {
      expect(
        shouldRedirectToPolicies({
          role: 'employee',
          policiesCompleted: false,
          acknowledgedCount: 0,
          totalPolicies: 20,
          targetPath,
        })
      ).toBe(false)
    }
  })

  it('treats policiesCompleted=true as a pass even if the count looks short', () => {
    // policies_completed is the authoritative flag the mutator flips; honour it.
    expect(
      shouldRedirectToPolicies({
        role: 'employee',
        policiesCompleted: true,
        acknowledgedCount: 0,
        totalPolicies: 20,
        targetPath: '/workflow',
      })
    ).toBe(false)
  })

  it('redirects an employee at the start (0/20) toward a gated route', () => {
    expect(
      shouldRedirectToPolicies({
        role: 'employee',
        policiesCompleted: false,
        acknowledgedCount: 0,
        totalPolicies: 20,
        targetPath: '/forms',
      })
    ).toBe(true)
  })
})

// ── Integration with the mock accessors (plan R4 end-to-end) ──────────────────
// Drives the real mutators so the helper's inputs are validated against the
// actual ack/completed state the screen will feed it.

describe('integration: acking all 20 lifts the gate', () => {
  beforeEach(() => {
    __resetMockState()
  })

  it('acking all 20 sets policies_completed and the helper stops redirecting', () => {
    const policies = listPolicies()
    expect(policies).toHaveLength(TOTAL_POLICIES)

    // Part-way through: gate is still up for a gated route.
    acknowledgePolicy(policies[0].id)
    const partial = getPolicyAckState()
    expect(partial.acknowledgedCount).toBe(1)
    expect(getCurrentEmployee().policies_completed).toBe(false)
    expect(
      shouldRedirectToPolicies({
        role: 'employee',
        policiesCompleted: getCurrentEmployee().policies_completed,
        acknowledgedCount: partial.acknowledgedCount,
        totalPolicies: partial.total,
        targetPath: '/workflow',
      })
    ).toBe(true)

    // Acknowledge the rest.
    for (const p of policies) acknowledgePolicy(p.id)

    const full = getPolicyAckState()
    expect(full.acknowledgedCount).toBe(TOTAL_POLICIES)
    expect(full.allAcknowledged).toBe(true)
    expect(getCurrentEmployee().policies_completed).toBe(true)

    expect(
      shouldRedirectToPolicies({
        role: 'employee',
        policiesCompleted: getCurrentEmployee().policies_completed,
        acknowledgedCount: full.acknowledgedCount,
        totalPolicies: full.total,
        targetPath: '/workflow',
      })
    ).toBe(false)
  })
})
