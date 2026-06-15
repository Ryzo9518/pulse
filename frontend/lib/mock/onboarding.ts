// Mock onboarding seed data — phases, tasks, workflow, and per-task status.
// Sourced from database/pulse_v5_schema.sql (the authoritative seed) and the
// PHASES array in docs/pulse_v4_prototype.html.

import type {
  OnboardingPhase,
  OnboardingTask,
  OnboardingWorkflow,
  OnboardingTaskStatus,
} from '@/types/database'
import { ONBOARDING_EMPLOYEE_ID, ADMIN_EMPLOYEE_ID } from './employees'

const NOW = '2026-06-13T08:00:00.000Z'

export const onboardingPhases: OnboardingPhase[] = [
  { id: 'pre', name: 'Pre-Arrival', icon: '📋', days_label: 'Before Day 1', visibility: 'admin', sort_order: 1 },
  { id: 'day1', name: 'Day 1 — Welcome', icon: '🎉', days_label: 'Day 1', visibility: 'both', sort_order: 2 },
  { id: 'it', name: 'IT Setup', icon: '💻', days_label: 'Day 1–2', visibility: 'both', sort_order: 3 },
  { id: 'hr', name: 'HR Admin', icon: '📑', days_label: 'Day 2–3', visibility: 'admin', sort_order: 4 },
  { id: 'training', name: 'Orientation', icon: '🎓', days_label: 'Week 1–2', visibility: 'employee', sort_order: 5 },
]

