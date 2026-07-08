// ── Policies gate: the pure compliance guard decision (plan R4) ───────────────
// This module encodes the single rule that protects PULSE's highest-risk
// compliance control: an onboarding employee may not reach the gated onboarding
// sections until they have acknowledged ALL HR policies.
//
// It is intentionally framework-agnostic and side-effect-free:
//   - no React, no Next.js, no imports from the mock layer
//   - it takes plain values in and returns a boolean
// so it is trivially unit-testable and reusable from anywhere (a route guard, a
// Sidebar link disable, middleware, a future real-auth layer). The caller is
// responsible for SOURCING the inputs (role + ack state) and for ACTING on the
// decision (e.g. router.replace('/policies')).
//
// ── How the orchestrator should consume this (integration happens elsewhere) ──
// The workflow / sop / forms screens and the Sidebar live in OTHER worktrees.
// In the integration step, each gated screen (or a shared guard hook) should, on
// mount / navigation, compute:
//
//   import { shouldRedirectToPolicies } from '@/lib/policyGate'
//   import { useSession } from '@/lib/mock/session'
//   import { getPolicyAckState } from '@/lib/mock'
//
//   const { role, currentEmployee } = useSession()
//   const ack = getPolicyAckState()
//   if (shouldRedirectToPolicies({
//         role,
//         policiesCompleted: currentEmployee?.policies_completed ?? false,
//         acknowledgedCount: ack.acknowledgedCount,
//         totalPolicies: ack.total,
//         targetPath: pathname,            // the route being entered
//       })) {
//     router.replace('/policies')
//   }
//
// The Sidebar can use the same helper to disable/lock gated nav links.

/**
 * Onboarding routes that sit BEHIND the policies gate. An onboarding employee
 * who has not acknowledged every policy is redirected to /policies when they try
 * to reach any of these. Exported so the orchestrator can wire route redirects
 * and lock the corresponding Sidebar links without re-deriving the list.
 *
 * NOTE: '/policies' and '/dashboard' are deliberately absent — they are never
 * gated (the user must be able to reach the gate itself, and the dashboard is
 * the safe landing surface).
 */
export const GATED_ONBOARDING_ROUTES = ['/workflow', '/sop', '/forms'] as const

export type GatedRoute = (typeof GATED_ONBOARDING_ROUTES)[number]

/**
 * True when `targetPath` falls under one of the gated onboarding sections.
 * Matches the section root and any nested path/query beneath it
 * (e.g. '/sop/projects', '/forms?step=2'), so deep links can't slip past the
 * gate. '/policies' and '/dashboard' (and anything not in the list) are never
 * gated.
 */
export function isGatedRoute(targetPath: string): boolean {
  // Normalise: strip query/hash and any trailing slash before comparing.
  const path = targetPath.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  return GATED_ONBOARDING_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  )
}

export interface ShouldRedirectArgs {
  /**
   * Active view role from the session. Only an onboarding *employee* is gated;
   * managers and admins are never redirected (they are not the onboarding user).
   */
  role: 'admin' | 'manager' | 'employee'
  /** The authoritative completion flag (currentEmployee.policies_completed). */
  policiesCompleted: boolean
  /** Count of acknowledged policies (from getPolicyAckState().acknowledgedCount). */
  acknowledgedCount: number
  /**
   * Total policies required — the DYNAMIC count of seeded/created policies, from
   * getPolicyAckState().total (= listPolicies().length). Never a hardcoded
   * constant: passing a stale fixed total would let the gate lift early whenever
   * a policy is added. Callers MUST pass the dynamic count.
   */
  totalPolicies: number
  /** The onboarding route the user is trying to navigate to. */
  targetPath: string
}

/**
 * The gate decision. Returns `true` (caller should redirect to /policies) ONLY
 * when ALL of the following hold:
 *   1. role is 'employee'                     — managers/admins are NEVER redirected
 *   2. policies are NOT yet complete          — completed flag false AND
 *                                               acknowledgedCount < totalPolicies
 *   3. targetPath is a gated onboarding route — see GATED_ONBOARDING_ROUTES
 *
 * Otherwise returns `false`. The `policiesCompleted` flag is treated as
 * authoritative: if it is true the gate is lifted even if the count looks short
 * (it is the flag the acknowledgePolicy mutator flips and the backend will
 * persist). Both signals must indicate "done" for the gate to lift on count
 * alone.
 */
export function shouldRedirectToPolicies(args: ShouldRedirectArgs): boolean {
  const {
    role,
    policiesCompleted,
    acknowledgedCount,
    totalPolicies,
    targetPath,
  } = args

  // Only an onboarding employee is gated; managers and admins bypass entirely.
  if (role !== 'employee') return false

  // Gate only applies to the protected onboarding sections.
  if (!isGatedRoute(targetPath)) return false

  // Completed by either the authoritative flag or a full acknowledgement count.
  const completed = policiesCompleted || acknowledgedCount >= totalPolicies
  if (completed) return false

  return true
}
