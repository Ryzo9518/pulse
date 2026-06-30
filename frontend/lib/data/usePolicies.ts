'use client'

// Policies data controller. Behind NEXT_PUBLIC_PULSE_DATA=live it reads the live
// hr_policies + the signed-in user's acknowledgements via the proxy and writes
// acks back (RLS-scoped; a DB trigger maintains policies_completed). Otherwise it
// delegates to the mock seam, preserving current behaviour. Exposes the same
// shapes the Policies screen already consumes so the rendering is unchanged.
import { useCallback, useEffect, useState } from 'react'

import {
  listPolicies,
  getPolicyAckState,
  listPolicyAcknowledgements,
  acknowledgePolicy as mockAcknowledge,
  startReadingPolicy as mockStartReading,
} from '@/lib/mock'
import type { HrPolicy } from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

interface AckRow {
  policy_id: string
  acknowledged: boolean
}

export interface PoliciesController {
  policies: HrPolicy[]
  ackById: Map<string, boolean>
  acknowledgedCount: number
  total: number
  allAcknowledged: boolean
  loading: boolean
  error: string | null
  /** Acknowledge a policy (live: upsert via proxy then refetch; mock: in-memory). */
  acknowledge: (policyId: string) => Promise<void>
  /** Record that reading started (mock only; live records it at ack time). */
  startReading: (policyId: string) => void
  /** Force a re-read (used after mock-mode authoring mutations). */
  reload: () => void
}

export function usePolicies(employeeId?: string): PoliciesController {
  const [tick, setTick] = useState(0)
  const [live, setLive] = useState<{
    policies: HrPolicy[]
    ackById: Map<string, boolean>
    loading: boolean
    error: string | null
  }>(() => ({ policies: [], ackById: new Map(), loading: LIVE, error: null }))

  useEffect(() => {
    if (!LIVE) return
    let active = true
    setLive((s) => ({ ...s, loading: true, error: null }))
    Promise.all([
      fetch('/api/rest/hr_policies?is_active=eq.true&order=sort_order', {
        cache: 'no-store',
      }).then((r) => {
        if (!r.ok) throw new Error(`policies (${r.status})`)
        return r.json() as Promise<HrPolicy[]>
      }),
      fetch('/api/rest/hr_policy_acknowledgements?select=policy_id,acknowledged', {
        cache: 'no-store',
      }).then((r) => {
        if (!r.ok) throw new Error(`acknowledgements (${r.status})`)
        return r.json() as Promise<AckRow[]>
      }),
    ])
      .then(([policies, acks]) => {
        if (!active) return
        const ackById = new Map<string, boolean>()
        for (const a of acks) ackById.set(a.policy_id, a.acknowledged)
        setLive({ policies, ackById, loading: false, error: null })
      })
      .catch((e: unknown) => {
        if (active) {
          setLive((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load',
          }))
        }
      })
    return () => {
      active = false
    }
  }, [tick])

  const acknowledge = useCallback(
    async (policyId: string) => {
      if (!LIVE) {
        mockAcknowledge(policyId)
        setTick((t) => t + 1)
        return
      }
      if (!employeeId) throw new Error('Not signed in')
      const now = new Date().toISOString()
      const res = await fetch(
        '/api/rest/hr_policy_acknowledgements?on_conflict=employee_id,policy_id',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            employee_id: employeeId,
            policy_id: policyId,
            acknowledged: true,
            acknowledged_at: now,
            read_started_at: now,
          }),
        },
      )
      if (!res.ok) throw new Error(`Could not save (${res.status})`)
      setTick((t) => t + 1) // refetch acks (and the trigger-updated gate)
    },
    [employeeId],
  )

  const startReading = useCallback((policyId: string) => {
    if (!LIVE) {
      mockStartReading(policyId)
      setTick((t) => t + 1)
    }
    // live: read_started_at is recorded when the policy is acknowledged
  }, [])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  if (LIVE) {
    const acknowledgedCount = Array.from(live.ackById.values()).filter(
      Boolean,
    ).length
    const total = live.policies.length
    return {
      policies: live.policies,
      ackById: live.ackById,
      acknowledgedCount,
      total,
      allAcknowledged: total > 0 && acknowledgedCount >= total,
      loading: live.loading,
      error: live.error,
      acknowledge,
      startReading,
      reload,
    }
  }

  // Mock mode: re-read the (mutable) mock seam on each tick.
  void tick
  const policies = listPolicies()
  const ackById = new Map<string, boolean>()
  for (const a of listPolicyAcknowledgements()) {
    ackById.set(a.policy_id, a.acknowledged)
  }
  const state = getPolicyAckState()
  return {
    policies,
    ackById,
    acknowledgedCount: state.acknowledgedCount,
    total: state.total,
    allAcknowledged: state.allAcknowledged,
    loading: false,
    error: null,
    acknowledge,
    startReading,
    reload,
  }
}
