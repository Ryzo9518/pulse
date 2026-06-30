'use client'

// ── AppShell ─────────────────────────────────────────────────────────────────
// The persistent frame every screen lives inside: a fixed 260px Sidebar on the
// left and a scrollable main content area (surface background) rendering the
// screen. The dev-only RoleSwitch floats top-right over the content.
//
// Because every in-app screen renders inside AppShell, this is also where the
// policies gate (plan R4) is enforced app-wide: an onboarding employee who has
// not acknowledged all HR policies is redirected to /policies whenever they
// land on a gated onboarding route (/workflow, /sop, /forms). The pure decision
// lives in lib/policyGate.ts; AppShell just sources the inputs and acts on it.

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useSession } from '@/lib/mock/session'
import { getPolicyAckState } from '@/lib/mock'
import { shouldRedirectToPolicies } from '@/lib/policyGate'

import { Sidebar } from './Sidebar'
import { RoleSwitch } from './RoleSwitch'

// The RoleSwitch is a dev affordance for the mock phase. In live mode the role
// comes from the real signed-in account, so it's hidden.
const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

export interface AppShellProps {
  children: ReactNode
}

/**
 * Enforces the policies gate on every navigation. Re-evaluates whenever the
 * route, role, or ack state changes; redirects employees off gated onboarding
 * routes until all policies are acknowledged. Admins are never gated.
 */
function useOnboardingGate() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, currentEmployee } = useSession()

  // `policies_completed` flips on the final acknowledgement; reading it here ties
  // the effect to the value the gate cares about so it re-runs when it changes.
  const policiesCompleted = currentEmployee?.policies_completed ?? false

  useEffect(() => {
    const ack = getPolicyAckState()
    if (
      shouldRedirectToPolicies({
        role,
        policiesCompleted,
        acknowledgedCount: ack.acknowledgedCount,
        totalPolicies: ack.total,
        targetPath: pathname ?? '/',
      })
    ) {
      router.replace('/policies')
    }
  }, [pathname, role, policiesCompleted, router])
}

export function AppShell({ children }: AppShellProps) {
  useOnboardingGate()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto bg-surface">
        {!LIVE ? (
          <div className="pointer-events-none absolute right-6 top-6 z-40">
            <div className="pointer-events-auto">
              <RoleSwitch />
            </div>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  )
}

export default AppShell
