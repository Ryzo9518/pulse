// ── Mock accessor layer ──────────────────────────────────────────────────────
// This is the single seam the future backend phase swaps. Screens import ONLY
// from this module — never from the per-entity seed files directly — so the
// backend phase replaces accessor bodies with Supabase queries and the screens
// stay unchanged (plan requirement R6).
//
// All in-session mutation is centralized here so behaviour is predictable.
// State is module-level and in-memory; it resets on a full page reload.

import type {
  Employee,
  UserRole,
  OnboardingPhase,
  OnboardingTask,
  OnboardingTaskStatus,
  TaskStatus,
  HrPolicy,
  HrPolicyAcknowledgement,
  Sop,
  SopKey,
  SopStep,
  ExpenseClaim,
  ExpenseTravelLine,
  ExpenseOtherLine,
  Message,
  AdminNotification,
  Document,
  AdminOnboardingSummary,
} from '@/types/database'
import { TOTAL_POLICIES, TOTAL_SOPS, TOTAL_FORMS } from '@/lib/constants'

import {
  employees as seedEmployees,
  CURRENT_EMPLOYEE_ID,
  ONBOARDING_EMPLOYEE_ID,
} from './employees'
import {
  onboardingPhases,
  onboardingTasks,
  onboardingWorkflow,
  onboardingTaskStatuses as seedTaskStatuses,
} from './onboarding'
import {
  hrPolicies,
  hrPolicyAcknowledgements as seedAcks,
} from './policies'
import { sops, sopSteps } from './sops'
import {
  expenseClaims,
  expenseTravelLines,
  expenseOtherLines,
} from './expenses'
import { messages as seedMessages, adminNotifications } from './comms'
import { documents } from './documents'

// ── Module-level mutable state (cloned from seeds so seeds stay pristine) ──
const employeeState: Employee[] = seedEmployees.map((e) => ({ ...e }))
const ackState: HrPolicyAcknowledgement[] = seedAcks.map((a) => ({ ...a }))
const taskStatusState: OnboardingTaskStatus[] = seedTaskStatuses.map((s) => ({
  ...s,
}))
const messageState: Message[] = seedMessages.map((m) => ({ ...m }))

// ── Reads ────────────────────────────────────────────────────────────────────

/** The default "logged-in" mock user (the seeded onboarding employee). */
export function getCurrentEmployee(): Employee {
  const current = employeeState.find((e) => e.id === CURRENT_EMPLOYEE_ID)
  if (!current) throw new Error('Mock current employee not found')
  return current
}

export function listEmployees(): Employee[] {
  return employeeState
}

export function getEmployee(id: string): Employee | undefined {
  return employeeState.find((e) => e.id === id)
}

export function listPhases(): OnboardingPhase[] {
  return onboardingPhases
}

/**
 * List onboarding tasks visible to the given role.
 * - 'employee' sees 'employee' + 'both' (NOT 'admin'-only tasks).
 * - 'admin' sees everything.
 */
export function listTasks(role: UserRole): OnboardingTask[] {
  if (role === 'admin') return onboardingTasks
  return onboardingTasks.filter((t) => t.visibility !== 'admin')
}

export function listTaskStatuses(): OnboardingTaskStatus[] {
  return taskStatusState
}

export function getTaskStatus(taskId: string): OnboardingTaskStatus | undefined {
  return taskStatusState.find((s) => s.task_id === taskId)
}

export function listPolicies(): HrPolicy[] {
  return hrPolicies
}

export function listPolicyAcknowledgements(): HrPolicyAcknowledgement[] {
  return ackState
}

/** Acknowledgement state for the current employee: acks + a done/total count. */
export function getPolicyAckState(): {
  acknowledgements: HrPolicyAcknowledgement[]
  acknowledgedCount: number
  total: number
  allAcknowledged: boolean
} {
  const acknowledgedCount = ackState.filter((a) => a.acknowledged).length
  return {
    acknowledgements: ackState,
    acknowledgedCount,
    total: TOTAL_POLICIES,
    allAcknowledged: acknowledgedCount >= TOTAL_POLICIES,
  }
}

export function listSops(): Sop[] {
  return sops
}

export function listSopSteps(key: SopKey): SopStep[] {
  return sopSteps
    .filter((s) => s.sop_key === key)
    .sort((a, b) => a.step_number - b.step_number)
}

export function listExpenseClaims(): ExpenseClaim[] {
  return expenseClaims
}

export function listExpenseTravelLines(claimId: string): ExpenseTravelLine[] {
  return expenseTravelLines.filter((l) => l.claim_id === claimId)
}

export function listExpenseOtherLines(claimId: string): ExpenseOtherLine[] {
  return expenseOtherLines.filter((l) => l.claim_id === claimId)
}

/** List messages, optionally filtered by channel (e.g. 'announcements', 'general'). */
export function listMessages(channel?: string): Message[] {
  if (!channel) return messageState
  return messageState.filter((m) => m.channel === channel)
}

