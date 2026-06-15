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
  AddDocumentsInput,
  UpdateDocumentInput,
  AdminOnboardingSummary,
  IltSession,
  TrainingEnrolment,
  TrainingPath,
  BillableMilestone,
  BillableSummaryRow,
  PathProgress,
  Product,
  ProductId,
  MilestoneKey,
  Certification,
  CertClass,
  CertVendor,
} from '@/types/database'
import { TOTAL_SOPS, TOTAL_FORMS } from '@/lib/constants'

import {
  employees as seedEmployees,
  CURRENT_EMPLOYEE_ID,
  ONBOARDING_EMPLOYEE_ID,
  ADMIN_EMPLOYEE_ID,
} from './employees'
import {
  onboardingPhases,
  onboardingTasks,
  onboardingWorkflow,
  onboardingTaskStatuses as seedTaskStatuses,
  onboardingGenerationPlan,
  onboardingGenerationTaskTotal,
} from './onboarding'
import type { OnboardingGenerationPhase } from './onboarding'
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
import { documents as seedDocuments } from './documents'
import {
  iltSessions,
  trainingEnrolments as seedEnrolments,
  computeMilestones,
  computeOverallProgress,
  computePathProgress,
  nextMilestone,
  billableStage,
  pathsFor,
  productById,
  PRODUCTS,
} from './training'
import { certifications as seedCerts } from './certifications'

// ── Module-level mutable state (cloned from seeds so seeds stay pristine) ──
const employeeState: Employee[] = seedEmployees.map((e) => ({ ...e }))
// Policies are mutable in this phase: an admin can edit a policy body, add a new
// policy, and publish a new version. Cloned from the seed so the seed stays pristine.
const policyState: HrPolicy[] = hrPolicies.map((p) => ({ ...p }))
const ackState: HrPolicyAcknowledgement[] = seedAcks.map((a) => ({ ...a }))
const taskStatusState: OnboardingTaskStatus[] = seedTaskStatuses.map((s) => ({
  ...s,
}))
const messageState: Message[] = seedMessages.map((m) => ({ ...m }))
const enrolmentState: TrainingEnrolment[] = seedEnrolments.map((e) => ({
  ...e,
  modules_done: { ...e.modules_done },
}))
const documentState: Document[] = seedDocuments.map((d) => ({ ...d }))
const aaCertState: AaRateCertificate[] = aaRateCertificates.map((c) => ({ ...c }))
const certState: Certification[] = seedCerts.map((c) => ({ ...c }))
// Per-task owner OVERRIDES set by an admin in this session (task_id -> employee
// id, or null for explicitly unassigned). A task with no entry here falls back
// to its seeded default_owner token. Mirrors the prototype's `taskOwner` map.
const taskOwnerState = new Map<string, string | null>()

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

// ── Training (multi-product Sage U learning paths + billable readiness) ────────

/** The Sage product catalogue (powers the product selector + cert names). */
export function listProducts(): Product[] {
  return PRODUCTS
}

/** A single product by id (falls back to the first product if unknown). */
export function getProduct(id: ProductId): Product {
  return productById(id)
}

/** The learning paths for a product (curated where available, else generic). */
export function getProductPaths(product: ProductId): TrainingPath[] {
  return pathsFor(product)
}

/** All bookable Sage U instructor-led sessions (reference data). */
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

/** Per-path progress for an employee against the product they are training on. */
export function getEmployeePathProgress(employeeId: string): PathProgress[] {
  const enrolment = getTrainingEnrolment(employeeId)
  const product = enrolment?.product_id ?? 'intacct'
  const modulesDone = enrolment?.modules_done ?? {}
  return pathsFor(product).map((p) => computePathProgress(product, p, modulesDone))
}