export const onboardingTasks: OnboardingTask[] = [
  // Pre-Arrival (admin only)
  { id: 't1', phase_id: 'pre', title: 'Send welcome letter & arrival info', default_owner: 'hr', priority: 'high', system: null, days_offset: -3, visibility: 'admin', sort_order: 1 },
  { id: 't2', phase_id: 'pre', title: 'Notify IT to prepare equipment', default_owner: 'hr', priority: 'high', system: 'zoho', days_offset: -3, visibility: 'admin', sort_order: 2 },
  { id: 't3', phase_id: 'pre', title: 'Collect clothing size from new employee', default_owner: 'joann', priority: 'medium', system: null, days_offset: -2, visibility: 'admin', sort_order: 3 },
  { id: 't4', phase_id: 'pre', title: 'Prepare laptop / workstation', default_owner: 'siko', priority: 'high', system: null, days_offset: -1, visibility: 'admin', sort_order: 4 },
  // Day 1 (mixed visibility)
  { id: 't6', phase_id: 'day1', title: 'Welcome & office tour', default_owner: 'ryan', priority: 'high', system: null, days_offset: 0, visibility: 'both', sort_order: 1 },
  { id: 't7', phase_id: 'day1', title: 'Sign employment contract & NDA', default_owner: 'hr', priority: 'high', system: null, days_offset: 0, visibility: 'both', manager_hidden: true, sort_order: 2 },
  { id: 't9', phase_id: 'day1', title: 'Issue Jera clothing (Week 1-2)', default_owner: 'joann', priority: 'medium', system: null, days_offset: 7, visibility: 'admin', sort_order: 3 },
  { id: 't10', phase_id: 'day1', title: 'Create Jera email address', default_owner: 'siko', priority: 'high', system: 'microsoft', days_offset: 0, visibility: 'admin', sort_order: 4 },
  // IT Setup (admin tasks)
  { id: 't11', phase_id: 'it', title: 'Configure laptop & install software', default_owner: 'siko', priority: 'high', system: 'microsoft', days_offset: 1, visibility: 'admin', sort_order: 1 },
  { id: 't12', phase_id: 'it', title: 'Assign Microsoft 365 licence', default_owner: 'raymond', priority: 'high', system: 'microsoft', days_offset: 1, visibility: 'admin', sort_order: 2 },
  { id: 't13', phase_id: 'it', title: 'Setup Outlook, Teams, SharePoint', default_owner: 'raymond', priority: 'high', system: 'microsoft', days_offset: 1, visibility: 'admin', sort_order: 3 },
  { id: 't14', phase_id: 'it', title: 'Activate MFA on all accounts', default_owner: 'siko', priority: 'high', system: 'microsoft', days_offset: 1, visibility: 'admin', sort_order: 4 },
  { id: 't15', phase_id: 'it', title: 'Assign Zoho One licence (Projects + Desk)', default_owner: 'ryan', priority: 'high', system: 'zoho', days_offset: 1, visibility: 'admin', sort_order: 5 },
  { id: 't16', phase_id: 'it', title: 'Create Memtime account', default_owner: 'raymond', priority: 'medium', system: 'microsoft', days_offset: 1, visibility: 'admin', sort_order: 6 },
  { id: 't17', phase_id: 'it', title: 'Setup VPN access', default_owner: 'siko', priority: 'medium', system: null, days_offset: 1, visibility: 'admin', sort_order: 7 },
  { id: 't18', phase_id: 'it', title: 'Setup email signature (template from Ryan)', default_owner: 'siko', priority: 'medium', system: 'microsoft', days_offset: 2, visibility: 'admin', sort_order: 8 },
  { id: 't19', phase_id: 'it', title: 'Setup Teams background (from Ryan)', default_owner: 'siko', priority: 'low', system: 'microsoft', days_offset: 2, visibility: 'admin', sort_order: 9 },
  // IT verification (employee sees these)
  { id: 't30', phase_id: 'it', title: 'Verify: Logged into Microsoft 365 (Outlook, Teams)', default_owner: null, priority: 'high', system: 'microsoft', days_offset: 1, visibility: 'employee', sort_order: 10 },
  { id: 't31', phase_id: 'it', title: 'Verify: OneDrive syncing & accessible', default_owner: null, priority: 'high', system: 'microsoft', days_offset: 1, visibility: 'employee', sort_order: 11 },
  { id: 't32', phase_id: 'it', title: 'Verify: Logged into Zoho Projects', default_owner: null, priority: 'high', system: 'zoho', days_offset: 1, visibility: 'employee', sort_order: 12 },
  { id: 't33', phase_id: 'it', title: 'Verify: Logged into Zoho Desk', default_owner: null, priority: 'high', system: 'zoho', days_offset: 1, visibility: 'employee', sort_order: 13 },
  { id: 't34', phase_id: 'it', title: 'Verify: Memtime installed & tracking', default_owner: null, priority: 'medium', system: 'microsoft', days_offset: 1, visibility: 'employee', sort_order: 14 },
  { id: 't35', phase_id: 'it', title: 'Verify: VPN connected successfully', default_owner: null, priority: 'medium', system: null, days_offset: 1, visibility: 'employee', sort_order: 15 },
  // HR Admin (admin only)
  { id: 't20', phase_id: 'hr', title: 'Complete tax & banking detail forms', default_owner: 'hr', priority: 'high', system: null, days_offset: 2, visibility: 'admin', sort_order: 1 },
  { id: 't21', phase_id: 'hr', title: 'Register on payroll system', default_owner: 'hr', priority: 'high', system: null, days_offset: 2, visibility: 'admin', sort_order: 2 },
  { id: 't22', phase_id: 'hr', title: 'Medical aid & pension registration', default_owner: 'hr', priority: 'medium', system: null, days_offset: 3, visibility: 'admin', sort_order: 3 },
  // Orientation (employee)
  { id: 't24', phase_id: 'training', title: '1-on-1 with manager: role & goals', default_owner: 'ryan', priority: 'high', system: null, days_offset: 3, visibility: 'employee', sort_order: 1 },
  { id: 't25', phase_id: 'training', title: 'Complete Zoho Projects SOP walkthrough', default_owner: 'ryan', priority: 'high', system: 'zoho', days_offset: 4, visibility: 'employee', sort_order: 2 },
  { id: 't26', phase_id: 'training', title: 'Complete Zoho Desk SOP walkthrough', default_owner: 'ryan', priority: 'high', system: 'zoho', days_offset: 4, visibility: 'employee', sort_order: 3 },
  { id: 't36', phase_id: 'training', title: 'Complete Timekeeping SOP walkthrough', default_owner: 'ryan', priority: 'high', system: null, days_offset: 4, visibility: 'employee', sort_order: 4 },
  { id: 't37', phase_id: 'training', title: 'Complete Client Access SOP', default_owner: 'ryan', priority: 'high', system: null, days_offset: 4, visibility: 'employee', sort_order: 5 },
  { id: 't38', phase_id: 'training', title: 'Read & acknowledge all 20 HR policies', default_owner: 'ryan', priority: 'high', system: null, days_offset: 5, visibility: 'employee', sort_order: 6 },
  { id: 't27', phase_id: 'training', title: 'Assign mentor for first 30 days', default_owner: 'ryan', priority: 'medium', system: null, days_offset: 5, visibility: 'admin', sort_order: 7 },
  { id: 't28', phase_id: 'training', title: 'Schedule weekly check-ins (Month 1)', default_owner: 'hr', priority: 'medium', system: 'zoho', days_offset: 5, visibility: 'admin', sort_order: 8 },
]

