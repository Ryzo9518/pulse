// Mock certifications seed data — conforms to Certification in types/database.ts.
// Powers the Certifications module (product + qualification certs with expiry
// tracking and org→product tender filters). Mirrors SEED_CERTS, ORG_PRODUCTS,
// CERT_VENDORS and NQF_LEVELS in docs/prototype/Pulse.dc.html.
//
// Per the frontend-first phase this is in-memory mock data only. Certificates are
// keyed to employees by employee_id (the prototype keyed by display name).

import type {
  Certification,
  CertExpiryInfo,
  CertExpiryState,
  CertVendor,
} from '@/types/database'

const NOW = '2026-06-13T08:00:00.000Z'

// ── Taxonomy ──────────────────────────────────────────────────────────────────

/** Certifying organisations / vendors offered in the upload editor. */
export const CERT_VENDORS: readonly CertVendor[] = [
  'Sage',
  'Nectari',
  'Microsoft',
  'Yooz',
  'AWS',
  'Other',
]

/** NQF levels for qualification (graduate) certs. */
export const NQF_LEVELS: readonly string[] = [
  'NQF 4 — National Certificate',
  'NQF 5 — Higher Certificate',
  'NQF 6 — Diploma',
  'NQF 7 — Bachelor / Adv Diploma',
  'NQF 8 — Honours / PG Dip',
  'NQF 9 — Master’s',
  'NQF 10 — Doctorate',
]

/** Organisation → products taxonomy for cert classification + tender filters. */
export const ORG_PRODUCTS: Record<CertVendor, readonly string[]> = {
  Sage: [
    'Sage Intacct',
    'Sage X3',
    'Sage 300 People',
    'Sage 200 Evolution',
    'Sage Business Cloud Accounting',
    'Sage Payroll Advanced',
  ],
  Microsoft: ['Microsoft Azure', 'Microsoft 365', 'Dynamics 365', 'Power Platform'],
  Nectari: ['Nectari BI'],
  Yooz: ['Yooz AP Automation'],
  AWS: ['AWS Cloud'],
  Other: ['Other'],
}

/** Products available for a chosen organisation (cascading filter / editor). */
export function productsForOrg(org: CertVendor | string): readonly string[] {
  return ORG_PRODUCTS[org as CertVendor] ?? []
}

// ── Seed certificates (keyed to employee_id) ──────────────────────────────────
// emp-010 = Daniel Pretorius, emp-006 = Thandiwe Nkosi, emp-007 = Pieter Botha,
// emp-009 = Lerato Khumalo.
export const certifications: Certification[] = [
  {
    id: 'c1',
    employee_id: 'emp-010',
    cclass: 'product',
    vendor: 'Sage',
    product: 'Sage X3',
    name: 'Sage X3 Implementation Consultant',
    nqf_level: null,
    issued: '2025-09-12',
    expiry: '2026-09-12',
    file_ref: 'Sage_X3_Cert.pdf',
    created_at: NOW,
  },
  {
    id: 'c2',
    employee_id: 'emp-010',
    cclass: 'product',
    vendor: 'Microsoft',
    product: 'Microsoft Azure',
    name: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
    nqf_level: null,
    issued: '2024-03-04',
    expiry: null,
    file_ref: 'AZ-900.pdf',
    created_at: NOW,
  },
  {
    id: 'c3',
    employee_id: 'emp-006',
    cclass: 'product',
    vendor: 'Sage',
    product: 'Sage X3',
    name: 'Sage X3 Finance Consultant',
    nqf_level: null,
    issued: '2024-05-20',
    expiry: '2026-05-20',
    file_ref: 'Sage_X3_Finance.pdf',
    created_at: NOW,
  },
  {
    id: 'c4',
    employee_id: 'emp-006',
    cclass: 'product',
    vendor: 'Nectari',
    product: 'Nectari BI',
    name: 'Nectari BI Certified Consultant',
    nqf_level: null,
    issued: '2025-02-11',
    expiry: '2026-07-30',
    file_ref: 'Nectari_BI.pdf',
    created_at: NOW,
  },
  {
    id: 'c5',
    employee_id: 'emp-007',
    cclass: 'product',
    vendor: 'Sage',
    product: 'Sage 300 People',
    name: 'Sage 300 People Certified',
    nqf_level: null,
    issued: '2025-08-01',
    expiry: '2027-08-01',
    file_ref: 'Sage300People.pdf',
    created_at: NOW,
  },
  {
    id: 'c6',
    employee_id: 'emp-007',
    cclass: 'graduate',
    vendor: null,
    product: null,
    name: 'BCom Information Systems',
    nqf_level: 'NQF 7 — Bachelor / Adv Diploma',
    issued: '2021-12-10',
    expiry: null,
    file_ref: 'BCom_Degree.pdf',
    created_at: NOW,
  },
  {
    id: 'c7',
    employee_id: 'emp-006',
    cclass: 'graduate',
    vendor: null,
    product: null,
    name: 'National Diploma: Accounting',
    nqf_level: 'NQF 6 — Diploma',
    issued: '2019-11-30',
    expiry: null,
    file_ref: 'NatDip_Acc.pdf',
    created_at: NOW,
  },
  {
    id: 'c8',
    employee_id: 'emp-009',
    cclass: 'product',
    vendor: 'Yooz',
    product: 'Yooz AP Automation',
    name: 'Yooz AP Automation Specialist',
    nqf_level: null,
    issued: '2026-01-15',
    expiry: '2026-06-30',
    file_ref: 'Yooz_Spec.pdf',
    created_at: NOW,
  },
]

