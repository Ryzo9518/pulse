'use server'

// WS-2: onboarding task-status writes. Server actions run with the signed-in
// user's minted PostgREST token, so RLS + the DB triggers are the boundary:
// - ots_write (admin) / ots_manager_upd (manager, team work-phase rows only)
// - ots_manager_freeze: managers may write only status/started_at/completed_at/
//   completed_by (assigned_to/workflow_id/task_id frozen — GATE-OTS-FREEZE)
// - ots_order: rejects same-status self-loop writes (GATE-OTS-ORDER)
// Employees have no write branch (contract C7-emp): their PATCH matches zero
// rows (REJ-RLS) and we report it as denied without claiming success.
import { auth } from '@/auth'
import { buildStatusPatch } from '@/lib/data/workflow-live'
import type { TaskStatus } from '@/types/database'

export interface WorkflowWriteResult {
  ok: boolean
  /** True when the write was silently excluded by RLS (zero rows) — REJ-RLS. */
  denied?: boolean
  /** Human-readable failure (trigger raise text when the DB provides one). */
  error?: string
}

// MSG-ERR-GENERIC (outcome contract §1.7)
const GENERIC_ERROR =
  'Something went wrong — your changes were not saved. Try again.'

interface Ctx {
  base: string
  token: string
  employeeId: string
  role: string
}

async function ctx(): Promise<Ctx | { error: string }> {
  const session = await auth()
  if (!session?.employee || !session?.pulseToken) {
    return { error: 'Not signed in' }
  }
  const base = process.env.PULSE_POSTGREST_URL
  if (!base) return { error: 'Data API not configured' }
  return {
    base,
    token: session.pulseToken,
    employeeId: session.employee.id,
    role: session.employee.role,
  }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    // return=representation so a zero-row RLS exclusion is detectable (a 204
    // from return=minimal would read as false success).
    Prefer: 'return=representation',
  }
}

/** Extract the PostgREST error message (e.g. a trigger's raise text). */
async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string }
    if (body && typeof body.message === 'string' && body.message) {
      return body.message
    }
  } catch {
    // fall through to the generic message
  }
  return GENERIC_ERROR
}

/**
 * PATCH one onboarding_task_status row to `next` along the single resolved
 * GOV §3.6 edge. `current` is re-read server-side (RLS-scoped) — the client's
 * view is not trusted for the edge computation.
 */
export async function updateTaskStatus(
  rowId: string,
  next: TaskStatus,
): Promise<WorkflowWriteResult> {
  const c = await ctx()
  if ('error' in c) return { ok: false, error: c.error }

  try {
    // Re-read the row as the user (RLS-scoped) to resolve the (old,new) pair.
    const readRes = await fetch(
      `${c.base}/onboarding_task_status?id=eq.${encodeURIComponent(rowId)}&select=id,status`,
      { headers: { Authorization: `Bearer ${c.token}` }, cache: 'no-store' },
    )
    if (!readRes.ok) return { ok: false, error: GENERIC_ERROR }
    const rows = (await readRes.json()) as Array<{ id: string; status: TaskStatus }>
    if (rows.length === 0) return { ok: false, denied: true }

    const patch = buildStatusPatch(rows[0].status, next, c.employeeId, new Date().toISOString())
    if (!patch) {
      // Self-loop: already in that state (GATE-OTS-ORDER would reject). No-op.
      return { ok: true }
    }

    const res = await fetch(
      `${c.base}/onboarding_task_status?id=eq.${encodeURIComponent(rowId)}`,
      {
        method: 'PATCH',
        headers: headers(c.token),
        cache: 'no-store',
        body: JSON.stringify(patch),
      },
    )
    if (!res.ok) return { ok: false, error: await readError(res) }
    const updated = (await res.json()) as unknown[]
    if (updated.length === 0) return { ok: false, denied: true } // REJ-RLS
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the data service' }
  }
}

/**
 * Assign (or clear) a task owner — admin-only (DAT-ONB-ASSIGN; managers are
 * frozen out by GATE-OTS-FREEZE, employees by RLS).
 */
export async function assignTaskOwner(
  rowId: string,
  ownerId: string | null,
): Promise<WorkflowWriteResult> {
  const c = await ctx()
  if ('error' in c) return { ok: false, error: c.error }
  if (c.role !== 'admin') {
    return { ok: false, error: 'Only an admin can assign task owners' }
  }

  try {
    const res = await fetch(
      `${c.base}/onboarding_task_status?id=eq.${encodeURIComponent(rowId)}`,
      {
        method: 'PATCH',
        headers: headers(c.token),
        cache: 'no-store',
        body: JSON.stringify({ assigned_to: ownerId }),
      },
    )
    if (!res.ok) return { ok: false, error: await readError(res) }
    const updated = (await res.json()) as unknown[]
    if (updated.length === 0) return { ok: false, denied: true }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the data service' }
  }
}