// ── Onboarding generation template ────────────────────────────────────────────
// When an admin/manager schedules a new starter, the workflow generator emits a
// fixed standard task set across the five phases. This is the *template* the
// "Schedule Onboarding" preview reports on (what WILL be generated), distinct
// from the active per-employee workflow seed above. Sourced from the prototype's
// PHASES + TASKS (newEmployeeData): 30 tasks across 5 phases. The per-phase
// counts below mirror that canonical generation set, so the preview total stays
// stable at 30 regardless of how the live demo workflow above evolves.
export interface OnboardingGenerationPhase {
  /** Matches an OnboardingPhase.id. */
  id: string
  name: string
  icon: string | null
  days_label: string | null
  /** Number of tasks generated in this phase for a brand-new starter. */
  task_count: number
}

const GENERATION_TASK_COUNTS: Record<string, number> = {
  pre: 4,
  day1: 4,
  it: 12,
  hr: 3,
  training: 7,
}

export const onboardingGenerationPlan: OnboardingGenerationPhase[] =
  onboardingPhases.map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    days_label: p.days_label,
    task_count: GENERATION_TASK_COUNTS[p.id] ?? 0,
  }))

/** Total tasks generated for a new starter (sum of the per-phase template). */
export const onboardingGenerationTaskTotal = onboardingGenerationPlan.reduce(
  (sum, p) => sum + p.task_count,
  0,
)

// The onboarding employee's active workflow.
export const onboardingWorkflow: OnboardingWorkflow = {
  id: 'wf-001',
  employee_id: ONBOARDING_EMPLOYEE_ID,
  started_at: '2026-06-11T08:00:00.000Z',
  completed_at: null,
  created_by: ADMIN_EMPLOYEE_ID,
}

// Per-task status seed for the onboarding employee. A few admin pre-arrival /
// Day-1 tasks are already done; IT is mid-flight; orientation is pending.
const DONE_TASK_IDS = new Set(['t1', 't2', 't3', 't4', 't6', 't7', 't10'])
const INPROGRESS_TASK_IDS = new Set(['t11', 't12', 't13', 't14'])

export const onboardingTaskStatuses: OnboardingTaskStatus[] = onboardingTasks.map(
  (task, i) => {
    const isDone = DONE_TASK_IDS.has(task.id)
    const isInProgress = INPROGRESS_TASK_IDS.has(task.id)
    const status = isDone ? 'done' : isInProgress ? 'inprogress' : 'pending'
    return {
      id: `ots-${String(i + 1).padStart(3, '0')}`,
      workflow_id: onboardingWorkflow.id,
      task_id: task.id,
      assigned_to: null,
      status,
      started_at: isDone || isInProgress ? '2026-06-11T09:00:00.000Z' : null,
      completed_at: isDone ? '2026-06-12T15:00:00.000Z' : null,
      completed_by: isDone ? ADMIN_EMPLOYEE_ID : null,
    }
  }
)
