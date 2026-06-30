'use client'

// ── Mock session context ─────────────────────────────────────────────────────
// Stands in for real auth (frontend/hooks/useAuth.ts is left untouched for the
// backend phase). Holds the "logged-in" mock employee and the active view role,
// and exposes a dev-only role switch so both employee and admin experiences are
// viewable without logging in as different people (plan R3).
//
// State is in-memory and resets on a full page reload — acceptable for this
// mock phase.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  signOut as nextAuthSignOut,
  useSession as useAuthSession,
} from 'next-auth/react'

import type { Employee, UserRole } from '@/types/database'
import { getCurrentEmployee, getEmployee } from '@/lib/mock'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

// Dev-only: which mock identity backs each view role. Team scoping reads
// currentEmployee.id, so the manager view must be a lead with real direct
// reports — otherwise "My Team" is always empty. Employee = the seeded
// onboarding hire (drives the policy gate); admin keeps the default identity
// (admin screens are identity-independent). Production resolves identity + role
// together from the authenticated M365 user; this swap is purely a dev affordance.
const MANAGER_PERSONA_ID = 'emp-001'

function personaForRole(role: UserRole): Employee | null {
  if (role === 'manager') {
    return getEmployee(MANAGER_PERSONA_ID) ?? getCurrentEmployee()
  }
  return getCurrentEmployee()
}

export interface MockSessionValue {
  /** The mock "logged-in" employee (defaults to the seeded onboarding employee). */
  currentEmployee: Employee | null
  /**
   * The active view role. Defaults to 'employee'. The dev RoleSwitch flips this
   * so Ryan can see the manager and admin experiences without a separate
   * account. Independent of `currentEmployee.role` on purpose — it controls
   * which view is rendered.
   */
  role: UserRole
  /** True while a mock session is active (used by the root route redirect). */
  isAuthenticated: boolean
  /** Flip the active view role between 'employee', 'manager', and 'admin'. */
  setRole: (role: UserRole) => void
  /** Clear the session. Callers route to /login afterward. */
  signOut: () => void
}

const MockSessionContext = createContext<MockSessionValue | null>(null)

export interface MockSessionProviderProps {
  children: ReactNode
}

/**
 * Provides the mock session. Wrap the app once (in the root layout); consume via
 * `useSession()`. Defaults to an active session for the seeded onboarding
 * employee in the 'employee' view.
 */
export function MockSessionProvider({ children }: MockSessionProviderProps) {
  return LIVE ? (
    <LiveSessionProvider>{children}</LiveSessionProvider>
  ) : (
    <MockSessionProviderImpl>{children}</MockSessionProviderImpl>
  )
}

function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-text-muted">
      Loading your profile…
    </div>
  )
}

/**
 * Live session: the real signed-in employee from Auth.js. The full employee
 * record is fetched through the RLS proxy so every screen's `currentEmployee`
 * is the actual person (name, avatar, role) — never a mock persona. Render is
 * gated until the profile loads, so `currentEmployee` is always non-null below.
 */
function LiveSessionProvider({ children }: MockSessionProviderProps) {
  const { data, status } = useAuthSession()
  const sessionEmployee = data?.employee
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const id = sessionEmployee?.id
    if (!id) return
    let active = true
    fetch(`/api/rest/employees?id=eq.${encodeURIComponent(id)}&limit=1`, {
      cache: 'no-store',
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<Employee[]>
      })
      .then((rows) => {
        if (active) setEmployee(rows[0] ?? null)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [sessionEmployee?.id])

  const value = useMemo<MockSessionValue>(
    () => ({
      currentEmployee: employee,
      role: (sessionEmployee?.role as UserRole) ?? 'employee',
      isAuthenticated: status === 'authenticated',
      setRole: () => {}, // real role from the session — no dev switch when live
      signOut: () => {
        void nextAuthSignOut({ callbackUrl: '/login' })
      },
    }),
    [employee, sessionEmployee?.role, status],
  )

  if (
    status === 'loading' ||
    (status === 'authenticated' && !employee && !failed)
  ) {
    return <SessionLoading />
  }

  return (
    <MockSessionContext.Provider value={value}>
      {children}
    </MockSessionContext.Provider>
  )
}

function MockSessionProviderImpl({ children }: MockSessionProviderProps) {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() =>
    getCurrentEmployee(),
  )
  const [role, setRoleState] = useState<UserRole>('employee')

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next)
    // Swap the backing mock identity so role-scoped screens (e.g. the manager's
    // team roster) have realistic data to render in this mock phase.
    setCurrentEmployee(personaForRole(next))
  }, [])

  const signOut = useCallback(() => {
    setCurrentEmployee(null)
    setRoleState('employee')
  }, [])

  const value = useMemo<MockSessionValue>(
    () => ({
      currentEmployee,
      role,
      isAuthenticated: currentEmployee !== null,
      setRole,
      signOut,
    }),
    [currentEmployee, role, setRole, signOut],
  )

  return (
    <MockSessionContext.Provider value={value}>
      {children}
    </MockSessionContext.Provider>
  )
}

/**
 * Access the mock session. Must be called under a <MockSessionProvider>.
 * Usage: const { currentEmployee, role, setRole, signOut } = useSession()
 */
export function useSession(): MockSessionValue {
  const ctx = useContext(MockSessionContext)
  if (!ctx) {
    throw new Error('useSession must be used within a <MockSessionProvider>')
  }
  return ctx
}

export default MockSessionProvider
