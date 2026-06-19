// ── Employee resolution + first-login relink (server-only) ───────────────────
// Bridges a Microsoft Entra identity to a Pulse `employees` row.
//
// We do NOT auto-provision: an Entra user who matches no employee is denied.
// On the first successful sign-in we relink the row's `auth_user_id` to the
// Entra `oid`, so `auth.uid()` (which reads the minted JWT `sub` = oid)
// resolves the right row on every subsequent request. (Seeded `auth_user_id`
// values are dev placeholders equal to the row id; relink migrates each person
// exactly once — see the auth plan §3.)
//
// All calls go through PostgREST with the service-role JWT. This module is
// server-only; the service JWT must never reach the browser. `fetchFn` is
// injectable so the resolution logic is unit-testable without a live API.

export type EmployeeRole = 'employee' | 'manager' | 'admin'

export interface ResolvedEmployee {
  id: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  role: EmployeeRole
  is_owner: boolean
  auth_user_id: string | null
}

export interface ResolutionDeps {
  /** PostgREST base URL, e.g. http://127.0.0.1:3001 */
  postgrestUrl: string
  /** Service-role JWT (server-only) used for the lookup + relink writes. */
  serviceJwt: string
  /** Injectable fetch (defaults to global fetch) for testability. */
  fetchFn?: typeof fetch
}

const EMPLOYEE_COLUMNS =
  'id,email,first_name,last_name,display_name,role,is_owner,auth_user_id'

function authHeaders(serviceJwt: string): Record<string, string> {
  return {
    Authorization: `Bearer ${serviceJwt}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Look up an employee by email (case-insensitive). Returns the row or null.
 */
export async function resolveEmployeeByEmail(
  email: string,
  deps: ResolutionDeps,
): Promise<ResolvedEmployee | null> {
  const fetchFn = deps.fetchFn ?? fetch
  const normalized = email.trim().toLowerCase()
  const url =
    `${deps.postgrestUrl}/employees` +
    `?email=ilike.${encodeURIComponent(normalized)}` +
    `&select=${EMPLOYEE_COLUMNS}&limit=1`

  const res = await fetchFn(url, { headers: authHeaders(deps.serviceJwt) })
  if (!res.ok) {
    throw new Error(`employee lookup failed: ${res.status} ${await safeText(res)}`)
  }
  const rows = (await res.json()) as ResolvedEmployee[]
  return rows.length > 0 ? rows[0] : null
}

/**
 * Set an employee's `auth_user_id` to the given Entra oid. No-op upstream is
 * avoided by the caller; this always issues the PATCH when invoked.
 */
export async function relinkAuthUserId(
  employeeId: string,
  oid: string,
  deps: ResolutionDeps,
): Promise<void> {
  const fetchFn = deps.fetchFn ?? fetch
  const url = `${deps.postgrestUrl}/employees?id=eq.${encodeURIComponent(employeeId)}`
  const res = await fetchFn(url, {
    method: 'PATCH',
    headers: { ...authHeaders(deps.serviceJwt), Prefer: 'return=minimal' },
    body: JSON.stringify({ auth_user_id: oid }),
  })
  if (!res.ok) {
    throw new Error(`relink failed: ${res.status} ${await safeText(res)}`)
  }
}

/**
 * Resolve the employee for a signing-in Entra user and ensure the row's
 * `auth_user_id` equals the Entra `oid`. Throws if no employee matches (deny).
 * Returns the employee with `auth_user_id` set to `oid`.
 */
export async function resolveSignInEmployee(
  params: { email: string; oid: string },
  deps: ResolutionDeps,
): Promise<ResolvedEmployee> {
  const employee = await resolveEmployeeByEmail(params.email, deps)
  if (!employee) {
    throw new EmployeeNotFoundError(params.email)
  }
  if (employee.auth_user_id !== params.oid) {
    await relinkAuthUserId(employee.id, params.oid, deps)
  }
  return { ...employee, auth_user_id: params.oid }
}

/** Thrown when an authenticated Entra user matches no employee row. */
export class EmployeeNotFoundError extends Error {
  constructor(email: string) {
    super(`No Pulse employee found for ${email}`)
    this.name = 'EmployeeNotFoundError'
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text()
  } catch {
    return '<no body>'
  }
}
