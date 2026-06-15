import { afterEach, describe, expect, it } from 'vitest'

import {
  certExpiryInfo,
  listCertifications,
  saveCertification,
  needsRecert,
  sortCertsByUrgency,
  __resetMockState,
} from '@/lib/mock'
import { certifications as seedCerts } from '@/lib/mock/certifications'
import type { Certification } from '@/types/database'

// Fixed reference date so the 60-day window is deterministic.
const REF = new Date('2026-06-15T00:00:00.000Z')

afterEach(() => {
  __resetMockState()
})

function cert(expiry: string | null, cclass: Certification['cclass'] = 'product'): Certification {
  return {
    id: 'x',
    employee_id: 'emp-001',
    cclass,
    vendor: cclass === 'product' ? 'Sage' : null,
    product: cclass === 'product' ? 'Sage X3' : null,
    name: 'Test',
    nqf_level: cclass === 'graduate' ? 'NQF 7 — Bachelor / Adv Diploma' : null,
    issued: '2024-01-01',
    expiry,
    file_ref: 'x.pdf',
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

// ── Expiry classification (business rule, HANDOFF §3) ─────────────────────────

describe('certExpiryInfo — 60-day expiry classification', () => {
  it('classifies a past date as expired (red)', () => {
    const info = certExpiryInfo('2026-05-20', REF)
    expect(info.state).toBe('expired')
    expect(info.days).toBeLessThan(0)
    expect(info.label).toContain('Expired')
  })

  it('classifies a date within 60 days as expiring soon (amber)', () => {
    // 30 Jun 2026 is 15 days out → within the 60-day amber window.
    const info = certExpiryInfo('2026-06-30', REF)
    expect(info.state).toBe('soon')
    expect(info.days).toBe(15)
    expect(info.label).toContain('Expires')
  })

  it('treats exactly 60 days out as still amber (inclusive boundary)', () => {
    expect(certExpiryInfo('2026-08-14', REF).state).toBe('soon') // 60 days
    expect(certExpiryInfo('2026-08-15', REF).state).toBe('valid') // 61 days
  })

  it('classifies a far-future date as valid (green)', () => {
    const info = certExpiryInfo('2027-08-01', REF)
    expect(info.state).toBe('valid')
    expect(info.label).toContain('Valid to')
  })

  it('classifies a missing expiry as no-expiry (none)', () => {
    const info = certExpiryInfo(null, REF)
    expect(info.state).toBe('none')
    expect(info.days).toBeNull()
    expect(info.label).toBe('No expiry')
  })
})

describe('needsRecert', () => {
  it('flags expiring or expired product certs only', () => {
    expect(needsRecert(cert('2026-05-20'), REF)).toBe(true) // expired
    expect(needsRecert(cert('2026-06-30'), REF)).toBe(true) // soon
    expect(needsRecert(cert('2027-08-01'), REF)).toBe(false) // valid
    expect(needsRecert(cert(null), REF)).toBe(false) // no expiry
    // A qualification is never a recert candidate, even with an expiry value.
    expect(needsRecert(cert('2026-05-20', 'graduate'), REF)).toBe(false)
  })
})

describe('sortCertsByUrgency — expired → soon → valid → none', () => {
  it('orders by expiry urgency', () => {
    const list = [cert(null), cert('2027-08-01'), cert('2026-05-20'), cert('2026-06-30')]
    const sorted = sortCertsByUrgency(list, REF).map((c) => certExpiryInfo(c.expiry, REF).state)
    expect(sorted).toEqual(['expired', 'soon', 'valid', 'none'])
  })
})

// ── Role-scoped visibility (HANDOFF §2) ───────────────────────────────────────

describe('listCertifications — role-scoped visibility', () => {
  it('employee sees only their own certs', () => {
    // emp-006 (Thandiwe) owns three seeded certs.
    const own = listCertifications('employee', 'emp-006')
    expect(own.length).toBeGreaterThan(0)
    expect(own.every((c) => c.employee_id === 'emp-006')).toBe(true)
    // An employee with no certs sees an empty list, never anyone else's.
    expect(listCertifications('employee', 'emp-008')).toEqual([])
  })

  it('admin sees all certs', () => {
    const all = listCertifications('admin', 'emp-001')
    expect(all.length).toBe(seedCerts.length)
  })

  it('manager sees their team’s certs (by manager_id), not their own / others', () => {
    // emp-006 (Thandiwe) manages emp-007 (Pieter), who owns certs c5 + c6.
    const team = listCertifications('manager', 'emp-006', 'emp-006')
    expect(team.length).toBeGreaterThan(0)
    expect(team.every((c) => c.employee_id === 'emp-007')).toBe(true)
    // Thandiwe's own certs are NOT in the manager scope (she is not her own report).
    expect(team.some((c) => c.employee_id === 'emp-006')).toBe(false)
  })

  it('manager with no managerId sees nothing (never widens scope)', () => {
    expect(listCertifications('manager', 'emp-006', '')).toEqual([])
  })
})

// ── Mutation through the seam ──────────────────────────────────────────────────

describe('saveCertification', () => {
  it('creates a product cert and normalises qualification-only fields away', () => {
    const created = saveCertification({
      employee_id: 'emp-001',
      cclass: 'product',
      vendor: 'Sage',
      product: 'Sage Intacct',
      name: 'Sage Intacct Implementation Specialist',
      nqf_level: 'NQF 7 — Bachelor / Adv Diploma', // should be dropped for product
      expiry: '2027-01-01',
    })
    expect(created.nqf_level).toBeNull()
    expect(created.vendor).toBe('Sage')
    expect(created.expiry).toBe('2027-01-01')
    expect(created.file_ref).toMatch(/\.pdf$/)
    expect(listCertifications('admin', 'emp-001')).toContainEqual(created)
  })

  it('rejects a save with no name', () => {
    expect(() =>
      saveCertification({ employee_id: 'emp-001', cclass: 'product', name: '   ' }),
    ).toThrow(/name/i)
  })

  it('edits an existing cert in place', () => {
    const id = seedCerts[0].id
    const updated = saveCertification(
      { employee_id: seedCerts[0].employee_id, cclass: 'product', name: 'Renamed Cert', vendor: 'Sage', product: 'Sage X3' },
      id,
    )
    expect(updated.id).toBe(id)
    expect(updated.name).toBe('Renamed Cert')
  })
})
