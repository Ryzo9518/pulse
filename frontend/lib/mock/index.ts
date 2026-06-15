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
  ExpenseAdvanceLine,
  AaRateCertificate,
  Message,
  AdminNotification,
  Document,
  AdminOnboardingSummary,
  IltSession,
  TrainingEnrolment,
  BillableMilestone,
  BillableSummaryRow,
  MilestoneKey,
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
  expenseAdvanceLines,
  aaRateCertificates,
} from './expenses'
import { messages as seedMessages, adminNotifications } from './comms'
import { documents } from './documents'
import {
  iltSessions,
  trainingEnrolments as seedEnrolments,
  computeMilestones,
  nextMilestone,
  findSession,
  formatSessionLabel,
} from './training'

// ── Module-level mutable state (cloned from seeds so seeds stay pristine) ──
const employeeState: Employee[] = seedEmployees.map((e) => ({ ...e }))
const ackState: HrPolicyAcknowledgement[] = seedAcks.map((a) => ({ ...a }))
const taskStatusState: OnboardingTaskStatus[] = seedTaskStatuses.map((s) => ({
  ...s,
}))
const messageState: Message[] = seedMessages.map((m) => ({ ...m }))
const enrolmentState: TrainingEnrolment[] = seedEnrolments.map((e) => ({ ...e }))
const aaCertState: AaRateCertificate[] = aaRateCertificates.map((c) => ({ ...c }))

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

/**
 * Employees who report directly to `managerId` — a manager's team. Used by the
 * manager roster ("My Team"). An empty/unknown id returns [] (never the whole
 * roster), so a missing session can't widen the scope. The backend phase
 * replaces this with an RLS-scoped query.
 */
export function listTeam(managerId: string): Employee[] {
  if (!managerId) return []
  return employeeState.filter((e) => e.manager_id === managerId)
}

// ── Training / certification (Sage Intacct billable-readiness tracker) ────────

/** All bookable Sage U instructor-led sessions. */
export function listIltSessions(): IltSession[] {
  return iltSessions
}

/** The current employee's training enrolment, if any. */
export function getTrainingEnrolment(
  employeeId: string,
): TrainingEnrolment | undefined {
  return enrolmentState.find((e) => e.employee_id === employeeId)
}

/** Projected billable milestones for an employee (supervised → ILT → certified). */
export function getEmployeeMilestones(employeeId: string): BillableMilestone[] {
  const employee = getEmployee(employeeId)
  if (!employee) return []
  return computeMilestones(employee, getTrainingEnrolment(employeeId))
}

/**
 * Which employees the tracker treats as junior consultants: anyone with a
 * training enrolment, plus onboarding/probation staff in the Consulting team
 * (so managers can also spot consultants who have not enrolled yet).
 */
function isJuniorConsultant(e: Employee): boolean {
  if (enrolmentState.some((en) => en.employee_id === e.id)) return true
  return (
    e.department === 'Consulting' &&
    (e.status === 'onboarding' || e.status === 'probation')
  )
}

/** Admin roll-up: every junior consultant's projected billable dates. */
export function getBillableSummary(): BillableSummaryRow[] {
  const rows = employeeState.filter(isJuniorConsultant).map((e) => {
    const enrolment = getTrainingEnrolment(e.id)
    const milestones = computeMilestones(e, enrolment)
    const byKey = (k: MilestoneKey) => milestones.find((m) => m.key === k)?.date ?? null
    const session = findSession(enrolment?.session_id ?? null)
    return {
      employee_id: e.id,
      display_name: e.display_name,
      job_title: e.job_title,
      avatar_initials: e.avatar_initials,
      avatar_color: e.avatar_color,
      session_id: enrolment?.session_id ?? null,
      session_label: session ? formatSessionLabel(session) : null,
      supervised_date: byKey('supervised'),
      ilt_date: byKey('ilt'),
      certified_date: byKey('certified'),
      next_milestone: nextMilestone(milestones),
    }
  })
  // Soonest certified date first; unscheduled (null) sort to the bottom.
  return rows.sort((a, b) => {
    if (a.certified_date && b.certified_date) {
      return a.certified_date.localeCompare(b.certified_date)
    }
    if (a.certified_date) return -1
    if (b.certified_date) return 1
    return a.display_name.localeCompare(b.display_name)
  })
}

/**
 * List onboarding phases visible to the given role.
 * - 'manager' never sees the HR-admin phase (tax/banking/payroll/medical — POPIA
 *   + payroll). 'employee' and 'admin' (and the default no-arg call) see all
 *   phases; phase-level employee/admin filtering happens via task visibility.
 */
