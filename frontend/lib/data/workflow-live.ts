// ── Workflow live-data helpers (pure, unit-testable) ─────────────────────────
// WS-2: the role-visibility rules, the GOV §3.6 status-edge payload builder,
// and progress math used by useWorkflow. Kept free of React/fetch so vitest can
// cover the contract-critical logic directly (mirrors rest-proxy.ts).

import type {
  Employee,
  OnboardingPhase,
  OnboardingTask,
  TaskStatus,
  UserRole,
} from '@/types/database'

/**
 * Phases visible to a role (HANDOFF §2 / GOV §1.3):
 * a manager never sees the HR-admin phase (payroll/tax/banking/medical).
 * Employee/admin phase-level filtering happens via task visibility.
 */
export function visiblePhases(
  phases: OnboardingPhase[],
  role: UserRole,
): OnboardingPhase[] {
  if (role === 'manager') return phases.filter((p) => p.id !== 'hr')
  return phases
}

/**
 * Tasks visible to a role (HANDOFF §2; RLS enforces the manager rows — this is
 * the same rule applied client-side for display):
 * - admin: everything
 * - manager: work tasks only — never the `hr` phase or `manager_hidden` tasks
 * - employee: own view — `employee` + `both` visibility (not `admin`-only)
 */
export function visibleTasks(
  tasks: OnboardingTask[],
  role: UserRole,
): OnboardingTask[] {
  if (role === 'admin') return tasks
  if (role === 'manager') {
    return tasks.filter((t) => t.phase_id !== 'hr' && !t.manager_hidden)
  }
  return tasks.filter((t) => t.visibility !== 'admin')
}

/** The PATCH body for one resolved GOV §3.6 edge (P-OTS-EDGE). */
export interface StatusPatch {
  status: TaskStatus
  started_at?: string | null
  completed_at?: string | null
  completed_by?: string | null
}

/**
 * Build the column payload for a `(current -> next)` task-status write, per the
 * GOV §3.6 pair table. Returns null for the 3 illegal self-loop pairs (the DB
 * GATE-OTS-ORDER trigger would reject them; the UI must not attempt them).
 *
 * Edges (entry/exit actions per GOV §3.6):
 * - pending    -> inprogress (start):    started_at := now
 * - pending    -> done (direct-tick):    completed_at := now, completed_by := actor
 * - inprogress -> done (complete):       completed_at := now, completed_by := actor
 * - done       -> inprogress (reopen):   clear completed_at/completed_by
 * - inprogress -> pending (reset):       clear started_at/completed_at/completed_by
 * - done       -> pending (reset):       clear started_at/completed_at/completed_by
 */
export function buildStatusPatch(
  current: TaskStatus,
  next: TaskStatus,
  actorId: string,
  nowIso: string,
): StatusPatch | null {
  if (current === next) return null // illegal self-loop (REJ-OTS-ORDER)
  if (next === 'inprogress') {
    if (current === 'pending') return { status: 'inprogress', started_at: nowIso }
    // done -> inprogress (reopen)
    return { status: 'inprogress', completed_at: null, completed_by: null }
  }
  if (next === 'done') {
    return { status: 'done', completed_at: nowIso, completed_by: actorId }
  }
  // next === 'pending' (reset from inprogress or done)
  return {
    status: 'pending',
    started_at: null,
    completed_at: null,
    completed_by: null,
  }
}

export interface WorkflowProgress {
  done: number
  total: number
  pct: number
}

/** Progress = done/total over the tasks visible on the board. */
export function progressOf(
  tasks: OnboardingTask[],
  statusOf: (taskId: string) => TaskStatus,
): WorkflowProgress {
  const total = tasks.length
  const done = tasks.filter((t) => statusOf(t.id) === 'done').length
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

// Seed `default_owner` tokens -> employee emails, so a task with no live
// `assigned_to` still shows its templated owner. Mirrors the mock seam mapping;
// drops once default_owner becomes an employee-id column.
const DEFAULT_OWNER_TOKEN_TO_EMAIL: Record<string, string> = {
  ryan: 'ryan@jera.co.za',
  siko: 'sikod@jera.co.za',
  raymond: 'raymond@jera.co.za',
  joann: 'joann@jera.co.za',
  hr: 'ben@jera.co.za',
}

/**
 * Resolve the display owner for a task row: an explicit `assigned_to` wins,
 * else the task's seeded `default_owner` token resolved by email. Returns
 * undefined when the task has no owner (employee self-service tasks).
 */
export function resolveOwner(
  assignedTo: string | null | undefined,
  defaultOwnerToken: string | null | undefined,
  employees: Employee[],
): Employee | undefined {
  if (assignedTo) return employees.find((e) => e.id === assignedTo)
  if (!defaultOwnerToken) return undefined
  const email = DEFAULT_OWNER_TOKEN_TO_EMAIL[defaultOwnerToken]
  if (!email) return undefined
  return employees.find((e) => e.email === email)
}
