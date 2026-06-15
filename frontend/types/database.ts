// Auto-generated types matching pulse_v5_schema.sql
// Developer: regenerate with `npx supabase gen types typescript` after schema changes

// Three roles. 'manager' gets work-related team oversight only — never payroll,
// POPIA/personal data, or the employment contract (see frontend/lib/capabilities.ts
// and HANDOFF §2). In this mock phase the role is chosen via the dev RoleSwitch;
// production resolves it from the authenticated M365 identity.
export type UserRole = 'admin' | 'manager' | 'employee'
export type EmployeeStatus = 'active' | 'onboarding' | 'probation' | 'suspended' | 'terminated'
export type TaskStatus = 'pending' | 'inprogress' | 'done'
export type TaskVisibility = 'employee' | 'admin' | 'both'
// 'returned' = sent back to the submitter for correction (a returnable state,
// not a hard rejection). Renamed from the older 'declined' to match the
// prototype's "Return for correction" approver action (HANDOFF §4).
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'returned' | 'paid'
// Which rate a travel line is reimbursed at, driven by the invoiced toggle:
// invoiced -> the full AA rate; non-invoiced -> the fixed-cost rate.
export type TravelRateBasis = 'full_aa' | 'fixed_cost'
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
  /**
   * Super-admin / owner. Unrestricted access AND protected top authority: only an
   * owner may grant/revoke admin/owner, and an owner can't be demoted or locked
   * out. Optional in the type for back-compat; enforced in the DB (is_owner +
   * trigger) — see database/migrations/002_rls.sql.
   */
  is_owner?: boolean
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
  /**
   * Hidden from the 'manager' role even though it may otherwise be work-visible.
   * Used for confidential tasks a manager must never see (e.g. the employment
   * contract / NDA). The HR-admin phase is hidden separately by phase_id. See
   * listTasks() in lib/mock and HANDOFF §2.
   */
  manager_hidden?: boolean
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
  version: string           // e.g. 'v1.0' / 'v2026.1'
  effective: string         // human effective date, e.g. 'April 2026'
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

