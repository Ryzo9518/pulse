'use client'

// WS-2: Workflow/Onboarding board data controller. Behind NEXT_PUBLIC_PULSE_DATA
// =live it reads onboarding_phases + onboarding_tasks + the visible
// onboarding_workflows instances (RLS-scoped: employee -> own, manager -> team,
// admin -> all) and the selected instance's onboarding_task_status rows via the
// authenticated proxy; writes go through the server actions (per-user JWT,
// direct to PostgREST — RLS + the freeze/order triggers enforce the contract).
// Otherwise it delegates to the mock seam, preserving current dev behaviour.
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  listPhases,
  listTasks,
  listAssignableOwners,
  listEmployees,
  getTaskStatus,
  setTaskStatus as mockSetTaskStatus,
  getTaskOwner,
  setTaskOwner as mockSetTaskOwner,
} from '@/lib/mock'
import { can } from '@/lib/capabilities'
import type {
  Employee,
  OnboardingPhase,
  OnboardingTask,
  OnboardingTaskStatus,
  TaskStatus,
  UserRole,
} from '@/types/database'

import { updateTaskStatus, assignTaskOwner } from '@/app/workflow/actions'
import { resolveOwner, visiblePhases, visibleTasks } from './workflow-live'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

/** One onboarding instance the viewer may see (the person being onboarded). */
export interface WorkflowInstance {
  id: string
  employeeId: string
  employeeName: string
}

export interface WriteOutcome {
  ok: boolean
  denied?: boolean
  error?: string
}

export interface WorkflowController {
  /** Role-visible phases/tasks (RLS also scopes rows live; this is display). */
  phases: OnboardingPhase[]
  tasks: OnboardingTask[]
  /** Instances visible to the viewer; employees see at most their own. */
  instances: WorkflowInstance[]
  selectedId: string | null
  select: (workflowId: string) => void
  /** False (live) when the signed-in employee has no onboarding workflow. */
  hasWorkflow: boolean
  loading: boolean
  error: string | null
  /** Live: admin/manager only (contract C7-emp — employees are read-only). */
  canWriteStatus: boolean
  canAssignOwners: boolean
  owners: Employee[]
  statusOf: (taskId: string) => TaskStatus
  ownerOf: (taskId: string) => Employee | undefined
  setStatus: (taskId: string, next: TaskStatus) => Promise<WriteOutcome>
  assignOwner: (taskId: string, ownerId: string | null) => Promise<WriteOutcome>
  /** Task id with an in-flight write (MSG-PENDING-SAVING), else null. */
  savingTaskId: string | null
}

interface LiveWorkflowRow {
  id: string
  employee_id: string
}

interface LiveState {
  phases: OnboardingPhase[]
  tasks: OnboardingTask[]
  workflows: LiveWorkflowRow[]
  employees: Employee[]
  loading: boolean
  error: string | null
}

async function getJson<T>(path: string, label: string): Promise<T> {
  const res = await fetch(`/api/rest/${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${label} (${res.status})`)
  return (await res.json()) as T
}

