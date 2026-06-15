// ── Role capabilities ─────────────────────────────────────────────────────────
// Single source of truth for what each of the three roles may do, mirroring the
// permission matrix in docs/prototype/HANDOFF.md §2. Use `can(role, capability)`
// instead of scattering `role === 'admin'` checks, so the manager boundary stays
// consistent across screens. In this mock phase the active role comes from the
// dev RoleSwitch; production resolves it from the M365 identity and MUST also
// enforce these rules in Supabase RLS — the UI alone is not a security boundary.

import type { UserRole } from '@/types/database'

export type Capability =
  /** See a team roster (manager: their team; admin: everyone). */
  | 'viewTeam'
  /** Approve / return expense claims. */
  | 'approveExpenses'
  /** Schedule a new starter (generate the onboarding workflow). */
  | 'scheduleOnboarding'
  /** See the employment contract / NDA onboarding task. */
  | 'viewContractTask'
  /** See the HR-admin onboarding phase (tax, banking, payroll, medical). */
  | 'viewPayrollTasks'
  /** See POPIA / personal data (phone, ID, banking) on other employees. */
  | 'viewPersonalData'
  /** Upload or edit certificates, including for other people (admin). */
  | 'uploadCertificates'
  /** Upload or edit one's OWN certificates (every role — self-service). */
  | 'uploadOwnCertificates'
  /** Reassign onboarding task owners. */
  | 'assignTaskOwners'
  /** Publish / version policies. */
  | 'publishPolicies'
  /** Upload company documents / SharePoint links. */
  | 'uploadDocuments'
  /** Send company-wide announcements (Notify All). */
  | 'notifyAll'

// Admin can do everything; manager gets work-related team oversight only.
const ADMIN_CAPABILITIES: readonly Capability[] = [
  'viewTeam',
  'approveExpenses',
  'scheduleOnboarding',
  'viewContractTask',
  'viewPayrollTasks',
  'viewPersonalData',
  'uploadCertificates',
  'uploadOwnCertificates',
  'assignTaskOwners',
  'publishPolicies',
  'uploadDocuments',
  'notifyAll',
]

const MANAGER_CAPABILITIES: readonly Capability[] = [
  'viewTeam',
  'approveExpenses',
  'scheduleOnboarding',
  'uploadOwnCertificates',
]

// Every role can manage their OWN certificates (self-service); admins/managers
// layer their extra capabilities on top.
const EMPLOYEE_CAPABILITIES: readonly Capability[] = ['uploadOwnCertificates']

const CAPABILITIES: Record<UserRole, ReadonlySet<Capability>> = {
  employee: new Set(EMPLOYEE_CAPABILITIES),
  manager: new Set(MANAGER_CAPABILITIES),
  admin: new Set(ADMIN_CAPABILITIES),
}

/** Does `role` have `capability`? */
export function can(role: UserRole, capability: Capability): boolean {
  return CAPABILITIES[role].has(capability)
}

/** Manager or admin — i.e. has any team-oversight responsibility. */
export function isStaffRole(role: UserRole): boolean {
  return role === 'manager' || role === 'admin'
}

/** Human label for a view role (used in the sidebar / chrome). */
export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'manager':
      return 'Manager'
    default:
      return 'Employee'
  }
}
