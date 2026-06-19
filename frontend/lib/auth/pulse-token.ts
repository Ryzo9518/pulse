// ── PostgREST user-token minting (server-only) ───────────────────────────────
// Mints the short-lived HS256 JWT that the data layer presents to PostgREST.
// PostgREST reads the `role` claim to `SET ROLE`, and `sub` flows into
// `request.jwt.claims` so Postgres `auth.uid()` resolves the signed-in employee
// — making RLS the real authorization boundary (see the auth plan, token chain).
//
// SECURITY (POPIA): the signing secret is the SAME secret PostgREST verifies
// with (~/pulse-db/.jwt_secret on the box). It must NEVER reach the browser —
// only the minted token does. Call this from server code only.

import { SignJWT } from 'jose'

/** The DB role PostgREST switches into for an authenticated request. */
export const POSTGREST_AUTHENTICATED_ROLE = 'authenticated'

/** Default token lifetime: 1 hour. */
export const DEFAULT_TTL_SECONDS = 60 * 60

export interface MintPulseTokenOptions {
  /**
   * The employee's `auth_user_id` (the Entra `oid` after first-login relink).
   * Becomes the JWT `sub`, which `auth.uid()` reads.
   */
  authUserId: string
  /** The shared HS256 secret PostgREST verifies with. Server env only. */
  secret: string
  /** Token lifetime in seconds. Defaults to {@link DEFAULT_TTL_SECONDS}. */
  ttlSeconds?: number
  /** Epoch-seconds override for `iat`/`exp`. Defaults to the current time. */
  nowSeconds?: number
}

/**
 * Mint a short-lived PostgREST access token for the given employee.
 * Returns a signed compact JWT string.
 */
export async function mintPulseToken(options: MintPulseTokenOptions): Promise<string> {
  const { authUserId, secret, ttlSeconds = DEFAULT_TTL_SECONDS } = options
  if (!authUserId) throw new Error('mintPulseToken: authUserId is required')
  if (!secret) throw new Error('mintPulseToken: secret is required')

  const iat = options.nowSeconds ?? Math.floor(Date.now() / 1000)
  const key = new TextEncoder().encode(secret)

  return new SignJWT({ role: POSTGREST_AUTHENTICATED_ROLE })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(authUserId)
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttlSeconds)
    .sign(key)
}
