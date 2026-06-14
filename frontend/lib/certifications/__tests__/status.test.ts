import { describe, expect, it } from 'vitest'

import {
  computeCertStatus,
  effectiveRenewBy,
  DEFAULT_RENEW_LEAD_DAYS,
  type CertStatusInput,
} from '../status'

// Fixed "today" so every case is deterministic.
const TODAY = new Date('2026-06-14T00:00:00Z')

/** Convenience: an ISO date `n` days from TODAY (negative = in the past). */
function daysFromToday(n: number): string {
  const d = new Date(TODAY)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** A verified, renewable cert with sensible defaults; override per test. */
function cert(overrides: Partial<CertStatusInput> = {}): CertStatusInput {
  return {
    verified: true,
    non_expiring: false,
    issued_date: daysFromToday(-365),
    expiry_date: daysFromToday(365),
    renew_by_date: daysFromToday(335),
    ...overrides,
  }
}

describe('computeCertStatus', () => {
  it('Happy path: verified cert well before renew-by is active', () => {
    expect(computeCertStatus(cert(), TODAY)).toBe('active')
  })

  it('Edge: unverified upload is pending_verification regardless of dates', () => {
    // Even a long-valid cert is pending until an admin verifies it.
    expect(
      computeCertStatus(cert({ verified: false }), TODAY),
    ).toBe('pending_verification')
    // Even an already-expired-looking cert stays pending if unverified.
    expect(
      computeCertStatus(
        cert({ verified: false, expiry_date: daysFromToday(-10), renew_by_date: daysFromToday(-40) }),
        TODAY,
      ),
    ).toBe('pending_verification')
  })

  it('Edge: non-expiring cert is always active (null expiry / renew-by)', () => {
    expect(
      computeCertStatus(
        cert({ non_expiring: true, expiry_date: null, renew_by_date: null }),
        TODAY,
      ),
    ).toBe('active')
  })

  it('Edge: renew-by reached (but not expiry) is expiring_soon', () => {
    expect(
      computeCertStatus(
        cert({ renew_by_date: daysFromToday(-1), expiry_date: daysFromToday(29) }),
        TODAY,
      ),
    ).toBe('expiring_soon')
  })

  it('Edge: renew-by exactly today is expiring_soon', () => {
    expect(
      computeCertStatus(
        cert({ renew_by_date: daysFromToday(0), expiry_date: daysFromToday(30) }),
        TODAY,
      ),
    ).toBe('expiring_soon')
  })

  it('Edge: expiry passed is expired', () => {
    expect(
      computeCertStatus(
        cert({ renew_by_date: daysFromToday(-40), expiry_date: daysFromToday(-1) }),
        TODAY,
      ),
    ).toBe('expired')
  })

  it('R23: still valid by expiry but renew-by passed is expiring_soon, NOT expired', () => {
    // renew-by long gone, expiry still in the future -> overdue-but-valid.
    expect(
      computeCertStatus(
        cert({ renew_by_date: daysFromToday(-100), expiry_date: daysFromToday(10) }),
        TODAY,
      ),
    ).toBe('expiring_soon')
  })

  it('R23: renew-by missing falls back to expiry minus default lead', () => {
    // No renew-by; expiry is 20 days out, which is inside the derived window
    // (expiry - DEFAULT_RENEW_LEAD_DAYS has already passed) -> expiring_soon.
    expect(
      computeCertStatus(
        cert({ renew_by_date: null, expiry_date: daysFromToday(20) }),
        TODAY,
      ),
    ).toBe('expiring_soon')
    // Same cert but expiry far out -> still active (derived renew-by not reached).
    expect(
      computeCertStatus(
        cert({ renew_by_date: null, expiry_date: daysFromToday(200) }),
        TODAY,
      ),
    ).toBe('active')
  })
})

describe('effectiveRenewBy', () => {
  it('returns the explicit renew-by when present', () => {
    expect(effectiveRenewBy(daysFromToday(10), daysFromToday(40))).toBe(daysFromToday(10))
  })

  it('derives from expiry minus the default lead when renew-by is missing', () => {
    const expiry = daysFromToday(40)
    const expected = daysFromToday(40 - DEFAULT_RENEW_LEAD_DAYS)
    expect(effectiveRenewBy(null, expiry)).toBe(expected)
  })

  it('returns null when neither renew-by nor expiry is set (non-expiring)', () => {
    expect(effectiveRenewBy(null, null)).toBeNull()
  })
})
