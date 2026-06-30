// @vitest-environment node
// jose uses Web Crypto and checks `instanceof Uint8Array`; jsdom's cross-realm
// typed arrays fail that check. This module only ever runs server-side (Node),
// so test it in the Node environment where it actually executes.
import { describe, it, expect } from 'vitest'
import { jwtVerify } from 'jose'

import { mintPulseToken, POSTGREST_AUTHENTICATED_ROLE } from '../pulse-token'

const SECRET = 'test-shared-postgrest-secret-at-least-32-bytes-long'

async function verify(token: string, atSeconds: number) {
  // Tokens are minted with a fixed `nowSeconds`, so verify relative to that
  // instant rather than the real wall clock (which would see them as expired).
  const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET), {
    currentDate: new Date(atSeconds * 1000),
  })
  return payload
}

describe('mintPulseToken', () => {
  it('mints a verifiable HS256 token with sub + authenticated role', async () => {
    const token = await mintPulseToken({
      authUserId: 'oid-abc-123',
      secret: SECRET,
      nowSeconds: 1_000,
    })
    const payload = await verify(token, 1_000)
    expect(payload.sub).toBe('oid-abc-123')
    expect(payload.role).toBe(POSTGREST_AUTHENTICATED_ROLE)
    expect(payload.iat).toBe(1_000)
    expect(payload.exp).toBe(1_000 + 3_600)
  })

  it('honours a custom ttl', async () => {
    const token = await mintPulseToken({
      authUserId: 'oid-1',
      secret: SECRET,
      ttlSeconds: 120,
      nowSeconds: 5_000,
    })
    const payload = await verify(token, 5_000)
    expect(payload.exp).toBe(5_120)
  })

  it('fails verification against a different secret', async () => {
    const token = await mintPulseToken({ authUserId: 'oid-1', secret: SECRET })
    await expect(
      jwtVerify(token, new TextEncoder().encode('a-totally-different-secret-value')),
    ).rejects.toThrow()
  })

  it('throws when authUserId or secret is missing', async () => {
    await expect(mintPulseToken({ authUserId: '', secret: SECRET })).rejects.toThrow(/authUserId/)
    await expect(mintPulseToken({ authUserId: 'x', secret: '' })).rejects.toThrow(/secret/)
  })
})
