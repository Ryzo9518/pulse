// ── Employee roster column projection ─────────────────────────────────────────
// Pure helper for the admin/manager roster (frontend/app/admin/employees). Kept
// out of the page file so it is unit-testable (Next.js forbids arbitrary named
// exports from page modules) and so the POPIA column boundary has its own tests.

/**
 * Which roster columns a viewer may see. `role`, `phone`, and the `actions`
 * (Notify) column are admin-only — phone is POPIA personal data and must never
 * reach a manager. `canSeePersonal` is the admin-only `viewPersonalData`
 * capability.
 */
export function rosterColumnKeys(canSeePersonal: boolean): string[] {
  return canSeePersonal
    ? ['name', 'role', 'department', 'status', 'phone', 'actions']
    : ['name', 'department', 'status']
}