export function useWorkflow(
  role: UserRole,
  viewerEmployeeId?: string,
): WorkflowController {
  const [tick, setTick] = useState(0) // mock re-render + live refetch trigger
  const [live, setLive] = useState<LiveState>(() => ({
    phases: [],
    tasks: [],
    workflows: [],
    employees: [],
    loading: LIVE,
    error: null,
  }))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusRows, setStatusRows] = useState<OnboardingTaskStatus[]>([])
  const [statusTick, setStatusTick] = useState(0)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)

  // ── Live: reference data + visible workflow instances ─────────────────────
  useEffect(() => {
    if (!LIVE) return
    let active = true
    setLive((s) => ({ ...s, loading: true, error: null }))
    Promise.all([
      getJson<OnboardingPhase[]>('onboarding_phases?order=sort_order.asc', 'phases'),
      getJson<OnboardingTask[]>('onboarding_tasks?order=sort_order.asc', 'tasks'),
      getJson<LiveWorkflowRow[]>(
        'onboarding_workflows?select=id,employee_id&completed_at=is.null&order=started_at.asc',
        'workflows',
      ),
      getJson<Employee[]>(
        'employees?select=id,display_name,first_name,last_name,email,avatar_initials,avatar_color,role,status&order=display_name.asc',
        'people',
      ),
    ])
      .then(([phases, tasks, workflows, employees]) => {
        if (!active) return
        setLive({ phases, tasks, workflows, employees, loading: false, error: null })
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

  // Default selection: the viewer's own workflow when they have one, else the
  // first visible instance (staff browsing the team/all boards).
  useEffect(() => {
    if (!LIVE) return
    if (live.loading) return
    if (selectedId && live.workflows.some((w) => w.id === selectedId)) return
    const own = viewerEmployeeId
      ? live.workflows.find((w) => w.employee_id === viewerEmployeeId)
      : undefined
    setSelectedId(own?.id ?? live.workflows[0]?.id ?? null)
  }, [live.loading, live.workflows, selectedId, viewerEmployeeId])

  // ── Live: the selected instance's task-status rows ────────────────────────
  useEffect(() => {
    if (!LIVE || !selectedId) return
    let active = true
    getJson<OnboardingTaskStatus[]>(
      `onboarding_task_status?workflow_id=eq.${encodeURIComponent(selectedId)}`,
      'task status',
    )
      .then((rows) => {
        if (active) setStatusRows(rows)
      })
      .catch(() => {
        if (active) setStatusRows([])
      })
    return () => {
      active = false
    }
  }, [selectedId, statusTick])

  const refetchStatuses = useCallback(() => setStatusTick((t) => t + 1), [])

  // ── Shared shapes ──────────────────────────────────────────────────────────
  const phases = useMemo(
    () => (LIVE ? visiblePhases(live.phases, role) : listPhases(role)),
    [live.phases, role, tick],
  )
  const tasks = useMemo(
    () => (LIVE ? visibleTasks(live.tasks, role) : listTasks(role)),
    [live.tasks, role, tick],
  )

  const instances = useMemo<WorkflowInstance[]>(() => {
    if (!LIVE) return []
    const byId = new Map(live.employees.map((e) => [e.id, e]))
    return live.workflows.map((w) => ({
      id: w.id,
      employeeId: w.employee_id,
      employeeName: byId.get(w.employee_id)?.display_name ?? 'Unknown employee',
    }))
  }, [live.workflows, live.employees])

  const statusByTaskId = useMemo(() => {
    const map = new Map<string, OnboardingTaskStatus>()
    for (const row of statusRows) map.set(row.task_id, row)
    return map
  }, [statusRows])

  const statusOf = useCallback(
    (taskId: string): TaskStatus => {
      if (LIVE) return statusByTaskId.get(taskId)?.status ?? 'pending'
      return getTaskStatus(taskId)?.status ?? 'pending'
    },
    // tick re-reads the mutable mock seam after a mutation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusByTaskId, tick],
  )

  const ownerOf = useCallback(
    (taskId: string): Employee | undefined => {
      if (LIVE) {
        const task = live.tasks.find((t) => t.id === taskId)
        return resolveOwner(
          statusByTaskId.get(taskId)?.assigned_to,
          task?.default_owner,
          live.employees,
        )
      }
      const id = getTaskOwner(taskId)
      return id ? listEmployees().find((e) => e.id === id) : undefined
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusByTaskId, live.tasks, live.employees, tick],
  )

  const owners = useMemo<Employee[]>(
    () => (LIVE ? live.employees : listAssignableOwners()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live.employees, tick],
  )

  // ── Writes ────────────────────────────────────────────────────────────────
  const setStatus = useCallback(
    async (taskId: string, next: TaskStatus): Promise<WriteOutcome> => {
      if (!LIVE) {
        mockSetTaskStatus(taskId, next)
        setTick((t) => t + 1)
        return { ok: true }
      }
      const row = statusByTaskId.get(taskId)
      if (!row) return { ok: false, denied: true }
      setSavingTaskId(taskId)
      try {
        const result = await updateTaskStatus(row.id, next)
        if (result.ok) refetchStatuses()
        return result
      } finally {
        setSavingTaskId(null)
      }
    },
    [statusByTaskId, refetchStatuses],
  )

  const assignOwner = useCallback(
    async (taskId: string, ownerId: string | null): Promise<WriteOutcome> => {
      if (!LIVE) {
        mockSetTaskOwner(taskId, ownerId)
        setTick((t) => t + 1)
        return { ok: true }
      }
      const row = statusByTaskId.get(taskId)
      if (!row) return { ok: false, denied: true }
      setSavingTaskId(taskId)
      try {
        const result = await assignTaskOwner(row.id, ownerId)
        if (result.ok) refetchStatuses()
        return result
      } finally {
        setSavingTaskId(null)
      }
    },
    [statusByTaskId, refetchStatuses],
  )

  return {
    phases,
    tasks,
    instances,
    selectedId: LIVE ? selectedId : 'mock',
    select: setSelectedId,
    // Mock mode always renders the single seeded workflow.
    hasWorkflow: LIVE ? selectedId !== null : true,
    loading: LIVE ? live.loading : false,
    error: LIVE ? live.error : null,
    // Contract C7-emp: employees are read-only on the live board (REJ-UI-HIDDEN);
    // mock mode keeps the permissive dev behaviour.
    canWriteStatus: LIVE ? role === 'admin' || role === 'manager' : true,
    canAssignOwners: can(role, 'assignTaskOwners'),
    owners,
    statusOf,
    ownerOf,
    setStatus,
    assignOwner,
    savingTaskId,
  }
}
