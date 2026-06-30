// Server-only. Mints short-lived HS256 JWTs that PostgREST accepts.
//
// SECURITY (POPIA): the signing secret (PULSE_PG_JWT_SECRET — the SAME secret
// PostgREST validates against) must NEVER reach the browser. This module is
// imported only from server code (Auth.js callbacks, server actions, route
// handlers). The minted token carries `role: authenticated` + a `sub` (the
// employee's auth_user_id); PostgREST does `SET ROLE authenticated` and exposes
// the sub as `request.jwt.claims->>'sub'`, which our RLS reads via auth.uid().
import 'server-only'
import { SignJWT } from 'jose'

function secretKey(): Uint8Array {
  const secret = process.env.PULSE_PG_JWT_SECRET
  if (!secret) throw new Error('PULSE_PG_JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

/**
 * Mint an `authenticated`-role PostgREST JWT for `sub`, valid for `ttlSeconds`.
 * Keep TTLs short — these are bearer tokens for the data API.
 */
export async function mintAuthenticatedToken(
  sub: string,
  ttlSeconds = 3600,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(secretKey())
}
