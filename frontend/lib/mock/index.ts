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
  IltSession,
  TrainingEnrolment,
  BillableMilestone,
  BillableSummaryRow,
  MilestoneKey,
  Certification,
  CertificationEvent,
  CertEventType,
} from '@/types/database'
import { computeCertStatus } from '@/lib/certifications/status'
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
import {
  iltSessions,
  trainingEnrolments as seedEnrolments,
  computeMilestones,
  nextMilestone,
  findSession,
  formatSessionLabel,
} from './training'
import {
  certifications as seedCertifications,
  certificationEvents as seedCertEvents,
} from './certifications'

// ── Module-level mutable state (cloned from seeds so seeds stay pristine) ──
const employeeState: Employee[] = seedEmployees.map((e) => ({ ...e }))
const ackState: HrPolicyAcknowledgement[] = seedAcks.map((a) => ({ ...a }))
const taskStatusState: OnboardingTaskStatus[] = seedTaskStatuses.map((s) => ({
  ...s,
}))
const messageState: Message[] = seedMessages.map((m) => ({ ...m }))
const enrolmentState: TrainingEnrolment[] = seedEnrolments.map((e) => ({ ...e }))
const certificationState: Certification[] = seedCertifications.map((c) => ({ ...c }))
const certEventState: CertificationEvent[] = seedCertEvents.map((e) => ({ ...e }))

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

// ── Certification registry ────────────────────────────────────────────────────

/**
 * Return a copy of a cert with its status freshly computed from its dates and
 * verification state, so the displayed status never drifts from reality
 * (requirements R4, R23). A cert is "verified" once it has a verified_at stamp.
 */
function withFreshStatus(cert: Certification): Certification {
  const status = computeCertStatus(
    {
      verified: cert.verified_at != null,
      non_expiring: cert.non_expiring,
      issued_date: cert.issued_date,
      expiry_date: cert.expiry_date,
      renew_by_date: cert.renew_by_date,
    },
    new Date(),
  )
  return { ...cert, status }
}

/** A consultant's own credentials (requirement R18: own-certs-only). */
export function getCertificationsForEmployee(employeeId: string): Certification[] {
  return certificationState
    .filter((c) => c.employee_id === employeeId)
    .map(withFreshStatus)
}

/** Admin firm-wide view: every consultant's credentials (R14/R18 admin-only). */
export function listAllCertifications(): Certification[] {
  return certificationState.map(withFreshStatus)
}

export function getCertification(id: string): Certification | undefined {
  const cert = certificationState.find((c) => c.id === id)
  return cert ? withFreshStatus(cert) : undefined
}

/** The admin verification queue: uploads still pending a date check (R5). */
export function listPendingCertifications(): Certification[] {
  return certificationState
    .filter((c) => c.verified_at == null)
    .map(withFreshStatus)
}

/** Append-only audit-log entries for a credential (R3). */
export function listCertificationEvents(certificationId: string): CertificationEvent[] {
  return certEventState.filter((e) => e.certification_id === certificationId)
}

function appendCertEvent(
  certificationId: string,
  eventType: CertEventType,
  actorId: string | null,
  detail: Record<string, unknown> | null = null,
): void {
  certEventState.push({
    id: `cert-evt-${certEventState.length + 1}`,
    certification_id: certificationId,
    event_type: eventType,
    actor_id: actorId,
    detail,
    created_at: new Date().toISOString(),
  })
}

/** Fields a consultant supplies when uploading a credential (status is derived). */
export interface CertificationUploadInput {
  employee_id: string
  family: Certification['family']
  lifecycle_kind?: Certification['lifecycle_kind']
  name: string
  issuing_body?: string | null
  issued_date?: string | null
  expiry_date?: string | null
  renew_by_date?: string | null
  non_expiring?: boolean
  proof_path?: string | null
}

/**
 * Upload a credential. Lands in `pending verification` until an admin confirms
 * the dates (requirement R5). Independent of training — a consultant who already
 * holds a cert uploads it directly. Emits a `created` audit event.
 */
