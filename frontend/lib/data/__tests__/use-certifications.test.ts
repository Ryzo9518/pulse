// WS-5 Certifications live data layer — unit tests for the pure request/payload
// helpers behind useCertifications. The payload rules mirror the DB
// `cert_class_fields` check constraint (001_schema.sql): product certs carry
// vendor/product/expiry and NO nqf_level; qualifications carry nqf_level and NO
// vendor/product/expiry — a payload that violates this would 400 at PostgREST.
import { describe, it, expect } from 'vitest'

import {
  certWritePlan,
  normalizeCertInput,
} from '../useCertifications'
import type { CertificationInput } from '@/lib/mock'

function draft(overrides: Partial<CertificationInput> = {}): CertificationInput {
  return {
    employee_id: 'a2b6e9a4-0000-0000-0000-000000000001',
    cclass: 'product',
    vendor: 'Sage',
    product: 'Sage X3',
    name: 'Sage X3 Implementation Consultant',
    nqf_level: 'NQF 7 — Bachelor / Adv Diploma', // stale editor value — must be dropped
    issued: '2025-09-12',
    expiry: '2026-09-12',
    file_ref: 'Sage_X3_Cert.pdf',
    ...overrides,
  }
}

describe('normalizeCertInput — cert_class_fields constraint parity', () => {
  it('product cert keeps vendor/product/expiry and drops nqf_level', () => {
    const p = normalizeCertInput(draft())
    expect(p).not.toBeNull()
    expect(p).toMatchObject({
      cclass: 'product',
      vendor: 'Sage',
      product: 'Sage X3',
      expiry: '2026-09-12',
      nqf_level: null,
    })
  })

  it('qualification keeps nqf_level and drops vendor/product/expiry', () => {
    const p = normalizeCertInput(
      draft({ cclass: 'graduate', name: 'BCom Information Systems' }),
    )
    expect(p).toMatchObject({
      cclass: 'graduate',
      vendor: null,
      product: null,
      expiry: null,
      nqf_level: 'NQF 7 — Bachelor / Adv Diploma',
    })
  })

  it('trims the name and nulls blank optional fields', () => {
    const p = normalizeCertInput(
      draft({ name: '  AZ-900  ', issued: '', expiry: '', file_ref: '  ' }),
    )
    expect(p).toMatchObject({
      name: 'AZ-900',
      issued: null,
      expiry: null,
      file_ref: null,
    })
  })

  it('rejects a draft with no name or no person', () => {
    expect(normalizeCertInput(draft({ name: '   ' }))).toBeNull()
    expect(normalizeCertInput(draft({ employee_id: '' }))).toBeNull()
  })
})

describe('certWritePlan — proxy request shape', () => {
  it('plans a POST to /api/rest/certifications for a new cert', () => {
    const plan = certWritePlan(draft())
    expect(plan).not.toBeNull()
    expect(plan?.method).toBe('POST')
    expect(plan?.path).toBe('/api/rest/certifications')
    expect(plan?.payload.employee_id).toBe(
      'a2b6e9a4-0000-0000-0000-000000000001',
    )
  })

  it('plans a PATCH filtered to the row id for an edit', () => {
    const plan = certWritePlan(draft(), 'row-1')
    expect(plan?.method).toBe('PATCH')
    expect(plan?.path).toBe('/api/rest/certifications?id=eq.row-1')
  })

  it('returns null for an invalid draft (caller validates first)', () => {
    expect(certWritePlan(draft({ name: '' }))).toBeNull()
  })
})
