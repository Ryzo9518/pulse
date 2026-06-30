'use client'

// The real signed-in employee, read from the Auth.js session (set by the auth.ts
// session callback: id, role, isOwner, displayName). Screens use this as they
// migrate off the mock `useSession()` identity.
import { useSession } from 'next-auth/react'

export interface CurrentEmployee {
  id?: string
  role?: string
  isOwner?: boolean
  displayName?: string
  loading: boolean
  authenticated: boolean
}

export function useCurrentEmployee(): CurrentEmployee {
  const { data, status } = useSession()
  const employee = data?.employee
  return {
    id: employee?.id,
    role: employee?.role,
    isOwner: employee?.isOwner,
    displayName: employee?.displayName,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
  }
}
