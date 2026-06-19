import { describe, it, expect, vi } from 'vitest'

import {
  resolveEmployeeByEmail,
  resolveSignInEmployee,
  EmployeeNotFoundError,
  type ResolvedEmployee,
} from '../employee-resolution'

const DEPS_BASE = { postgrestUrl: 'http://127.0.0.1:3001', serviceJwt: 'svc-jwt' }

const RYAN: ResolvedEmployee = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'ryan@jera.co.za',
  first_name: 'Ryan',
  last_name: 'de Kock',
  display_name: 'Ryan de Kock',
  role: 'admin',
  is_owner: true,
  auth_user_id: '00000000-0000-0000-0000-000000000001', // dev placeholder == row id
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response
}

describe('resolveEmployeeByEmail', () => {
  it('returns the row and queries case-insensitively by email', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([RYAN]))
    const emp = await resolveEmployeeByEmail('Ryan@Jera.co.za', { ...DEPS_BASE, fetchFn })
    expect(emp).toEqual(RYAN)
    const calledUrl = fetchFn.mock.calls[0][0] as string
    expect(calledUrl).toContain('email=ilike.ryan%40jera.co.za')
    expect(calledUrl).toContain('limit=1')
    // service JWT is sent
    expect((fetchFn.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer svc-jwt',
    })
  })

  it('returns null when no employee matches', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([]))
    const emp = await resolveEmployeeByEmail('stranger@jera.co.za', { ...DEPS_BASE, fetchFn })
    expect(emp).toBeNull()
  })

  it('throws when PostgREST returns an error status', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ message: 'boom' }, false, 500))
    await expect(
      resolveEmployeeByEmail('ryan@jera.co.za', { ...DEPS_BASE, fetchFn }),
    ).rejects.toThrow(/employee lookup failed: 500/)
  })
})

describe('resolveSignInEmployee', () => {
  it('relinks auth_user_id to the Entra oid when it differs, returns updated employee', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([RYAN])) // lookup
      .mockResolvedValueOnce(jsonResponse(null)) // PATCH relink
    const emp = await resolveSignInEmployee(
      { email: 'ryan@jera.co.za', oid: 'entra-oid-xyz' },
      { ...DEPS_BASE, fetchFn },
    )
    expect(emp.auth_user_id).toBe('entra-oid-xyz')
    // second call is the PATCH relink
    expect(fetchFn).toHaveBeenCalledTimes(2)
    const patchInit = fetchFn.mock.calls[1][1] as RequestInit
    expect(patchInit.method).toBe('PATCH')
    expect(patchInit.body).toContain('entra-oid-xyz')
  })

  it('skips the relink when auth_user_id already equals the oid', async () => {
    const linked = { ...RYAN, auth_user_id: 'entra-oid-xyz' }
    const fetchFn = vi.fn().mockResolvedValueOnce(jsonResponse([linked]))
    const emp = await resolveSignInEmployee(
      { email: 'ryan@jera.co.za', oid: 'entra-oid-xyz' },
      { ...DEPS_BASE, fetchFn },
    )
    expect(emp.auth_user_id).toBe('entra-oid-xyz')
    expect(fetchFn).toHaveBeenCalledTimes(1) // no PATCH
  })

  it('denies (throws EmployeeNotFoundError) when no employee matches', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([]))
    await expect(
      resolveSignInEmployee({ email: 'stranger@jera.co.za', oid: 'oid' }, { ...DEPS_BASE, fetchFn }),
    ).rejects.toBeInstanceOf(EmployeeNotFoundError)
  })
})
