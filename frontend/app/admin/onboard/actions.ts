'use server'

// Server action for WS-1: onboard a new hire. Creates the employee record (so
// they can sign in with Microsoft — sign-in resolves by email and relinks at
// first login), an onboarding workflow, and a task-status row per template task.
// Runs server-side with the signed-in admin's token; RLS enforces admin-only
// (employees insert requires pulse_is_admin()).
import { auth } from '@/auth'

export interface OnboardInput {
  name: string
  email: string
  jobTitle: string
  department: string
  startDate: string
}

export interface OnboardResult {
  ok: boolean
  email?: string
  taskCount?: number
  error?: string
}

export async function createOnboardingHire(
  input: OnboardInput,
): Promise<OnboardResult> {
  const session = await auth()
  const me = session?.employee
  if (!me || !session?.pulseToken) return { ok: false, error: 'Not signed in' }
  if (me.role !== 'admin') {
    return { ok: false, error: 'Only an admin can onboard a new employee' }
  }

  const base = process.env.PULSE_POSTGREST_URL
  if (!base) return { ok: false, error: 'Data API not configured' }
  const headers = {
    Authorization: `Bearer ${session.pulseToken}`,
    'Content-Type': 'application/json',
  }

  const name = input.name.trim()
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0] ?? name
  const last = parts.slice(1).join(' ') || first
  const initials = (
    (first[0] ?? '') + (parts[1]?.[0] ?? last[0] ?? '')
  ).toUpperCase()
  const email = input.email.trim().toLowerCase()
  if (!email) return { ok: false, error: 'A work email is required' }

  // 1) Employee record (status=onboarding; auth_user_id null → relinked at login).
  const empRes = await fetch(`${base}/employees`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    cache: 'no-store',
    body: JSON.stringify({
      email,
      first_name: first,
      last_name: last,
      display_name: name,
      avatar_initials: initials,
      role: 'employee',
      status: 'onboarding',
      job_title: input.jobTitle.trim() || null,
      department: input.department || null,
      start_date: input.startDate || null,
    }),
  })
  if (!empRes.ok) {
    const detail = empRes.status === 409 ? ' (that email already exists)' : ''
    return { ok: false, error: `Could not create the employee${detail}` }
  }
  const employee = (await empRes.json())[0] as { id: string }

  // 2) Onboarding workflow for the new hire.
  const wfRes = await fetch(`${base}/onboarding_workflows`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    cache: 'no-store',
    body: JSON.stringify({ employee_id: employee.id, created_by: me.id }),
  })
  if (!wfRes.ok) {
    return {
      ok: false,
      error: 'Employee created, but the onboarding workflow failed — contact IT',
    }
  }
  const workflow = (await wfRes.json())[0] as { id: string }

  // 3) A task-status row per template task (status=pending).
  const tasksRes = await fetch(`${base}/onboarding_tasks?select=id`, {
    headers,
    cache: 'no-store',
  })
  if (!tasksRes.ok) return { ok: false, error: 'Could not read the task template' }
  const tasks = (await tasksRes.json()) as Array<{ id: string }>
  const statusRows = tasks.map((t) => ({
    workflow_id: workflow.id,
    task_id: t.id,
    status: 'pending',
  }))
  const stRes = await fetch(`${base}/onboarding_task_status`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    cache: 'no-store',
    body: JSON.stringify(statusRows),
  })
  if (!stRes.ok) {
    return { ok: false, error: 'Workflow created, but seeding tasks failed' }
  }

  return { ok: true, email, taskCount: tasks.length }
}
