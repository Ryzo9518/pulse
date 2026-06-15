// ── Directory search ──────────────────────────────────────────────────────────
// Pure, work-fields-only filter for the People Directory. Mirrors the prototype's
// peopleData search: case-insensitive match over name + job title + department
// only (never POPIA / personal fields). Kept out of the page component so it can
// be unit-tested without rendering.

import type { Employee } from '@/types/database'

/** Does an employee match the directory search query (name / title / department)? */
export function matchesDirectorySearch(employee: Employee, query: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true
  const haystack =
    `${employee.display_name} ${employee.job_title ?? ''} ${employee.department ?? ''}`.toLowerCase()
  return haystack.includes(q)
}

/** Filter a roster by the directory search query. Empty query returns everyone. */
export function filterDirectory(employees: Employee[], query: string): Employee[] {
  const q = query.trim()
  if (!q) return employees
  return employees.filter((e) => matchesDirectorySearch(e, q))
}