/** Overall modules done / total for an employee across every path. */
export function getEmployeeOverallProgress(employeeId: string): {
  done: number
  total: number
  percent: number
} {
  const enrolment = getTrainingEnrolment(employeeId)
  const product = enrolment?.product_id ?? 'intacct'
  return computeOverallProgress(product, enrolment?.modules_done ?? {})
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

/** Admin roll-up: every junior consultant's product + projected billable dates. */
export function getBillableSummary(): BillableSummaryRow[] {
  const rows = employeeState.filter(isJuniorConsultant).map((e) => {
    const enrolment = getTrainingEnrolment(e.id)
    const product = productById(enrolment?.product_id ?? 'intacct')
    const milestones = computeMilestones(e, enrolment)
    const stage = billableStage({
      getting_started_done: Boolean(enrolment?.getting_started_done),
      ilt_done: Boolean(enrolment?.ilt_done),
      certified: Boolean(enrolment?.certified),
    })
    return {
      employee_id: e.id,
      display_name: e.display_name,
      job_title: e.job_title,
      avatar_initials: e.avatar_initials,
      avatar_color: e.avatar_color,
      product_id: product.id,
      product_name: product.name,
      ilt_date_entered: enrolment?.ilt_date ?? null,
      supervised_date: milestones.find((m) => m.key === 'supervised')?.date ?? null,
      ilt_date: milestones.find((m) => m.key === 'ilt')?.date ?? null,
      certified_date: milestones.find((m) => m.key === 'certified')?.date ?? null,
      stage,
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

// ── Certifications ────────────────────────────────────────────────────────────

/**
 * Certificates visible to the given viewer, by role (HANDOFF §2/§3):
 * - 'employee' → only their own certs.
 * - 'manager' → their team's certs (direct reports, via manager_id). A missing
 *   managerId returns [] so a missing session can't widen the scope.
 * - 'admin' → all certs.
 * The backend phase replaces this with an RLS-scoped query.
 */
export function listCertifications(
  role: UserRole,
  employeeId: string,
  managerId?: string,
): Certification[] {
  if (role === 'admin') return certState
  if (role === 'manager') {
    if (!managerId) return []
    const teamIds = new Set(listTeam(managerId).map((e) => e.id))
    return certState.filter((c) => teamIds.has(c.employee_id))
  }
  if (!employeeId) return []
  return certState.filter((c) => c.employee_id === employeeId)
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

/**
 * The per-phase onboarding generation plan for a NEW starter — what the workflow
 * generator WILL create. Drives the "Schedule Onboarding" preview panel (per-phase
 * chips with counts). This is the standard template, not any one employee's live
 * workflow, so its total is stable (see getOnboardingGenerationTaskTotal).
 */
export function getOnboardingGenerationPlan(): OnboardingGenerationPhase[] {
  return onboardingGenerationPlan
}

/** Total tasks a new starter's workflow generates across all phases. */
export function getOnboardingGenerationTaskTotal(): number {
  return onboardingGenerationTaskTotal
}

export function getTaskStatus(taskId: string): OnboardingTaskStatus | undefined {
  return taskStatusState.find((s) => s.task_id === taskId)
}

/**
 * Maps a seeded `default_owner` token (e.g. 'siko', 'hr') to a real employee id,
 * so the per-task owner <select> (which lists employees) can pre-select the
 * seeded owner. 'hr' maps to the HR & Compliance employee; an unknown/`null`
 * token resolves to null (unassigned / self-service). The backend phase drops
 * this once `default_owner` is itself an employee id column.
 */
const DEFAULT_OWNER_TOKEN_TO_EMAIL: Record<string, string> = {
  ryan: 'ryan@jera.co.za',
  siko: 'sikod@jera.co.za',
  raymond: 'raymond@jera.co.za',
  joann: 'joann@jera.co.za',
  hr: 'ben@jera.co.za',
}

function resolveDefaultOwnerId(token: string | null): string | null {
  if (!token) return null
  const email = DEFAULT_OWNER_TOKEN_TO_EMAIL[token]
  if (!email) return null
  return employeeState.find((e) => e.email === email)?.id ?? null
}

/**
 * The effective owner employee id for an onboarding task: an in-session admin
 * override if one exists (including an explicit null = unassigned), otherwise the
 * task's seeded default owner resolved to an employee id. Returns null when the
 * task has no owner (e.g. employee self-verification tasks).
 */
export function getTaskOwner(taskId: string): string | null {
  if (taskOwnerState.has(taskId)) return taskOwnerState.get(taskId) ?? null
  const task = onboardingTasks.find((t) => t.id === taskId)
  return resolveDefaultOwnerId(task?.default_owner ?? null)
}

/** Employees an admin can assign as a task owner (the full roster). */
export function listAssignableOwners(): Employee[] {
  return employeeState
}

export function listPolicies(): HrPolicy[] {
  return policyState
}

export function listPolicyAcknowledgements(): HrPolicyAcknowledgement[] {
  return ackState
}

/**
 * The total number of policies that must be acknowledged. DYNAMIC by design —
 * it is the count of seeded/created policies, never a hardcoded constant — so
 * adding a policy raises the bar and the gate can never lift early. The gate,
 * progress bar, and Sidebar badge all consume this (via getPolicyAckState).
 */
export function getTotalPolicies(): number {
  return policyState.length
}

/** Acknowledgement state for the current employee: acks + a done/total count. */
export function getPolicyAckState(): {
  acknowledgements: HrPolicyAcknowledgement[]
  acknowledgedCount: number
  total: number
  allAcknowledged: boolean
} {
  const total = policyState.length
  const acknowledgedCount = ackState.filter((a) => a.acknowledged).length
  return {
    acknowledgements: ackState,
    acknowledgedCount,
    total,
    allAcknowledged: acknowledgedCount >= total,
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
  return documentState.filter((d) => d.is_active)
}

/**
 * The file_type value used for SharePoint-link documents. The Documents screen
 * keys its LINK badge (teal) and "SharePoint" size label off this sentinel, and
 * treats `file_url` as the link target rather than a download.
 */
export const LINK_FILE_TYPE = 'link'

/** Admin onboarding summary rows (one per onboarding/active employee). */
export function getOnboardingSummary(): AdminOnboardingSummary[] {
  return employeeState
    .filter((e) => e.status === 'onboarding')
    .map((e) => {
      const totalPolicies = policyState.length
      const isCurrent = e.id === ONBOARDING_EMPLOYEE_ID
      const policiesDone = isCurrent
        ? ackState.filter((a) => a.acknowledged).length
        : e.policies_completed
          ? totalPolicies
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
        policies_total: totalPolicies,
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
 * (and read_started_at if not already set). When ALL policies are acknowledged
 * (count >= the DYNAMIC total), flips the current employee's policies_completed
 * to true.
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
    ackState.filter((a) => a.acknowledged).length >= policyState.length
  if (allAcked) {
    const current = getCurrentEmployee()
    current.policies_completed = true
    current.updated_at = new Date().toISOString()
  }

  return ack
}

// ── Admin policy authoring (publish / edit / create) ──────────────────────────

/** The next sequential HR0NN policy id/code, based on the highest existing one. */
function nextPolicyCode(): { id: string; code: string; n: number } {
  const nums = policyState
    .map((p) => Number(p.id.replace(/^HR/, '')))
    .filter((n) => Number.isFinite(n))
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  const id = `HR${String(n).padStart(3, '0')}`
  return { id, code: `JERA-POL-${id}`, n }
}

/** Bump a "v1.0"/"v2.0" style version string by a major version. Non-numeric → v1.0. */
function bumpVersion(version: string): string {
  const match = /^v?(\d+)(?:\.(\d+))?/.exec(version ?? '')
  if (!match) return 'v1.0'
  const major = Number(match[1]) + 1
  return `v${major}.0`
}

/**
 * Publish a new version of an existing policy (admin authoring).
 *
 * DECISION D1: publishing a new version resets acknowledgements FOR THAT POLICY
 * ONLY — every other policy's ack is untouched. The changed policy must be
 * re-acknowledged by employees; unrelated policies stay acknowledged.
 *
 * Optionally updates the title/summary/body in the same publish. The version is
 * bumped (or set explicitly via `version`). Because the edited policy's ack is
 * reset, the current employee's policies_completed is recomputed and may flip
 * back to false — closing the compliance gate until the new version is acked.
 *
 * Returns the updated policy.
 */
export function publishPolicyVersion(
  policyId: string,
  updates?: {
    title?: string
    summary?: string | null
    full_text?: string | null
    version?: string
    effective?: string
  },
): HrPolicy {
  const policy = policyState.find((p) => p.id === policyId)
  if (!policy) {
    throw new Error(`Unknown policy id: ${policyId}`)
  }

  if (updates?.title !== undefined) policy.title = updates.title
  if (updates?.summary !== undefined) policy.summary = updates.summary
  if (updates?.full_text !== undefined) policy.full_text = updates.full_text
  if (updates?.effective !== undefined) policy.effective = updates.effective
  policy.version = updates?.version ?? bumpVersion(policy.version)

  // D1: reset ONLY this policy's acknowledgement(s); leave all others intact.
  for (const ack of ackState) {
    if (ack.policy_id === policyId) {
      ack.acknowledged = false
      ack.acknowledged_at = null
      ack.read_started_at = null
    }
  }

  // Recompute the gate: a reset ack can re-close it.
  const allAcked =
    ackState.filter((a) => a.acknowledged).length >= policyState.length
  const current = getCurrentEmployee()
  current.policies_completed = allAcked
  current.updated_at = new Date().toISOString()

  return policy
}

/**
 * Create a brand-new policy (admin "+ New policy"). Auto-assigns the next HR0NN
 * id/code, publishes at v1.0, and seeds an unacknowledged ack for the onboarding
 * employee — which raises the DYNAMIC total and re-closes the gate until acked.
 */
export function createPolicy(input: {
  title: string
  summary?: string | null
  full_text?: string | null
  icon?: string | null
  effective?: string
}): HrPolicy {
  const { id, code, n } = nextPolicyCode()
  const policy: HrPolicy = {
    id,
    code,
    title: input.title,
    icon: input.icon ?? '📄',
    summary: input.summary ?? null,
    full_text: input.full_text ?? null,
    version: 'v1.0',
    effective: input.effective ?? 'April 2026',
    document_url: null,
    sort_order: policyState.length + 1,
    is_active: true,
    created_at: new Date().toISOString(),
  }
  policyState.push(policy)

  // Seed an unacknowledged ack for the onboarding employee so the new policy
  // counts toward the (now larger) total and must be acknowledged.
  ackState.push({
    id: `ack-${String(n).padStart(3, '0')}`,
    employee_id: ONBOARDING_EMPLOYEE_ID,
    policy_id: id,
    acknowledged: false,
    read_started_at: null,
    acknowledged_at: null,
  })

  // Adding an unacked policy can only re-close the gate, never lift it.
  const current = getCurrentEmployee()
  current.policies_completed =
    ackState.filter((a) => a.acknowledged).length >= policyState.length
  current.updated_at = new Date().toISOString()

  return policy
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

/**
 * Assign (or clear) the owner of an onboarding task in this session. Admin-only
 * at the UI layer (gated by can(role,'assignTaskOwners')); production MUST also
 * enforce this in RLS. Pass an employee id to assign, or null to unassign. The
 * override is stored separately from the seed so it survives re-reads and beats
 * the task's seeded default_owner. In production this is also where the Microsoft
 * 365 Graph assignment email fires (HANDOFF §3/§5) — here the screen toasts.
 * Returns the resolved owner id (the value now in effect).
 */
export function setTaskOwner(
  taskId: string,
  ownerId: string | null,
): string | null {
  const normalized = ownerId || null
  if (normalized && !employeeState.some((e) => e.id === normalized)) {
    throw new Error(`Unknown employee id: ${normalized}`)
  }
  taskOwnerState.set(taskId, normalized)
  return normalized
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

/** Find or lazily create a consultant's enrolment (default Intacct, nothing done). */
function ensureEnrolment(employeeId: string): TrainingEnrolment {
  let entry = enrolmentState.find((e) => e.employee_id === employeeId)
  if (!entry) {
    entry = {
      employee_id: employeeId,
      product_id: 'intacct',
      cert_path: 'implementation',
      ilt_date: null,
      getting_started_done: false,
      ilt_done: false,
      certified: false,
      modules_done: {},
      updated_at: new Date().toISOString(),
    }
    enrolmentState.push(entry)
  }
  return entry
}

/**
 * Set the consultant-entered instructor-led training date (SCHEMA
 * training_status.ilt_date). Canonical input that drives the billable ladder.
 * Pass null/empty to clear. Creates an enrolment if needed.
 */
export function setTrainingIltDate(
  employeeId: string,
  iltDate: string | null,
): TrainingEnrolment {
  const entry = ensureEnrolment(employeeId)
  entry.ilt_date = iltDate || null
  entry.updated_at = new Date().toISOString()
  return entry
}

/** Switch the product a consultant is training on. Creates an enrolment if needed. */
export function setTrainingProduct(
  employeeId: string,
  productId: ProductId,
): TrainingEnrolment {
  const entry = ensureEnrolment(employeeId)
  entry.product_id = productId
  entry.updated_at = new Date().toISOString()
  return entry
}

/** Toggle one of a consultant's billable-readiness flags. Creates an enrolment if needed. */
export function setTrainingMilestone(
  employeeId: string,
  key: 'getting_started_done' | 'ilt_done' | 'certified',
  value: boolean,
): TrainingEnrolment {
  const entry = ensureEnrolment(employeeId)
  entry[key] = value
  entry.updated_at = new Date().toISOString()
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

/** Toggle completion of one learning module (by its module key). */
export function setTrainingModule(
  employeeId: string,
  moduleKeyValue: string,
  value: boolean,
): TrainingEnrolment {
  const entry = ensureEnrolment(employeeId)
  entry.modules_done = { ...entry.modules_done, [moduleKeyValue]: value }
  entry.updated_at = new Date().toISOString()
  return entry
}

// ── Documents (admin: add files / SharePoint links, replace versions) ─────────

let docSeq = 0
function nextDocId(): string {
  // Stable, collision-proof ids beyond the seeded doc-0NN range.
  docSeq += 1
  return `doc-new-${Date.now()}-${docSeq}`
}

/**
 * Add one or more documents to the library under a single category. Admin-only
 * at the UI layer (gated by can(role,'uploadDocuments')); production MUST also
 * enforce this in RLS. Two shapes:
 *  - source 'upload': appends one Document per captured file (storage stubbed —
 *    we keep the name, inferred file_type, and a size label only).
 *  - source 'sharepoint': appends a single LINK document whose file_url is the
 *    SharePoint URL and whose file_type is LINK_FILE_TYPE.
 * Returns the newly created documents. Throws on empty/invalid input so the
 * screen can surface a toast.
 */
export function addDocuments(input: AddDocumentsInput): Document[] {
  const now = new Date().toISOString()
  const created: Document[] = []

  if (input.source === 'sharepoint') {
    const url = input.sharepoint_url.trim()
    if (!url) throw new Error('A SharePoint link is required.')
    const doc: Document = {
      id: nextDocId(),
      title: input.link_name?.trim() || 'SharePoint document',
      description: null,
      category: input.category,
      file_type: LINK_FILE_TYPE,
      file_url: url,
      file_size_bytes: null,
      uploaded_by: ADMIN_EMPLOYEE_ID,
      is_active: true,
      created_at: now,
      updated_at: now,
    }
    documentState.push(doc)
    created.push(doc)
    return created
  }

  if (!input.files.length) throw new Error('Add one or more files to upload.')
  for (const file of input.files) {
    const doc: Document = {
      id: nextDocId(),
      title: file.name,
      description: null,
      category: input.category,
      file_type: file.file_type.toLowerCase(),
      file_url: null,
      file_size_bytes: null,
      uploaded_by: ADMIN_EMPLOYEE_ID,
      is_active: true,
      created_at: now,
      updated_at: now,
    }
    documentState.push(doc)
    created.push(doc)
  }
  return created
}

/**
 * Replace an existing document with a new version in place (same id/category).
 * Either swaps in a new uploaded file (file_type + clears link), or converts it
 * to a SharePoint LINK. Bumps updated_at. Throws on invalid input or unknown id.
 */
export function updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
): Document {
  const doc = documentState.find((d) => d.id === documentId)
  if (!doc) throw new Error(`Unknown document id: ${documentId}`)

  if (input.source === 'sharepoint') {
    const url = input.sharepoint_url?.trim()
    if (!url) throw new Error('A SharePoint link is required.')
    doc.file_type = LINK_FILE_TYPE
    doc.file_url = url
    doc.file_size_bytes = null
  } else {
    if (!input.file) throw new Error('Add the replacement file.')
    doc.file_type = input.file.file_type.toLowerCase()
    doc.file_url = null
  }
  doc.updated_at = new Date().toISOString()
  return doc
}

/**
 * Remove a document from the library (soft-delete — sets is_active=false so it
 * drops out of listDocuments but the record is retained for audit). Idempotent;
 * unknown ids are a no-op. Admin-only at the UI layer (gated by
 * can(role,'uploadDocuments')); production MUST also enforce this in RLS.
 */
export function deleteDocument(documentId: string): void {
  const doc = documentState.find((d) => d.id === documentId)
  if (!doc) return
  doc.is_active = false
  doc.updated_at = new Date().toISOString()
}

/** Fields a caller supplies when creating or editing a certificate. */
export interface CertificationInput {
  employee_id: string
  cclass: CertClass
  vendor?: CertVendor | null
  product?: string | null
  name: string
  nqf_level?: string | null
  issued?: string | null
  expiry?: string | null
  file_ref?: string | null
}

/**
 * Create or update a certificate. Pass an existing id to edit; omit (or null) to
 * create. Normalises class-specific fields: product certs keep vendor/product/
 * expiry and drop nqf_level; qualification certs keep nqf_level and drop the
 * product fields. Throws if name or employee_id is missing (validation parity
 * with the editor). Returns the saved record.
 */
export function saveCertification(
  input: CertificationInput,
  id?: string | null,
): Certification {
  const name = input.name.trim()
  if (!name) throw new Error('Certificate name is required')
  if (!input.employee_id) throw new Error('Certificate person is required')

  const isProduct = input.cclass === 'product'
  const fileRef =
    input.file_ref?.trim() ||
    `${name.replace(/[^a-z0-9]+/gi, '_')}.pdf`

  const fields = {
    employee_id: input.employee_id,
    cclass: input.cclass,
    vendor: isProduct ? (input.vendor ?? null) : null,
    product: isProduct ? (input.product ?? null) : null,
    name,
    nqf_level: isProduct ? null : (input.nqf_level ?? null),
    issued: input.issued || null,
    expiry: isProduct ? (input.expiry || null) : null,
    file_ref: fileRef,
  }

  if (id) {
    const existing = certState.find((c) => c.id === id)
    if (!existing) throw new Error(`Unknown certificate id: ${id}`)
    Object.assign(existing, fields)
    return existing
  }

  const created: Certification = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...fields,
    created_at: new Date().toISOString(),
  }
  certState.unshift(created)
  return created
}

/** Remove a certificate by id. Idempotent — unknown ids are a no-op. */
export function deleteCertification(id: string): void {
  const i = certState.findIndex((c) => c.id === id)
  if (i >= 0) certState.splice(i, 1)
}

// ── Test-only helper: restore all mutable state to the original seeds. ─────────
// Not used by screens; lets unit tests run in isolation.
export function __resetMockState(): void {
  employeeState.splice(
    0,
    employeeState.length,
    ...seedEmployees.map((e) => ({ ...e }))
  )
  policyState.splice(0, policyState.length, ...hrPolicies.map((p) => ({ ...p })))
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
    ...seedEnrolments.map((e) => ({ ...e, modules_done: { ...e.modules_done } }))
  )
  documentState.splice(
    0,
    documentState.length,
    ...seedDocuments.map((d) => ({ ...d }))
  )
  docSeq = 0
  aaCertState.splice(
    0,
    aaCertState.length,
    ...aaRateCertificates.map((c) => ({ ...c }))
  )
  certState.splice(0, certState.length, ...seedCerts.map((c) => ({ ...c })))
  taskOwnerState.clear()
}

// Presentation-only formatters + pure helpers (no data access) re-exported
// through the seam so screens still import everything from '@/lib/mock'.
export {
  formatDate,
  formatDateRange,
  formatSessionLabel,
  billableStage,
  moduleKey,
  moduleTypeMeta,
  MODULE_TYPES,
  computePathProgress,
} from './training'

// Certification pure helpers + taxonomy, re-exported through the seam so screens
// import everything cert-related from '@/lib/mock'.
export {
  certExpiryInfo,
  sortCertsByUrgency,
  needsRecert,
  formatCertDate,
  productsForOrg,
  CERT_VENDORS,
  NQF_LEVELS,
  ORG_PRODUCTS,
} from './certifications'

// Dashboard pure helpers (due-date maths + billable pipeline counts), re-exported
// through the seam so the Dashboard screen imports everything from '@/lib/mock'.
export {
  dueInfo,
  buildThisWeek,
  countBillableStages,
  countSummaryStages,
  BILLABLE_STAGES,
  DASHBOARD_NOW_ISO,
} from './dashboard'
export type { DueInfo, DueState, ThisWeekRow, ThisWeekInput } from './dashboard'

export { CURRENT_EMPLOYEE_ID, ONBOARDING_EMPLOYEE_ID }
export type { OnboardingGenerationPhase } from './onboarding'
