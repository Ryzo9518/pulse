// Auto-generated types matching pulse_v5_schema.sql
// Developer: regenerate with `npx supabase gen types typescript` after schema changes

import type { CertStatus } from '@/lib/certifications/status'

export type UserRole = 'admin' | 'employee'
export type EmployeeStatus = 'active' | 'onboarding' | 'probation' | 'suspended' | 'terminated'
export type TaskStatus = 'pending' | 'inprogress' | 'done'
export type TaskVisibility = 'employee' | 'admin' | 'both'
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'declined' | 'paid'
export type ExpenseRole = 'submitter' | 'approver' | 'both'
export type SopKey = 'projects' | 'desk' | 'timekeeping' | 'client_access'
export type FormKey = 'personal' | 'emergency' | 'tax' | 'policies' | 'goals'
export type NotificationType = 'info' | 'urgent' | 'celebration' | 'reminder'
export type MessageType = 'announcement' | 'chat'
export type MeetingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled'
export type DocumentCategory = 'contracts_policies' | 'timesheets_invoicing' | 'job_descriptions' | 'sops_procedures' | 'employee_forms' | 'hr_policies' | 'other'

export interface Employee {
  id: string
  email: string
  first_name: string
  last_name: string
  display_name: string        // auto-generated
  avatar_initials: string     // auto-generated
  role: UserRole
  status: EmployeeStatus
  job_title: string | null
  department: string | null
  phone: string | null
  avatar_color: string
  manager_id: string | null
  start_date: string | null
  two_factor_enabled: boolean
  expense_role: ExpenseRole
  policies_completed: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface EmployeePersonalInfo {
  id: string
  employee_id: string
  id_number: string | null
  date_of_birth: string | null
  gender: string | null
  nationality: string | null
  home_language: string | null
  home_address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  cell_phone: string | null
  personal_email: string | null
  created_at: string
  updated_at: string
}

export interface EmergencyContact {
  id: string
  employee_id: string
  contact_order: number
  full_name: string
  relationship: string | null
  address: string | null
  cell_phone: string | null
  home_phone: string | null
  work_phone: string | null
  employer: string | null
  created_at: string
}

export interface EmployeeMedicalInfo {
  id: string
  employee_id: string
  doctor_name: string | null
  doctor_phone: string | null
  medical_aid: string | null
  medical_aid_number: string | null
  allergies: string | null
  consent_given: boolean
  consent_date: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeTaxBanking {
  id: string
  employee_id: string
  tax_ref_number: string | null
  tax_status: string | null
  bank_name: string | null
  account_holder: string | null
  account_number: string | null
  branch_code: string | null
  account_type: string | null
  consent_given: boolean
  consent_date: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingPhase {
  id: string
  name: string
  icon: string | null
  days_label: string | null
  visibility: TaskVisibility
  sort_order: number
}

export interface OnboardingTask {
  id: string
  phase_id: string
  title: string
  default_owner: string | null
  priority: string
  system: string | null
  days_offset: number
  visibility: TaskVisibility
  sort_order: number
}

export interface OnboardingWorkflow {
  id: string
  employee_id: string
  started_at: string
  completed_at: string | null
  created_by: string | null
}

export interface OnboardingTaskStatus {
  id: string
  workflow_id: string
  task_id: string
  assigned_to: string | null
  status: TaskStatus
  started_at: string | null
  completed_at: string | null
  completed_by: string | null
}

export interface OnboardingFormCompletion {
  id: string
  employee_id: string
  form_key: FormKey
  completed_at: string
}

export interface EmployeeGoal {
  id: string
  employee_id: string
  period: string           // '30', '60', '90'
  goal_number: number
  goal_text: string | null
  is_achieved: boolean
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
}

export interface ContractUpload {
  id: string
  employee_id: string
  file_url: string
  file_name: string | null
  uploaded_by: string | null
  uploaded_at: string
  signed: boolean
  signed_at: string | null
}

export interface HrPolicy {
  id: string                // e.g. 'HR001'
  code: string              // e.g. 'JERA-POL-HR001'
  title: string
  icon: string | null
  summary: string | null
  full_text: string | null
  document_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface HrPolicyAcknowledgement {
  id: string
  employee_id: string
  policy_id: string
  acknowledged: boolean
  read_started_at: string | null
  acknowledged_at: string | null
}

export interface Sop {
  key: SopKey
  name: string
  icon: string | null
  total_steps: number
}

export interface SopStep {
  id: string
  sop_key: SopKey
  step_number: number
  icon: string | null
  title: string
  description: string | null
  detail: string | null
  action_text: string | null
  tip_text: string | null
}

export interface SopCompletion {
  id: string
  employee_id: string
  sop_key: SopKey
  current_step: number
  completed: boolean
  started_at: string
  completed_at: string | null
}

export interface ExpenseClaim {
  id: string
  employee_id: string
  claim_period: string | null
  status: ExpenseStatus
  total_travel: number
  total_other: number
  grand_total: number
  submitted_at: string | null
  approver_id: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseTravelLine {
  id: string
  claim_id: string
  client_name: string
  travel_date: string | null
  reason: string | null
  rate_per_km: number
  km_traveled: number | null
  amount: number | null
  sort_order: number
  created_at: string
}

export interface ExpenseOtherLine {
  id: string
  claim_id: string
  client_name: string
  expense_date: string | null
  description: string | null
  amount: number | null
  receipt_url: string | null
  sort_order: number
  created_at: string
}

export interface Message {
  id: string
  channel: string
  message_type: MessageType
  author_id: string
  body: string
  created_at: string
}

export interface AdminNotification {
  id: string
  sent_by: string
  notification_type: NotificationType
  subject: string
  body: string
  target: string
  created_at: string
}

export interface EmailLog {
  id: string
  from_employee: string | null
  to_email: string
  to_employee: string | null
  subject: string
  body: string | null
  email_type: string | null
  resend_id: string | null
  sent_at: string
}

export interface Document {
  id: string
  title: string
  description: string | null
  category: DocumentCategory
  file_type: string | null
  file_url: string | null
  file_size_bytes: number | null
  uploaded_by: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentAcknowledgement {
  id: string
  document_id: string
  employee_id: string
  acknowledged_at: string
}

export interface AuditLog {
  id: string
  employee_id: string
  action: string
  detail: Record<string, unknown> | null
  created_at: string
}

// ── VIEW TYPES (for admin dashboard) ──

export interface AdminOnboardingSummary {
  id: string
  display_name: string
  email: string
  status: EmployeeStatus
  start_date: string | null
  department: string | null
  job_title: string | null
  forms_done: number
  forms_total: number
  sops_done: number
  sops_total: number
  policies_done: number
  policies_total: number
  policies_completed: boolean
  expense_claims_total: number
  expense_claims_pending: number
}

export interface AdminActivityFeed {
  id: string
  employee_id: string
  display_name: string
  avatar_initials: string
  avatar_color: string
  action: string
  detail: Record<string, unknown> | null
  created_at: string
}

export interface PendingExpenseApproval {
  claim_id: string
  claim_period: string | null
  grand_total: number
  submitted_at: string
  submitter_name: string
  submitter_email: string
  approver_name: string | null
}

// ── TRAINING / CERTIFICATION (Sage Intacct billable-readiness tracker) ──
// Lets a junior consultant log the Sage University instructor-led training (ILT)
// session they are booked on, and projects when they become billable across
// three milestones: supervised → ILT complete → certified.

/** Scheduling shape of a Sage U ILT session. */
export type IltSessionFormat = 'fullday' | 'spread'

/** A bookable Sage University instructor-led training session. */
export interface IltSession {
  id: string
  course: string
  /** ISO date (YYYY-MM-DD) the session starts. */
  start_date: string
  /** ISO date (YYYY-MM-DD) the session ends. */
  end_date: string
  /** 'fullday' = ~25h in one consecutive week; 'spread' = part-days over ~2 weeks. */
  format: IltSessionFormat
  /** ISO date registration closes. */
  register_by: string
  /** Free-text seat availability note captured from Sage U. */
  seats_note: string
}

/** The certification track a consultant is working toward. */
export type CertPath = 'implementation'

/** One junior consultant's enrolment / progress against the tracker. */
export interface TrainingEnrolment {
  employee_id: string
  /** The ILT session they have chosen, or null if not yet selected. */
  session_id: string | null
  cert_path: CertPath
  /** Foundations done (Getting Started + console/provisioning) → supervised-billable. */
  getting_started_done: boolean
  /** The 25-hour Implementing ILT completed. */
  ilt_done: boolean
  /** Certification assessment passed. */
  certified: boolean
  updated_at: string
}

/** The three billable milestones, in order. */
export type MilestoneKey = 'supervised' | 'ilt' | 'certified'

export type MilestoneStatus = 'done' | 'on_track' | 'pending'

/** A computed milestone with its projected/actual date and status. */
export interface BillableMilestone {
  key: MilestoneKey
  label: string
  /** ISO date (YYYY-MM-DD) — projected or actual. Null if it cannot be projected yet. */
  date: string | null
  status: MilestoneStatus
}

/** Admin roll-up row: one junior consultant's billable outlook. */
export interface BillableSummaryRow {
  employee_id: string
  display_name: string
  job_title: string | null
  avatar_initials: string
  avatar_color: string
  session_id: string | null
  session_label: string | null
  supervised_date: string | null
  ilt_date: string | null
  certified_date: string | null
  /** The next milestone not yet reached (or null when fully certified). */
  next_milestone: MilestoneKey | null
}

// ── CERTIFICATION REGISTRY (Phase A) ──
// One home for every consultant's externally-issued credentials. Status is
// computed (never hand-set) by computeCertStatus in lib/certifications/status.ts.

/** The three credential families the registry tracks (requirement R1). */
export type CertFamily = 'sage' | 'professional' | 'vendor'

/** Renewable (external certs) vs one-time (e.g. onboarding milestones) — R2. */
export type CertLifecycle = 'renewable' | 'one_time'

/** Re-exported so callers can import the status union from one place. */
export type { CertStatus }

/** A single credential held by a consultant. */
export interface Certification {
  id: string
  employee_id: string
  family: CertFamily
  lifecycle_kind: CertLifecycle
  name: string
  issuing_body: string | null
  issued_date: string | null
  expiry_date: string | null
  /** Date renewal action must start; precedes expiry (R2). Null = derive from expiry. */
  renew_by_date: string | null
  non_expiring: boolean
  status: CertStatus
  /** Path in the private 'certifications' storage bucket; null until a file is uploaded. */
  proof_path: string | null
  /** Reminders only fire for renew-by points crossed after this baseline (R22). */
  reminders_baseline_at: string
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export type CertEventType =
  | 'created'
  | 'verified'
  | 'rejected'
  | 'status_changed'
  | 're_uploaded'
  | 'reminder_sent'

/** Append-only audit-log entry for a credential (requirement R3). */
export interface CertificationEvent {
  id: string
  certification_id: string
  event_type: CertEventType
  actor_id: string | null
  detail: Record<string, unknown> | null
  created_at: string
}

// ── SUPABASE DATABASE TYPE (for typed client) ──
// Developer: replace this with `npx supabase gen types typescript` output
export interface Database {
  public: {
    Tables: {
      employees: { Row: Employee; Insert: Partial<Employee>; Update: Partial<Employee> }
      certifications: { Row: Certification; Insert: Partial<Certification>; Update: Partial<Certification> }
      certification_events: { Row: CertificationEvent; Insert: Partial<CertificationEvent>; Update: Partial<CertificationEvent> }
      employee_personal_info: { Row: EmployeePersonalInfo; Insert: Partial<EmployeePersonalInfo>; Update: Partial<EmployeePersonalInfo> }
      emergency_contacts: { Row: EmergencyContact; Insert: Partial<EmergencyContact>; Update: Partial<EmergencyContact> }
      employee_medical_info: { Row: EmployeeMedicalInfo; Insert: Partial<EmployeeMedicalInfo>; Update: Partial<EmployeeMedicalInfo> }
      employee_tax_banking: { Row: EmployeeTaxBanking; Insert: Partial<EmployeeTaxBanking>; Update: Partial<EmployeeTaxBanking> }
      onboarding_phases: { Row: OnboardingPhase; Insert: Partial<OnboardingPhase>; Update: Partial<OnboardingPhase> }
      onboarding_tasks: { Row: OnboardingTask; Insert: Partial<OnboardingTask>; Update: Partial<OnboardingTask> }
      onboarding_workflows: { Row: OnboardingWorkflow; Insert: Partial<OnboardingWorkflow>; Update: Partial<OnboardingWorkflow> }
      onboarding_task_status: { Row: OnboardingTaskStatus; Insert: Partial<OnboardingTaskStatus>; Update: Partial<OnboardingTaskStatus> }
      onboarding_form_completions: { Row: OnboardingFormCompletion; Insert: Partial<OnboardingFormCompletion>; Update: Partial<OnboardingFormCompletion> }
      employee_goals: { Row: EmployeeGoal; Insert: Partial<EmployeeGoal>; Update: Partial<EmployeeGoal> }
      contract_uploads: { Row: ContractUpload; Insert: Partial<ContractUpload>; Update: Partial<ContractUpload> }
      hr_policies: { Row: HrPolicy; Insert: Partial<HrPolicy>; Update: Partial<HrPolicy> }
      hr_policy_acknowledgements: { Row: HrPolicyAcknowledgement; Insert: Partial<HrPolicyAcknowledgement>; Update: Partial<HrPolicyAcknowledgement> }
      sops: { Row: Sop; Insert: Partial<Sop>; Update: Partial<Sop> }
      sop_steps: { Row: SopStep; Insert: Partial<SopStep>; Update: Partial<SopStep> }
      sop_completions: { Row: SopCompletion; Insert: Partial<SopCompletion>; Update: Partial<SopCompletion> }
      expense_claims: { Row: ExpenseClaim; Insert: Partial<ExpenseClaim>; Update: Partial<ExpenseClaim> }
      expense_travel_lines: { Row: ExpenseTravelLine; Insert: Partial<ExpenseTravelLine>; Update: Partial<ExpenseTravelLine> }
      expense_other_lines: { Row: ExpenseOtherLine; Insert: Partial<ExpenseOtherLine>; Update: Partial<ExpenseOtherLine> }
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> }
      admin_notifications: { Row: AdminNotification; Insert: Partial<AdminNotification>; Update: Partial<AdminNotification> }
      email_log: { Row: EmailLog; Insert: Partial<EmailLog>; Update: Partial<EmailLog> }
      documents: { Row: Document; Insert: Partial<Document>; Update: Partial<Document> }
      document_acknowledgements: { Row: DocumentAcknowledgement; Insert: Partial<DocumentAcknowledgement>; Update: Partial<DocumentAcknowledgement> }
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
    }
    Views: {
      admin_onboarding_summary: { Row: AdminOnboardingSummary }
      admin_activity_feed: { Row: AdminActivityFeed }
      pending_expense_approvals: { Row: PendingExpenseApproval }
    }
  }
}
