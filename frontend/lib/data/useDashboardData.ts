'use client'

// Dashboard data controller. Live mode fetches everything the dashboard needs
// from the proxy (RLS-scoped); empty tables (certifications, billable, expenses)
// come back empty and the screen shows its existing empty states. Mock mode
// delegates to the seam, exposing the same shapes so the dashboard rendering is
// unchanged.
import { useEffect, useState } from 'react'

import {
  getBillableSummary,
  getOnboardingSummary,
  getPolicyAckState,
  listCertifications,
  listEmployees,
  listExpenseClaims,
  listTaskStatuses,
  listTasks,
} from '@/lib/mock'
import type {
  AdminOnboardingSummary,
  BillableSummaryRow,
  Certification,
  Employee,
  ExpenseClaim,
  OnboardingTask,
  OnboardingTaskStatus,
  UserRole,
} from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

export interface DashboardData {
  roster: Employee[]
  onboardingSummary: AdminOnboardingSummary[]
  tasks: OnboardingTask[]
  taskStatuses: OnboardingTaskStatus[]
  policy: { acknowledgedCount: number; total: number }
  certifications: Certification[]
  billableSummary: BillableSummaryRow[]
  expenseClaims: ExpenseClaim[]
  loading: boolean
  error: string | null
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${path.split('?')[0]} (${res.status})`)
  return res.json() as Promise<T>
}

function emptyData(loading: boolean, error: string | null): DashboardData {
  return {
    roster: [],
    onboardingSummary: [],
    tasks: [],
    taskStatuses: [],
    policy: { acknowledgedCount: 0, total: 0 },
    certifications: [],
    billableSummary: [],
    expenseClaims: [],
    loading,
    error,
  }
}

export function useDashboardData(
  role: UserRole,
  employeeId?: string,
): DashboardData {
  const [live, setLive] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!LIVE) return
    let active = true
    Promise.all([
      getJson<Employee[]>('/api/rest/employees?select=*'),
      getJson<AdminOnboardingSummary[]>('/api/rest/admin_onboarding_summary?select=*'),
      getJson<OnboardingTask[]>('/api/rest/onboarding_tasks?select=*&order=sort_order'),
      getJson<OnboardingTaskStatus[]>('/api/rest/onboarding_task_status?select=*'),
      getJson<Array<{ id: string }>>('/api/rest/hr_policies?is_active=eq.true&select=id'),
      getJson<Array<{ acknowledged: boolean }>>(
        '/api/rest/hr_policy_acknowledgements?select=acknowledged',
      ),
      // WS-5: RLS-scoped certs (self / team / all) feed the recert alerts panel.
      getJson<Certification[]>('/api/rest/certifications?select=*'),
    ])
      .then(
        ([roster, onboardingSummary, tasks, taskStatuses, policies, acks, certifications]) => {
          if (!active) return
          setLive({
            roster,
            onboardingSummary,
            tasks,
            taskStatuses,
            policy: {
              acknowledgedCount: acks.filter((a) => a.acknowledged).length,
              total: policies.length,
            },
            certifications,
            // Empty tables for now — screens render their existing empty states.
            billableSummary: [],
            expenseClaims: [],
            loading: false,
            error: null,
          })
        },
      )
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load')
      })
    return () => {
      active = false
    }
  }, [])

  if (!LIVE) {
    return {
      roster: listEmployees(),
      onboardingSummary: getOnboardingSummary(),
      tasks: listTasks(role),
      taskStatuses: listTaskStatuses(),
      policy: (() => {
        const p = getPolicyAckState()
        return { acknowledgedCount: p.acknowledgedCount, total: p.total }
      })(),
      certifications: employeeId
        ? listCertifications(role, employeeId, employeeId)
        : [],
      billableSummary: getBillableSummary(),
      expenseClaims: listExpenseClaims(),
      loading: false,
      error: null,
    }
  }

  if (error) return emptyData(false, error)
  if (!live) return emptyData(true, null)
  return live
}
