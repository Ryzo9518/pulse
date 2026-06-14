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
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Employee, UserRole } from '@/types/database'
import { getCurrentEmployee } from '@/lib/mock'

export interface MockSessionValue {
  /** The mock "logged-in" employee (defaults to the seeded onboarding employee). */
  currentEmployee: Employee | null
  /**
   * The active view role. Defaults to 'employee'. The dev RoleSwitch flips this
   * so Ryan can see the admin experience without a separate account. Independent
   * of `currentEmployee.role` on purpose — it controls which view is rendered.
   */
  role: UserRole
  /** True while a mock session is active (used by the root route redirect). */
  isAuthenticated: boolean
  /** Flip the active view role between 'employee' and 'admin'. */
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
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() =>
    getCurrentEmployee(),
  )
  const [role, setRoleState] = useState<UserRole>('employee')

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next)
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
