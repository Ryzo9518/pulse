'use client'

// SOPs data controller. Live mode reads the SOPs + their steps from the proxy
// (org-wide, all-authenticated readable); mock mode delegates to the seam. Same
// shapes either way so the SOP viewer is unchanged.
import { useEffect, useState } from 'react'

import { listSops, listSopSteps } from '@/lib/mock'
import type { Sop, SopKey, SopStep } from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

export interface SopsData {
  sops: Sop[]
  stepsByKey: Map<SopKey, SopStep[]>
  loading: boolean
  error: string | null
}

function groupSteps(steps: SopStep[]): Map<SopKey, SopStep[]> {
  const map = new Map<SopKey, SopStep[]>()
  for (const s of steps) {
    const list = map.get(s.sop_key) ?? []
    list.push(s)
    map.set(s.sop_key, list)
  }
  return map
}

export function useSops(): SopsData {
  const [live, setLive] = useState<SopsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!LIVE) return
    let active = true
    Promise.all([
      fetch('/api/rest/sops?select=*', { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error(`sops (${r.status})`)
        return r.json() as Promise<Sop[]>
      }),
      fetch('/api/rest/sop_steps?select=*&order=sop_key,step_number', {
        cache: 'no-store',
      }).then((r) => {
        if (!r.ok) throw new Error(`sop steps (${r.status})`)
        return r.json() as Promise<SopStep[]>
      }),
    ])
      .then(([sops, steps]) => {
        if (active) {
          setLive({ sops, stepsByKey: groupSteps(steps), loading: false, error: null })
        }
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load')
      })
    return () => {
      active = false
    }
  }, [])

  if (!LIVE) {
    const sops = listSops()
    const map = new Map<SopKey, SopStep[]>()
    for (const s of sops) map.set(s.key, listSopSteps(s.key))
    return { sops, stepsByKey: map, loading: false, error: null }
  }
  if (error) return { sops: [], stepsByKey: new Map(), loading: false, error }
  if (!live) return { sops: [], stepsByKey: new Map(), loading: true, error: null }
  return live
}