export function listPhases(role?: UserRole): OnboardingPhase[] {
  if (role === 'manager') {
    return onboardingPhases.filter((p) => p.id !== 'hr')
  }
  return onboardingPhases
}

/**
 * List onboarding tasks visible to the given role.
 * - 'employee' sees 'employee' + 'both' (NOT 'admin'-only tasks).
 * - 'manager' sees work tasks for oversight, but NEVER the HR-admin phase
 *   (payroll/tax/banking/medical) or `manager_hidden` tasks (the employment
 *   contract / NDA). See HANDOFF §2 — enforce in RLS too, not just the UI.
 * - 'admin' sees everything.
 */
export function listTasks(role: UserRole): OnboardingTask[] {
  if (role === 'admin') return onboardingTasks
  if (role === 'manager') {
    return onboardingTasks.filter(
      (t) => t.phase_id !== 'hr' && !t.manager_hidden,
    )
  }
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

export function listExpenseAdvanceLines(claimId: string): ExpenseAdvanceLine[] {
  return expenseAdvanceLines.filter((l) => l.claim_id === claimId)
}

/**
 * The AA Rate Certificate for an employee, or null when none is on file. Its
 * rates drive that person's travel math (full rate invoiced, fixed non-invoiced).
 */
export function getAaRateCertificate(
  employeeId: string,
): AaRateCertificate | null {
  return aaCertState.find((c) => c.employee_id === employeeId) ?? null
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

/**
 * Set (or change) the ILT session a consultant is booked on. Creates an
 * enrolment if the consultant does not have one yet. Pass null to clear.
 */
export function setTrainingSession(
  employeeId: string,
  sessionId: string | null,
): TrainingEnrolment {
  let entry = enrolmentState.find((e) => e.employee_id === employeeId)
  const now = new Date().toISOString()
  if (!entry) {
    entry = {
      employee_id: employeeId,
      session_id: sessionId,
      cert_path: 'implementation',
      getting_started_done: false,
      ilt_done: false,
      certified: false,
      updated_at: now,
    }
    enrolmentState.push(entry)
  } else {
    entry.session_id = sessionId
    entry.updated_at = now
  }
  return entry
}

/** Toggle one of a consultant's progress milestones. Creates an enrolment if needed. */
export function setTrainingMilestone(
  employeeId: string,
  key: 'getting_started_done' | 'ilt_done' | 'certified',
  value: boolean,
): TrainingEnrolment {
  let entry = enrolmentState.find((e) => e.employee_id === employeeId)
  const now = new Date().toISOString()
  if (!entry) {
    entry = {
      employee_id: employeeId,
      session_id: null,
      cert_path: 'implementation',
      getting_started_done: false,
      ilt_done: false,
      certified: false,
      updated_at: now,
    }
    enrolmentState.push(entry)
  }
  entry[key] = value
  entry.updated_at = now
  return entry
}

/**
 * Save (create or update) an employee's AA Rate Certificate. Mirrors the
 * prototype's saveAaCert: positive numeric rates are kept, blanks fall back to
 * the previous value, and saving marks the certificate as uploaded. The saved
 * rates immediately drive that person's travel reimbursement math.
 */
export function saveAaRateCertificate(
  employeeId: string,
  patch: Partial<
    Pick<
      AaRateCertificate,
      | 'make'
      | 'model'
      | 'year'
      | 'registration'
      | 'full_rate'
      | 'fixed_cost'
      | 'running_cost'
      | 'fuel_price'
      | 'file_name'
      | 'issued_date'
    >
  >,
): AaRateCertificate {
  const now = new Date().toISOString()
  let cert = aaCertState.find((c) => c.employee_id === employeeId)
  if (!cert) {
    cert = {
      id: `aa-${aaCertState.length + 1}`,
      employee_id: employeeId,
      make: '',
      model: '',
      year: '',
      registration: null,
      full_rate: 0,
      fixed_cost: 0,
      running_cost: 0,
      fuel_price: 0,
      file_name: null,
      issued_date: null,
      uploaded: false,
      created_at: now,
      updated_at: now,
    }
    aaCertState.push(cert)
  }
  Object.assign(cert, patch)
  cert.uploaded = true
  cert.updated_at = now
  return cert
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
  enrolmentState.splice(
    0,
    enrolmentState.length,
    ...seedEnrolments.map((e) => ({ ...e }))
  )
  aaCertState.splice(
    0,
    aaCertState.length,
    ...aaRateCertificates.map((c) => ({ ...c }))
  )
}

// Presentation-only formatters (no data access) re-exported through the seam so
// screens still import everything from '@/lib/mock'.
export { formatDate, formatDateRange, formatSessionLabel } from './training'

export { CURRENT_EMPLOYEE_ID, ONBOARDING_EMPLOYEE_ID }