// A claim is three-part: expenses incurred (receipts) + travel (AA rate) −
// advances already paid. Grand total payable = total_other + total_travel −
// total_advances (HANDOFF §4). `timesheet_filename` records the required
// timesheet attachment — submit is blocked until it is present.
export interface ExpenseClaim {
  id: string
  employee_id: string
  claim_period: string | null
  status: ExpenseStatus
  /** Sum of "expenses incurred" (receipt) lines. */
  total_other: number
  /** Sum of travel line totals (km × per-line rate). */
  total_travel: number
  /** Sum of advances already paid out — deducted from the grand total. */
  total_advances: number
  /** total_other + total_travel − total_advances. */
  grand_total: number
  /** Required timesheet attachment; null until attached (blocks submit). */
  timesheet_filename: string | null
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
  /** True -> billed/invoiced to the client -> full AA rate applies. */
  invoiced: boolean
  /** Invoice reference — required when invoiced. */
  invoice_no: string | null
  /** Invoice amount — captured when invoiced. */
  invoice_amount: number | null
  /** Which rate applies: 'full_aa' when invoiced, else 'fixed_cost'. */
  rate_basis: TravelRateBasis
  /** The per-km rate actually applied (from the AA certificate). */
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

// Advances already paid out (petty cash, pre-paid flights, etc.) — deducted
// from the grand total.
export interface ExpenseAdvanceLine {
  id: string
  claim_id: string
  advance_date: string | null
  details: string | null
  amount: number | null
  sort_order: number
  created_at: string
}

// Per-person AA Vehicle Rates Certificate. Its rates DRIVE the travel math:
// `full_rate` for invoiced client travel, `fixed_cost` for non-invoiced
// (HANDOFF §4 / §6 maps VEHICLE/aaCert -> aa_rate_certificates).
export interface AaRateCertificate {
  id: string
  employee_id: string
  make: string
  model: string
  year: string
  registration: string | null
  /** Full AA rate (R/km) — applies to invoiced client travel. */
  full_rate: number
  /** Fixed-cost rate (R/km) — applies to non-invoiced travel. */
  fixed_cost: number
  /** Running-cost component (R/km) — informational. */
  running_cost: number
  /** Fuel price the certificate was calculated against (R/litre). */
  fuel_price: number
  /** Uploaded certificate file name; null when none on file. */
  file_name: string | null
  /** Certificate issue date (ISO). */
  issued_date: string | null
  uploaded: boolean
  created_at: string
  updated_at: string
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

/**
 * How a new document is being added in the Add-documents flow:
 * 'upload' = one or more local files (storage stubbed in the mock phase),
 * 'sharepoint' = a single SharePoint URL captured as a LINK document.
 */
export type DocumentSource = 'upload' | 'sharepoint'

/** A captured file in the upload draft (storage is stubbed — we keep names/sizes only). */
export interface DocumentDraftFile {
  name: string
  /** Inferred type label, e.g. 'pdf', 'docx', 'xlsx'. */
  file_type: string
  /** Pre-formatted size label for display, e.g. '720 KB'. */
  size_label: string
}

/** Input for {@link addDocuments} — one category, either uploaded files or a SharePoint link. */
export interface AddDocumentsInput {
  category: DocumentCategory
  source: DocumentSource
  /** Files to add when source === 'upload'. */
  files: DocumentDraftFile[]
  /** SharePoint URL when source === 'sharepoint'. */
  sharepoint_url: string
  /** Optional display name override for the SharePoint link. */
  link_name?: string
}

/** Input for {@link updateDocument} — replace a document with a new version (file or link). */
export interface UpdateDocumentInput {
  source: DocumentSource
  /** Replacement file when source === 'upload'. */
  file?: DocumentDraftFile
  /** Replacement SharePoint URL when source === 'sharepoint'. */
  sharepoint_url?: string
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

// ── TRAINING / CERTIFICATION (Sage product billable-readiness tracker) ──
// Per-product Sage University learning paths (Intacct, X3, 300 People, Payroll
// Advanced, …) with nested module groups, typed modules, per-path and overall
// progress, and a consultant-entered ILT date that drives the 4-stage billable
// readiness ladder: Pre-supervised → Supervised-billable → ILT complete →
// Certified. Mirrors SCHEMA.sql (training_paths / training_modules /
// training_status) and HANDOFF §3 + §4.

/** A Sage product a consultant can train and certify on. */
export type ProductId =
  | 'intacct'
  | 'x3'
  | '300people'
  | '200evo'
  | 'pastel'
  | 'payroll'

/** Catalog entry for a Sage product (drives the product selector + certs). */
export interface Product {
  id: ProductId
  name: string
  /** The certification a consultant earns on this product. */
  cert: string
  /** The instructor-led course title. */
  course: string
  /** Approximate ILT course hours. */
  hours: number
}

/** The kind of a learning-path module — drives its icon + badge. */
export type ModuleType =
  | 'video'
  | 'ilt'
  | 'assessment'
  | 'exam'
  | 'link'
  | 'job'
  | 'stage'

/** Badge colour token (matches the UI Badge component's colour set). */
export type TrainingBadgeColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'amber'
  | 'pink'
  | 'grey'

/** Presentation metadata for a module type (icon + label + badge colour). */
export interface ModuleTypeMeta {
  label: string
  /** Badge colour token used by the UI Badge component. */
  color: TrainingBadgeColor
  /** Single-glyph icon shown beside the module. */
  icon: string
}

/** Required / recommended emphasis tag on a module. */
export type ModuleTag = 'required' | 'recommended'

/** A single learning module within a path group. */
export interface TrainingModule {
  /** Module title. */
  name: string
  type: ModuleType
  /** Optional supporting description. */
  desc?: string
  /** Required vs recommended emphasis, if any. */
  tag?: ModuleTag
  /**
   * "Select the option that applies" choice marker (e.g. 'a' / 'b') used where
   * a group offers mutually-relevant alternatives in the prototype.
   */
  choice?: string
}

/** A labelled group of modules within a learning path. */
export interface TrainingGroup {
  label: string
  /** Optional note shown under the group label (e.g. "Select the option…"). */
  note?: string
  mods: TrainingModule[]
}

/** A learning path for a product (e.g. "Sage Intacct Implementer"). */
export interface TrainingPath {
  id: string
  name: string
  /** Optional short tag (e.g. "Core path", "South Africa only"). */
  tag?: string
  /** Optional path-level note / prerequisites. */
  note?: string
  groups: TrainingGroup[]
}

/** The certification track a consultant is working toward. */
export type CertPath = 'implementation'

/** Scheduling shape of a Sage U ILT session (legacy session catalogue). */
export type IltSessionFormat = 'fullday' | 'spread'

/** A bookable Sage University instructor-led training session (reference data). */
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

/**
 * One junior consultant's enrolment / progress against the tracker. Maps to the
 * SCHEMA.sql `training_status` row plus per-module `training_progress`.
 */
export interface TrainingEnrolment {
  employee_id: string
  /** The product they are training on. */
  product_id: ProductId
  cert_path: CertPath
  /**
   * The instructor-led training date the consultant enters (SCHEMA
   * training_status.ilt_date). Canonical — there is no fixed session dropdown.
   * Null until booked.
   */
  ilt_date: string | null
  /** Foundations done (Getting Started + console/provisioning) → supervised-billable. */
  getting_started_done: boolean
  /** The instructor-led training completed. */
  ilt_done: boolean
  /** Certification assessment passed. */
  certified: boolean
  /**
   * Per-module completion keyed by `${product}:${pathId}:${moduleSlug}`. Mirrors
   * the SCHEMA training_progress join in this mock phase.
   */
  modules_done: Record<string, boolean>
  updated_at: string
}

/**
 * The 4-stage billable-readiness ladder (HANDOFF §4). Derived from a
 * consultant's flags + entered ILT date — the single source of truth the
 * dashboard pipeline reuses.
 */
export type BillableStage = 'pre' | 'supervised' | 'ilt' | 'certified'

/** The three dated billable milestones, in order. */
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

/** Progress roll-up for one learning path (modules done / total). */
export interface PathProgress {
  path_id: string
  done: number
  total: number
  /** 0-100 percentage, rounded. */
  percent: number
}

/** Admin roll-up row: one junior consultant's billable outlook. */
export interface BillableSummaryRow {
  employee_id: string
  display_name: string
  job_title: string | null
  avatar_initials: string
  avatar_color: string
  product_id: ProductId
  product_name: string
  /** The consultant-entered ILT date (null if not yet set). */
  ilt_date_entered: string | null
  supervised_date: string | null
  ilt_date: string | null
  certified_date: string | null
  /** The derived 4-stage billable readiness stage. */
  stage: BillableStage
  /** The next milestone not yet reached (or null when fully certified). */
  next_milestone: MilestoneKey | null
}

// ── Certifications (product + qualification certs, expiry tracking) ───────────

/**
 * Cert class. 'product' = a vendor/product certification with an expiry that
 * drives recertification alerts; 'graduate' = an academic qualification keyed by
 * NQF level, with no expiry. Mirrors the cert_class enum in SCHEMA.sql.
 */
export type CertClass = 'product' | 'graduate'

/** A recognised certifying organisation / vendor. */
export type CertVendor = 'Sage' | 'Nectari' | 'Microsoft' | 'Yooz' | 'AWS' | 'Other'

/** One certificate (product or qualification) belonging to an employee. */
export interface Certification {
  id: string
  /** The employee the certificate belongs to. */
  employee_id: string
  cclass: CertClass
  /** Certifying organisation — product certs only. */
  vendor: CertVendor | null
  /** Product the cert covers (e.g. "Sage X3") — product certs only. */
  product: string | null
  /** Certificate / qualification name. Required. */
  name: string
  /** NQF level string — qualification certs only. */
  nqf_level: string | null
  /** ISO date (YYYY-MM-DD) issued, or null. */
  issued: string | null
  /** ISO date (YYYY-MM-DD) expiry — product certs only; drives alerts. Null = no expiry. */
  expiry: string | null
  /** SharePoint ref to the PDF (stubbed in the mock phase). */
  file_ref: string | null
  created_at: string
}

/** Expiry classification state for a certificate. */
export type CertExpiryState = 'expired' | 'soon' | 'valid' | 'none'

/** Computed expiry info for a certificate (label + traffic-light state). */
export interface CertExpiryInfo {
  /** Human label (e.g. "Expires 30 Jun 2026", "No expiry"). */
  label: string
  state: CertExpiryState
  /** Days until expiry (negative if past). Null when there is no expiry. */
  days: number | null
}

// ── SUPABASE DATABASE TYPE (for typed client) ──
// Developer: replace this with `npx supabase gen types typescript` output
export interface Database {
  public: {
    Tables: {
      employees: { Row: Employee; Insert: Partial<Employee>; Update: Partial<Employee> }
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
      expense_advance_lines: { Row: ExpenseAdvanceLine; Insert: Partial<ExpenseAdvanceLine>; Update: Partial<ExpenseAdvanceLine> }
      aa_rate_certificates: { Row: AaRateCertificate; Insert: Partial<AaRateCertificate>; Update: Partial<AaRateCertificate> }
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> }
      admin_notifications: { Row: AdminNotification; Insert: Partial<AdminNotification>; Update: Partial<AdminNotification> }
      email_log: { Row: EmailLog; Insert: Partial<EmailLog>; Update: Partial<EmailLog> }
      certifications: { Row: Certification; Insert: Partial<Certification>; Update: Partial<Certification> }
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