export function listAdminNotifications(): AdminNotification[] {
  return adminNotifications
}

export function listDocuments(): Document[] {
  return documents.filter((d) => d.is_active)
}

/** Admin onboarding summary rows (one per onboarding/active employee). */
export function getOnboardingSummary(): AdminOnboardingSummary[] {
  return employeeState
    .filter((e) => e.status === 'onboarding')
    .map((e) => {
      const isCurrent = e.id === ONBOARDING_EMPLOYEE_ID
      const policiesDone = isCurrent
        ? ackState.filter((a) => a.acknowledged).length
        : e.policies_completed
          ? TOTAL_POLICIES
          : 0
      const claims = expenseClaims.filter((c) => c.employee_id === e.id)
      return {
        id: e.id,
        display_name: e.display_name,
        email: e.email,
        status: e.status,
        start_date: e.start_date,
        department: e.department,
        job_title: e.job_title,
        forms_done: 0,
        forms_total: TOTAL_FORMS,
        sops_done: 0,
        sops_total: TOTAL_SOPS,
        policies_done: policiesDone,
        policies_total: TOTAL_POLICIES,
        policies_completed: e.policies_completed,
        expense_claims_total: claims.length,
        expense_claims_pending: claims.filter((c) => c.status === 'submitted')
          .length,
      }
    })
}

// ── Mutators (centralized in-session state changes) ───────────────────────────

/**
 * Acknowledge a policy for the current employee. IDEMPOTENT: acking an
 * already-acknowledged policy does not change the count. Sets acknowledged_at
 * (and read_started_at if not already set). When all 20 policies are
 * acknowledged, flips the current employee's policies_completed to true.
 */
export function acknowledgePolicy(policyId: string): HrPolicyAcknowledgement {
  const ack = ackState.find((a) => a.policy_id === policyId)
  if (!ack) {
    throw new Error(`Unknown policy id: ${policyId}`)
  }
  if (!ack.acknowledged) {
    const now = new Date().toISOString()
    ack.acknowledged = true
    ack.acknowledged_at = now
    if (!ack.read_started_at) ack.read_started_at = now
  }

  const allAcked =
    ackState.filter((a) => a.acknowledged).length >= TOTAL_POLICIES
  if (allAcked) {
    const current = getCurrentEmployee()
    current.policies_completed = true
    current.updated_at = new Date().toISOString()
  }

  return ack
}

/** Record that the user has started reading a policy (sets read_started_at). */
export function startReadingPolicy(policyId: string): void {
  const ack = ackState.find((a) => a.policy_id === policyId)
  if (ack && !ack.read_started_at) {
    ack.read_started_at = new Date().toISOString()
  }
}

/** Update the status of an onboarding task in the current workflow. */
export function setTaskStatus(
  taskId: string,
  status: TaskStatus
): OnboardingTaskStatus {
  let entry = taskStatusState.find((s) => s.task_id === taskId)
  const now = new Date().toISOString()

  if (!entry) {
    entry = {
      id: `ots-${taskId}`,
      workflow_id: onboardingWorkflow.id,
      task_id: taskId,
      assigned_to: null,
      status: 'pending',
      started_at: null,
      completed_at: null,
      completed_by: null,
    }
    taskStatusState.push(entry)
  }

  entry.status = status
  if (status === 'inprogress' && !entry.started_at) entry.started_at = now
  if (status === 'done') {
    if (!entry.started_at) entry.started_at = now
    entry.completed_at = now
    entry.completed_by = getCurrentEmployee().id
  } else {
    entry.completed_at = null
    entry.completed_by = null
  }

  return entry
}

/** Append a chat/announcement message to a channel. */
export function postMessage(
  channel: string,
  body: string,
  messageType: Message['message_type'] = 'chat',
  authorId: string = getCurrentEmployee().id
): Message {
  const message: Message = {
    id: `msg-${messageState.length + 1}`,
    channel,
    message_type: messageType,
    author_id: authorId,
    body,
    created_at: new Date().toISOString(),
  }
  messageState.push(message)
  return message
}

// ── Test-only helper: restore all mutable state to the original seeds. ─────────
// Not used by screens; lets unit tests run in isolation.
export function __resetMockState(): void {
  employeeState.splice(
    0,
    employeeState.length,
    ...seedEmployees.map((e) => ({ ...e }))
  )
  ackState.splice(0, ackState.length, ...seedAcks.map((a) => ({ ...a })))
  taskStatusState.splice(
    0,
    taskStatusState.length,
    ...seedTaskStatuses.map((s) => ({ ...s }))
  )
  messageState.splice(
    0,
    messageState.length,
    ...seedMessages.map((m) => ({ ...m }))
  )
}

export { CURRENT_EMPLOYEE_ID, ONBOARDING_EMPLOYEE_ID }
