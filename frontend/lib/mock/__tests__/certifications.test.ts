import { beforeEach, describe, expect, it } from 'vitest'

import {
  __resetMockState,
  addCertificationUpload,
  getCertification,
  getCertificationsForEmployee,
  listAllCertifications,
  listCertificationEvents,
  listPendingCertifications,
  rejectCertification,
  setTrainingMilestone,
  verifyCertification,
} from '../index'

beforeEach(() => {
  __resetMockState()
})

describe('certification reads', () => {
  it('lists all seeded certifications with freshly computed status', () => {
    const all = listAllCertifications()
    const byId = (id: string) => all.find((c) => c.id === id)
    expect(byId('cert-001')?.status).toBe('active')
    expect(byId('cert-002')?.status).toBe('expiring_soon')
    expect(byId('cert-003')?.status).toBe('expired')
    expect(byId('cert-004')?.status).toBe('active') // non-expiring
    expect(byId('cert-005')?.status).toBe('pending_verification')
    expect(byId('cert-006')?.status).toBe('active')
  })

  it('returns only the requested employee’s certifications (R18)', () => {
    const mine = getCertificationsForEmployee('emp-006')
    expect(mine.length).toBe(2)
    expect(mine.every((c) => c.employee_id === 'emp-006')).toBe(true)
  })

  it('verification queue lists only unverified uploads', () => {
    const pending = listPendingCertifications()
    expect(pending.map((c) => c.id)).toEqual(['cert-005'])
  })
})

describe('addCertificationUpload', () => {
  it('creates a pending credential and a created event (R5)', () => {
    const before = listAllCertifications().length
    const cert = addCertificationUpload({
      employee_id: 'emp-007',
      family: 'vendor',
      name: 'AWS Certified Cloud Practitioner',
      issuing_body: 'AWS',
      expiry_date: '2027-01-01',
      proof_path: 'certifications/emp-007/aws.pdf',
    })
    expect(cert.status).toBe('pending_verification')
    expect(listAllCertifications().length).toBe(before + 1)
    const events = listCertificationEvents(cert.id)
    expect(events.some((e) => e.event_type === 'created' && e.detail?.source === 'upload')).toBe(true)
  })
})

describe('verifyCertification', () => {
  it('flips a pending upload off pending and logs a verified event', () => {
    const verified = verifyCertification(
      'cert-005',
      { expiry_date: '2027-06-01', renew_by_date: '2027-05-01' },
      'emp-001',
    )
    expect(verified.status).not.toBe('pending_verification')
    expect(verified.verified_by).toBe('emp-001')
    expect(verified.verified_at).not.toBeNull()
    const events = listCertificationEvents('cert-005')
    expect(events.some((e) => e.event_type === 'verified')).toBe(true)
  })

  it('throws on an unknown certification id', () => {
    expect(() => verifyCertification('nope', {}, 'emp-001')).toThrow()
  })
})

describe('rejectCertification', () => {
  it('removes the pending row and records a rejected event', () => {
    rejectCertification('cert-005', 'emp-001', 'Illegible scan')
    expect(getCertification('cert-005')).toBeUndefined()
    // The append-only event survives the row removal.
    const events = listCertificationEvents('cert-005')
    expect(events.some((e) => e.event_type === 'rejected')).toBe(true)
  })
})

describe('training completion -> registry (R11)', () => {
  it('creates exactly one pending Sage cert when training is certified, no duplicate on repeat', () => {
    const before = getCertificationsForEmployee('emp-008').length
    setTrainingMilestone('emp-008', 'certified', true)
    const after1 = getCertificationsForEmployee('emp-008')
    expect(after1.length).toBe(before + 1)
    const created = after1.find((c) => c.family === 'sage')
    expect(created?.status).toBe('pending_verification')

    // Toggling certified again must not create a second entry.
    setTrainingMilestone('emp-008', 'certified', false)
    setTrainingMilestone('emp-008', 'certified', true)
    expect(getCertificationsForEmployee('emp-008').length).toBe(before + 1)
  })
})
