// ── Employee roster column projection ─────────────────────────────────────────
// Pure helper for the admin/manager roster (frontend/app/admin/employees). Kept
// out of the page file so it is unit-testable (Next.js forbids arbitrary named
// exports from page modules) and so the POPIA column boundary has its own tests.

/**
 * Which roster columns a viewer may see. `role`, `phone`, `twofa` (2FA status),
 * and the `actions` (Notify) column are admin-only — phone is POPIA personal data
 * and 2FA status is a security attribute, neither of which may reach a manager.
 * `canSeePersonal` is the admin-only `viewPersonalData` capability. The manager
 * projection stays work-fields-only: name, department, status.
 */
export function rosterColumnKeys(canSeePersonal: boolean): string[] {
  return canSeePersonal
    ? ['name', 'role', 'department', 'status', 'phone', 'twofa', 'actions']
    : ['name', 'department', 'status']
}
