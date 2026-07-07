// Pure composition helpers for the live Training data path (WS-3).
//
// The DB persists only per-consultant state: a `training_status` row (product,
// ILT date, billable flags — contract V-BILL-STAGE inputs) and per-module
// `training_progress` rows keyed `${product}:${pathId}:${moduleSlug}`. The
// learning-path catalog itself (paths/groups/modules) is client reference
// content (`lib/mock/training.ts` — real Sage U curricula), so these helpers
// fold live rows into the same `TrainingEnrolment` / `BillableSummaryRow`
// view-models the screen already renders. Kept free of fetch/react so they are
// unit-testable (mirrors rest-proxy.ts).

import {
  billableStage,
  computeMilestones,
  nextMilestone,
  productById,
} from '@/lib/mock/training'
import type {
  BillableSummaryRow,
  Employee,
  Product,
  ProductId,
  TrainingEnrolment,
  TrainingStatusRow,
} from '@/types/database'

/** The subset of a training_progress row the hook fetches. */
export interface ProgressEntry {
  module_key: string
  done: boolean
}

/** Employee columns the team roll-up needs (never POPIA columns). */
export type RosterEmployee = Pick<
  Employee,
  | 'id'
  | 'display_name'
  | 'job_title'
  | 'avatar_initials'
  | 'avatar_color'
  | 'department'
  | 'status'
  | 'start_date'
>

/**
 * Fold a live training_status row + progress rows into the TrainingEnrolment
 * view-model. Progress-only state (modules ticked before any status write)
 * still yields an enrolment with the default product, mirroring the mock
 * seam's ensureEnrolment defaults.
 */
export function toEnrolment(
  status: TrainingStatusRow | null,
  progress: ProgressEntry[],
): TrainingEnrolment | undefined {
  if (!status && progress.length === 0) return undefined
  const modules_done: Record<string, boolean> = {}
  for (const p of progress) modules_done[p.module_key] = p.done
  return {
    employee_id: status?.employee_id ?? '',
    product_id: status?.product ?? 'intacct',
    cert_path: 'implementation',
    ilt_date: status?.ilt_date ?? null,
    getting_started_done: status?.getting_started_done ?? false,
    ilt_done: status?.ilt_done ?? false,
    certified: status?.certified ?? false,
    modules_done,
    updated_at: status?.updated_at ?? '',
  }
}

/**
 * Which employees the tracker treats as junior consultants: anyone with a
 * training_status row, plus onboarding/probation staff in the Consulting team
 * (so managers can spot consultants who have not enrolled yet). Same rule as
 * the mock seam's isJuniorConsultant.
 */
export function isJuniorConsultant(
  employee: RosterEmployee,
  hasStatusRow: boolean,
): boolean {
  if (hasStatusRow) return true
  return (
    employee.department === 'Consulting' &&
    (employee.status === 'onboarding' || employee.status === 'probation')
  )
}

/**
 * Compose the manager/admin billable roll-up from live rows. RLS already
 * scopes `statuses` (self + own team for managers, all for admin) — this is
 * presentation shaping, never the access-control boundary. Sorted soonest
 * certified date first, unscheduled to the bottom (same as the mock seam).
 */
export function composeBillableSummary(
  employees: RosterEmployee[],
  statuses: TrainingStatusRow[],
  products: Product[],
  reference?: Date,
): BillableSummaryRow[] {
  const statusByEmployee = new Map(statuses.map((s) => [s.employee_id, s]))
  const productsById = new Map(products.map((p) => [p.id, p]))
  const productFor = (id: ProductId): Product =>
    productsById.get(id) ?? productById(id)

  const rows = employees
    .filter((e) => isJuniorConsultant(e, statusByEmployee.has(e.id)))
    .map((e): BillableSummaryRow => {
      const status = statusByEmployee.get(e.id) ?? null
      const enrolment = toEnrolment(status, [])
      const product = productFor(enrolment?.product_id ?? 'intacct')
      const milestones = computeMilestones(e, enrolment, reference)
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
        supervised_date:
          milestones.find((m) => m.key === 'supervised')?.date ?? null,
        ilt_date: milestones.find((m) => m.key === 'ilt')?.date ?? null,
        certified_date:
          milestones.find((m) => m.key === 'certified')?.date ?? null,
        stage,
        next_milestone: nextMilestone(milestones),
      }
    })

  return rows.sort((a, b) => {
    if (a.certified_date && b.certified_date) {
      return a.certified_date.localeCompare(b.certified_date)
    }
    if (a.certified_date) return -1
    if (b.certified_date) return 1
    return a.display_name.localeCompare(b.display_name)
  })
}
