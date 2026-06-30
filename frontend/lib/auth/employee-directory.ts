// Server-only. Resolves a Microsoft-authenticated user to their Pulse employee
// record, used by the Auth.js sign-in gate.
//
// We do NOT use a service_role / RLS-bypass token here: the `employees` work
// directory is readable by ANY authenticated caller (RLS policy emp_select is
// `to authenticated using (true)`), so a short-lived authenticated token with a
// system subject is sufficient and strictly least-privilege — it can read the
// directory but never payroll/POPIA satellites.
import 'server-only'
import { mintAuthenticatedToken } from './pulse-token'

// Sub used only for the directory lookup. emp_select ignores the sub
// (using(true)), so this never grants access to anyone's scoped data.
const SYSTEM_SUB = '00000000-0000-0000-0000-000000000000'

export interface DirectoryEmployee {
  id: string
  auth_user_id: string | null
  role: string
  display_name: string
  email: string
}

/**
 * Look up an employee by email (case-insensitive). Returns null when no Pulse
 * employee owns that address — the caller treats that as "deny sign-in".
 */
export async function resolveEmployeeByEmail(
  rawEmail: string,
): Promise<DirectoryEmployee | null> {
  const email = rawEmail.trim().toLowerCase()
  if (!email) return null

  const base = process.env.PULSE_POSTGREST_URL
  if (!base) throw new Error('PULSE_POSTGREST_URL is not set')

  const token = await mintAuthenticatedToken(SYSTEM_SUB, 60)
  const url =
    `${base.replace(/\/$/, '')}/employees` +
    `?select=id,auth_user_id,role,display_name,email` +
    `&email=eq.${encodeURIComponent(email)}&limit=1`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`employee directory lookup failed: ${res.status}`)
  }
  const rows = (await res.json()) as DirectoryEmployee[]
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}
