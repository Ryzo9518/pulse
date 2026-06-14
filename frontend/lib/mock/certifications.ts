// ── Certification registry seed data ──────────────────────────────────────────
// Mock credentials across the three families and every status, so the registry
// screens can be built and reviewed before the real Supabase backend is wired.
// Dates are relative to "now" so statuses stay representative over time; the
// accessor layer recomputes each row's status via computeCertStatus on read.

import type { Certification, CertificationEvent } from '@/types/database'

/** ISO YYYY-MM-DD `n` days from today (negative = past). */
function isoFromToday(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const NOW_ISO = new Date().toISOString()

export const certifications: Certification[] = [
  // emp-006 Thandiwe — a current Sage cert (active) + a lapsing ACCA (expiring_soon)
  {
    id: 'cert-001',
    employee_id: 'emp-006',
    family: 'sage',
    lifecycle_kind: 'renewable',
    name: 'Sage Intacct Implementation Specialist',
    issuing_body: 'Sage',
    issued_date: isoFromToday(-65),
    expiry_date: isoFromToday(300),
    renew_by_date: isoFromToday(270),
    non_expiring: false,
    status: 'active',
    proof_path: 'certifications/emp-006/intacct-impl.pdf',
    reminders_baseline_at: NOW_ISO,
    verified_by: 'emp-001',
    verified_at: isoFromToday(-60),
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  {
    id: 'cert-002',
    employee_id: 'emp-006',
    family: 'professional',
    lifecycle_kind: 'renewable',
    name: 'ACCA Membership',
    issuing_body: 'ACCA',
    issued_date: isoFromToday(-700),
    expiry_date: isoFromToday(25),
    renew_by_date: isoFromToday(-5),
    non_expiring: false,
    status: 'expiring_soon',
    proof_path: 'certifications/emp-006/acca.pdf',
    reminders_baseline_at: NOW_ISO,
    verified_by: 'emp-001',
    verified_at: isoFromToday(-365),
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  // emp-007 Pieter — a lapsed Sage X3 cert (expired)
  {
    id: 'cert-003',
    employee_id: 'emp-007',
    family: 'sage',
    lifecycle_kind: 'renewable',
    name: 'Sage X3 Financials Consultant',
    issuing_body: 'Sage',
    issued_date: isoFromToday(-760),
    expiry_date: isoFromToday(-12),
    renew_by_date: isoFromToday(-42),
    non_expiring: false,
    status: 'expired',
    proof_path: 'certifications/emp-007/x3-financials.pdf',
    reminders_baseline_at: NOW_ISO,
    verified_by: 'emp-001',
    verified_at: isoFromToday(-400),
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  // emp-009 Lerato — a non-expiring vendor cert (active forever)
  {
    id: 'cert-004',
    employee_id: 'emp-009',
    family: 'vendor',
    lifecycle_kind: 'one_time',
    name: 'Microsoft Certified: Azure Fundamentals',
    issuing_body: 'Microsoft',
    issued_date: isoFromToday(-120),
    expiry_date: null,
    renew_by_date: null,
    non_expiring: true,
    status: 'active',
    proof_path: 'certifications/emp-009/azure-fundamentals.pdf',
    reminders_baseline_at: NOW_ISO,
    verified_by: 'emp-001',
    verified_at: isoFromToday(-115),
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  // emp-010 Daniel — a freshly uploaded cert awaiting admin verification
  {
    id: 'cert-005',
    employee_id: 'emp-010',
    family: 'sage',
    lifecycle_kind: 'renewable',
    name: 'Sage Intacct Implementation Specialist',
    issuing_body: 'Sage',
    issued_date: isoFromToday(-3),
    expiry_date: isoFromToday(362),
    renew_by_date: isoFromToday(332),
    non_expiring: false,
    status: 'pending_verification',
    proof_path: 'certifications/emp-010/intacct-impl.pdf',
    reminders_baseline_at: NOW_ISO,
    verified_by: null,
    verified_at: null,
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
  // emp-011 Naledi — a current professional qualification (active)
  {
    id: 'cert-006',
    employee_id: 'emp-011',
    family: 'professional',
    lifecycle_kind: 'renewable',
    name: 'CIMA Associate (ACMA)',
    issuing_body: 'CIMA',
    issued_date: isoFromToday(-300),
    expiry_date: isoFromToday(200),
    renew_by_date: isoFromToday(170),
    non_expiring: false,
    status: 'active',
    proof_path: 'certifications/emp-011/cima.pdf',
    reminders_baseline_at: NOW_ISO,
    verified_by: 'emp-001',
    verified_at: isoFromToday(-295),
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
  },
]

/** A couple of seeded audit-log entries (the mock mirror of certification_events). */
export const certificationEvents: CertificationEvent[] = [
  {
    id: 'cert-evt-001',
    certification_id: 'cert-001',
    event_type: 'created',
    actor_id: 'emp-006',
    detail: { source: 'upload' },
    created_at: NOW_ISO,
  },
  {
    id: 'cert-evt-002',
    certification_id: 'cert-001',
    event_type: 'verified',
    actor_id: 'emp-001',
    detail: { provenance: 'admin' },
    created_at: NOW_ISO,
  },
  {
    id: 'cert-evt-003',
    certification_id: 'cert-005',
    event_type: 'created',
    actor_id: 'emp-010',
    detail: { source: 'upload' },
    created_at: NOW_ISO,
  },
]

/** Family display labels for the UI. */
export const CERT_FAMILY_LABELS: Record<Certification['family'], string> = {
  sage: 'Sage Product',
  professional: 'Professional Qualification',
  vendor: 'Vendor / Tech',
}
