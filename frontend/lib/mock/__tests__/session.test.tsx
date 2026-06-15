import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import { MockSessionProvider, useSession } from '@/lib/mock/session'
import { Sidebar } from '@/components/layout/Sidebar'
import { __resetMockState } from '@/lib/mock'

// Sidebar uses next/navigation routing hooks; stub them so it renders in jsdom.
const push = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push }),
}))

function wrapper({ children }: { children: ReactNode }) {
  return <MockSessionProvider>{children}</MockSessionProvider>
}

beforeEach(() => {
  __resetMockState()
  push.mockClear()
})

describe('useSession context', () => {
  it('defaults to the seeded current employee in the employee view', () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    expect(result.current.role).toBe('employee')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.currentEmployee).not.toBeNull()
  })

  it('setRole updates the active role', () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    expect(result.current.role).toBe('employee')
    act(() => result.current.setRole('admin'))
    expect(result.current.role).toBe('admin')
    act(() => result.current.setRole('employee'))
    expect(result.current.role).toBe('employee')
  })

  it('signOut clears the session', () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    act(() => result.current.signOut())
    expect(result.current.currentEmployee).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useSession())).toThrow(
      /must be used within a <MockSessionProvider>/,
    )
  })
})

describe('Sidebar role-based admin visibility', () => {
  it('hides admin nav items in the employee view', () => {
    render(
      <MockSessionProvider>
        <Sidebar />
      </MockSessionProvider>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('All Employees')).not.toBeInTheDocument()
    expect(screen.queryByText('Notify All')).not.toBeInTheDocument()
  })

  it('shows admin nav items once the role is switched to admin', () => {
    // Drive the role switch through a child so the Sidebar re-renders in-context.
    function Harness() {
      const { setRole } = useSession()
      return (
        <>
          <button type="button" onClick={() => setRole('admin')}>
            go-admin
          </button>
          <Sidebar />
        </>
      )
    }

    render(
      <MockSessionProvider>
        <Harness />
      </MockSessionProvider>,
    )

    expect(screen.queryByText('All Employees')).not.toBeInTheDocument()
    act(() => {
      screen.getByText('go-admin').click()
    })

    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('All Employees')).toBeInTheDocument()
    expect(screen.getByText('New Employee')).toBeInTheDocument()
    expect(screen.getByText('Notify All')).toBeInTheDocument()
    // Passwords screen was removed (decision D4).
    expect(screen.queryByText('Passwords')).not.toBeInTheDocument()
  })
})
