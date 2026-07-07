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
  // ── WS-4 Expenses ──────────────────────────────────────────────────────────
  // Claims: owner creates drafts (POST) and edits/submits them (PATCH); the
  // approver set approves/returns and admin marks paid (PATCH) — the DB's
  // enforce_expense_transition trigger + RLS govern every transition. No
  // DELETE: claims are never removed through the UI. Line tables are replaced
  // wholesale while the parent claim is draft/returned (self-or-admin RLS).
  // aa_rate_certificates: per-person AA rates upsert (self-or-admin RLS).
  expense_claims: ['POST', 'PATCH'],
  expense_travel_lines: ['POST', 'PATCH', 'DELETE'],
  expense_other_lines: ['POST', 'PATCH', 'DELETE'],
  expense_advance_lines: ['POST', 'PATCH', 'DELETE'],
  aa_rate_certificates: ['POST', 'PATCH'],
  // WS-5 Certifications: any role adds/edits/removes OWN certs; admin manages
  // anyone's. RLS is the authority (cert_ins/cert_upd/cert_del: self-or-admin;
  // managers get team READ only via cert_sel) — this entry just opens the proxy.
  certifications: ['POST', 'PATCH', 'DELETE'],
  // WS-6 Documents: admin adds document metadata (POST) and replaces or
  // soft-deletes via PATCH (is_active=false — never a hard DELETE, so DELETE is
  // deliberately absent). RLS `doc_admin` restricts all writes to admins.
  documents: ['POST', 'PATCH'],
  // WS-6 Documents: acknowledgement upsert (POST with on_conflict merge). RLS
  // `docack_self` scopes writes to the signed-in employee (or admin).
  document_acknowledgements: ['POST'],
}

/** True when `method` is an allowed write for `table`. */
export function isWriteAllowed(table: string | null, method: string): boolean {
  if (!table) return false
  const allowed = WRITE_ALLOWLIST[table]
  return Array.isArray(allowed) && allowed.includes(method)
}
