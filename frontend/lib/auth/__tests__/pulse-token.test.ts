// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { jwtVerify, decodeProtectedHeader } from 'jose'

const SECRET = 'unit-test-secret-please-ignore-1234567890'

beforeAll(() => {
  process.env.PULSE_PG_JWT_SECRET = SECRET
})

async function mint() {
  // Imported lazily so the env var is set before the module reads it.
  const { mintAuthenticatedToken } = await import('../pulse-token')
  return mintAuthenticatedToken
}

describe('mintAuthenticatedToken', () => {
  it('signs an HS256 token PostgREST will accept', async () => {
    const mintAuthenticatedToken = await mint()
    const sub = '00000000-0000-0000-0000-000000000001'
    const token = await mintAuthenticatedToken(sub, 3600)

    expect(decodeProtectedHeader(token).alg).toBe('HS256')

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET),
    )
    expect(payload.sub).toBe(sub)
    expect(payload.role).toBe('authenticated')
    expect(typeof payload.exp).toBe('number')
    const now = Math.floor(Date.now() / 1000)
    expect(payload.exp! - now).toBeGreaterThan(3500)
    expect(payload.exp! - now).toBeLessThanOrEqual(3600)
  })

  it('rejects verification under the wrong secret', async () => {
    const mintAuthenticatedToken = await mint()
    const token = await mintAuthenticatedToken('x', 60)
    await expect(
      jwtVerify(token, new TextEncoder().encode('a-different-secret')),
    ).rejects.toThrow()
  })

  it('throws when the signing secret is absent', async () => {
    const prev = process.env.PULSE_PG_JWT_SECRET
    delete process.env.PULSE_PG_JWT_SECRET
    const mintAuthenticatedToken = await mint()
    await expect(mintAuthenticatedToken('x', 60)).rejects.toThrow(
      /PULSE_PG_JWT_SECRET/,
    )
    process.env.PULSE_PG_JWT_SECRET = prev
  })
})