export function addCertificationUpload(input: CertificationUploadInput): Certification {
  const now = new Date().toISOString()
  const cert: Certification = {
    id: `cert-${certificationState.length + 1}`,
    employee_id: input.employee_id,
    family: input.family,
    lifecycle_kind: input.lifecycle_kind ?? 'renewable',
    name: input.name,
    issuing_body: input.issuing_body ?? null,
    issued_date: input.issued_date ?? null,
    expiry_date: input.expiry_date ?? null,
    renew_by_date: input.renew_by_date ?? null,
    non_expiring: input.non_expiring ?? false,
    status: 'pending_verification',
    proof_path: input.proof_path ?? null,
    reminders_baseline_at: now,
    verified_by: null,
    verified_at: null,
    created_at: now,
    updated_at: now,
  }
  certificationState.push(cert)
  appendCertEvent(cert.id, 'created', input.employee_id, { source: 'upload' })
  return withFreshStatus(cert)
}

/** Dates an admin confirms (or corrects) when verifying an upload. */
export interface CertVerifyDates {
  issued_date?: string | null
  expiry_date?: string | null
  renew_by_date?: string | null
  non_expiring?: boolean
}

/**
 * Admin verifies an upload after confirming its validity dates (R5). Applies any
 * date corrections, stamps verified_by/at (which flips the computed status off
 * `pending verification`), and writes a `verified` audit event.
 */
export function verifyCertification(
  certificationId: string,
  dates: CertVerifyDates,
  adminId: string,
): Certification {
  const cert = certificationState.find((c) => c.id === certificationId)
  if (!cert) throw new Error(`Unknown certification id: ${certificationId}`)
  const now = new Date().toISOString()
  if (dates.issued_date !== undefined) cert.issued_date = dates.issued_date
  if (dates.expiry_date !== undefined) cert.expiry_date = dates.expiry_date
  if (dates.renew_by_date !== undefined) cert.renew_by_date = dates.renew_by_date
  if (dates.non_expiring !== undefined) cert.non_expiring = dates.non_expiring
  cert.verified_by = adminId
  cert.verified_at = now
  cert.updated_at = now
  appendCertEvent(cert.id, 'verified', adminId, { provenance: 'admin' })
  return withFreshStatus(cert)
}

/**
 * Admin rejects an upload (e.g. wrong/illegible file). Records a `rejected`
 * audit event and removes the pending row so the consultant can re-upload.
 */
export function rejectCertification(
  certificationId: string,
  adminId: string,
  reason: string,
): void {
  const idx = certificationState.findIndex((c) => c.id === certificationId)
  if (idx === -1) throw new Error(`Unknown certification id: ${certificationId}`)
  appendCertEvent(certificationId, 'rejected', adminId, { reason })
  certificationState.splice(idx, 1)
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

  // R11: reaching `certified` in the in-Pulse training path creates a pending
  // registry entry (admin still confirms the dates per R5). Idempotent — does
  // not create a second entry if training-completion already produced one.
  if (key === 'certified' && value === true) {
    createTrainingCertIfAbsent(employeeId)
  }

  return entry
}

/** Create a pending Sage cert from a completed training path, once per employee. */
function createTrainingCertIfAbsent(employeeId: string): void {
  const alreadyCreated = certificationState.some(
    (c) =>
      c.employee_id === employeeId &&
      certEventState.some(
        (e) =>
          e.certification_id === c.id &&
          e.event_type === 'created' &&
          e.detail?.source === 'training-completion',
      ),
  )
  if (alreadyCreated) return

  const now = new Date().toISOString()
  const cert: Certification = {
    id: `cert-${certificationState.length + 1}`,
    employee_id: employeeId,
    family: 'sage',
    lifecycle_kind: 'renewable',
    name: 'Sage Intacct Implementation Specialist',
    issuing_body: 'Sage',
    issued_date: now.slice(0, 10),
    expiry_date: null,
    renew_by_date: null,
    non_expiring: false,
    status: 'pending_verification',
    proof_path: null,
    reminders_baseline_at: now,
    verified_by: null,
    verified_at: null,
    created_at: now,
    updated_at: now,
  }
  certificationState.push(cert)
  appendCertEvent(cert.id, 'created', employeeId, { source: 'training-completion' })
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
  certificationState.splice(
    0,
    certificationState.length,
    ...seedCertifications.map((c) => ({ ...c }))
  )
  certEventState.splice(
    0,
    certEventState.length,
    ...seedCertEvents.map((e) => ({ ...e }))
  )
}

// Presentation-only formatters (no data access) re-exported through the seam so
// screens still import everything from '@/lib/mock'.
export { formatDate, formatDateRange, formatSessionLabel } from './training'

export { CURRENT_EMPLOYEE_ID, ONBOARDING_EMPLOYEE_ID }
