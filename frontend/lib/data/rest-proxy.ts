// Helpers for the authenticated PostgREST proxy (app/api/rest/[...path]).
// Kept in a separate module so the path-safety logic is unit-testable (Next.js
// route files may only export HTTP-method handlers).

// A single PostgREST table/view name: lowercase, starts with a letter/underscore.
// Restricting to ONE segment that matches this blocks path traversal, nested
// paths, and the `/rpc/*` function surface — the proxy only fronts table/view
// reads, with Row-Level Security as the boundary.
export const TABLE_RE = /^[a-z_][a-z0-9_]*$/

/**
 * Validate the catch-all path segments and return the single table/view name,
 * or null if the request is not an allowed table read.
 */
export function parseTable(path: string[] | undefined): string | null {
  if (!path || path.length !== 1) return null
  const table = path[0]
  return TABLE_RE.test(table) ? table : null
}

/** Build the upstream PostgREST URL for a validated table + raw query string. */
export function buildUpstreamUrl(
  base: string,
  table: string,
  search: string,
): string {
  return `${base.replace(/\/$/, '')}/${table}${search}`
}

// Tables the proxy will accept writes for, and which methods. Row-Level Security
// still decides what each user may actually change; this allowlist is
// defense-in-depth so the proxy can never be a generic write gateway to every
// table (e.g. audit_log, payroll). Add an entry as each screen's writes go live.
export const WRITE_ALLOWLIST: Record<string, ReadonlyArray<string>> = {
  // Policy acknowledgements: a user upserts their own ack (insert/update); a DB
  // trigger recomputes policies_completed. RLS scopes to the signed-in employee.
  hr_policy_acknowledgements: ['POST', 'PATCH'],
}

/** True when `method` is an allowed write for `table`. */
export function isWriteAllowed(table: string | null, method: string): boolean {
  if (!table) return false
  const allowed = WRITE_ALLOWLIST[table]
  return Array.isArray(allowed) && allowed.includes(method)
}
