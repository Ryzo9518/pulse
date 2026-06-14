// ── Certification status engine ───────────────────────────────────────────────
// One shared, pure source of truth for a credential's status, used by both the
// mock accessor seam and the real Supabase backend so they always agree
// (plan Unit 4; requirements R4, R23). No I/O, no Date.now() — `today` is passed
// in so the function is fully deterministic and testable.

/** The four computed credential statuses (requirement R4). */
export type CertStatus =
  | 'pending_verification'
  | 'active'
  | 'expiring_soon'
  | 'expired'

/** The minimal fields the status calculation needs. Dates are ISO `YYYY-MM-DD`. */
export interface CertStatusInput {
  /** An admin has confirmed the credential + its dates (requirement R5). */
  verified: boolean
  /** Credential never expires (e.g. a lifetime qualification). */
  non_expiring: boolean
  issued_date?: string | null
  expiry_date?: string | null
  /** The date renewal action must START; precedes expiry (requirement R2). */
  renew_by_date?: string | null
}

/**
 * When a renewable credential has no explicit renew-by date, the reminder anchor
 * falls back to `expiry - DEFAULT_RENEW_LEAD_DAYS` so a still-valid credential is
 * never left without a reminder window (requirement R23).
 */
export const DEFAULT_RENEW_LEAD_DAYS = 30

/** ISO `YYYY-MM-DD` for a Date, in UTC. */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Subtract whole days from an ISO `YYYY-MM-DD` date, returning ISO `YYYY-MM-DD`. */
function isoMinusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return toISODate(d)
}

/**
 * The effective renew-by anchor: the explicit renew-by when set, otherwise
 * derived from expiry, otherwise null (non-expiring / no dates).
 */
export function effectiveRenewBy(
  renewBy: string | null | undefined,
  expiry: string | null | undefined,
): string | null {
  if (renewBy) return renewBy
  if (expiry) return isoMinusDays(expiry, DEFAULT_RENEW_LEAD_DAYS)
  return null
}

/**
 * Derive a credential's status from its verification state and dates.
 *
 * Precedence:
 *  1. Unverified uploads are always `pending_verification` (R5).
 *  2. Non-expiring credentials are always `active` (R2).
 *  3. Past the expiry date → `expired`.
 *  4. At/after the (effective) renew-by but still valid by expiry → `expiring_soon`
 *     (this is the "renewal overdue but not yet expired" state — R23).
 *  5. Otherwise → `active`.
 *
 * ISO `YYYY-MM-DD` strings compare correctly lexicographically, so day-level
 * comparisons need no parsing.
 */
export function computeCertStatus(input: CertStatusInput, today: Date): CertStatus {
  if (!input.verified) return 'pending_verification'
  if (input.non_expiring) return 'active'

  const todayISO = toISODate(today)

  if (input.expiry_date && todayISO > input.expiry_date) {
    return 'expired'
  }

  const renewBy = effectiveRenewBy(input.renew_by_date, input.expiry_date)
  if (renewBy && todayISO >= renewBy) {
    return 'expiring_soon'
  }

  return 'active'
}
