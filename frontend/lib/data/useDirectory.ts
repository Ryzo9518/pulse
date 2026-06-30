'use client'

// The first live-data hook (B2). Behind the NEXT_PUBLIC_PULSE_DATA flag it
// fetches the employee directory from the authenticated proxy (RLS-scoped to
// the signed-in user); otherwise it returns the in-memory mock synchronously, so
// nothing changes until the flag is flipped. This is the pattern the remaining
// seam accessors follow as they move from mock to live.
import { useEffect, useState } from 'react'

import { listEmployees } from '@/lib/mock'
import type { Employee } from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

export interface DirectoryState {
  employees: Employee[]
  loading: boolean
  error: string | null
}

export function useDirectory(): DirectoryState {
  const [state, setState] = useState<DirectoryState>(() =>
    LIVE
      ? { employees: [], loading: true, error: null }
      : { employees: listEmployees(), loading: false, error: null },
  )

  useEffect(() => {
    if (!LIVE) return
    let active = true
    fetch('/api/rest/employees?select=*&order=display_name.asc', {
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Directory request failed (${res.status})`)
        return (await res.json()) as Employee[]
      })
      .then((employees) => {
        if (active) setState({ employees, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (active) {
          setState({
            employees: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load',
          })
        }
      })
    return () => {
      active = false
    }
  }, [])

  return state
}