// ── Pure helpers (no module state; safe to unit test) ─────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Single ISO date as "30 Jun 2026". */
export function formatCertDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00.000Z`)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * The "today" used for expiry classification. Overridable for tests. Live mode
 * classifies against the real clock (a cert's traffic-light must move as time
 * passes); mock mode stays pinned to the demo data set's reference date so the
 * seeded certs render deterministically.
 */
function referenceDate(reference?: Date): Date {
  if (reference) return reference
  return process.env.NEXT_PUBLIC_PULSE_DATA === 'live'
    ? new Date()
    : new Date('2026-06-15T00:00:00.000Z')
}

/**
 * Classify a certificate's expiry into a traffic-light state (business rule,
 * HANDOFF §3): within 60 days of expiry → "soon" (amber); past → "expired"
 * (red); else "valid" (green); no expiry → "none". Pure: depends only on inputs.
 */
export function certExpiryInfo(expiry: string | null, reference?: Date): CertExpiryInfo {
  if (!expiry) return { label: 'No expiry', state: 'none', days: null }
  const now = referenceDate(reference)
  const e = new Date(`${expiry}T00:00:00.000Z`)
  const days = Math.round((e.getTime() - now.getTime()) / DAY_MS)
  if (days < 0) return { label: `Expired ${formatCertDate(expiry)}`, state: 'expired', days }
  if (days <= 60) return { label: `Expires ${formatCertDate(expiry)}`, state: 'soon', days }
  return { label: `Valid to ${formatCertDate(expiry)}`, state: 'valid', days }
}

const SORT_RANK: Record<CertExpiryState, number> = {
  expired: 0,
  soon: 1,
  valid: 2,
  none: 3,
}

/**
 * Sort certificates by urgency: expired → expiring soon → valid → no-expiry.
 * Returns a new array (does not mutate the input).
 */
export function sortCertsByUrgency(
  certs: Certification[],
  reference?: Date,
): Certification[] {
  return certs
    .slice()
    .sort(
      (a, b) =>
        SORT_RANK[certExpiryInfo(a.expiry, reference).state] -
        SORT_RANK[certExpiryInfo(b.expiry, reference).state],
    )
}

/** True if a cert needs recertification: a product cert that is expiring or expired. */
export function needsRecert(cert: Certification, reference?: Date): boolean {
  if (cert.cclass !== 'product') return false
  const state = certExpiryInfo(cert.expiry, reference).state
  return state === 'soon' || state === 'expired'
}
