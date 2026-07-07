import { describe, it, expect } from 'vitest'

import {
  composeBillableSummary,
  isJuniorConsultant,
  toEnrolment,
  type RosterEmployee,
} from '../training-live'
import { moduleKey, pathsFor } from '@/lib/mock/training'
import { PRODUCTS } from '@/lib/mock/training'
import type { Product, TrainingStatusRow } from '@/types/database'

// Deterministic "today" for milestone statuses.
const REF = new Date('2026-07-07T08:00:00.000Z')

const status = (over: Partial<TrainingStatusRow> = {}): TrainingStatusRow => ({
  employee_id: 'emp-1',
  product: 'intacct',
  cert_path: 'implementation',
  ilt_date: null,
  getting_started_done: false,
  ilt_done: false,
  certified: false,
  updated_at: '2026-07-01T00:00:00.000Z',
  ...over,
})

const employee = (over: Partial<RosterEmployee> = {}): RosterEmployee => ({
  id: 'emp-1',
  display_name: 'Test Person',
  job_title: 'Junior Consultant',
  avatar_initials: 'TP',
  avatar_color: '#123456',
  department: 'Consulting',
  status: 'onboarding',
  start_date: '2026-07-01',
  ...over,
})

const products: Product[] = [
  { id: 'intacct', name: 'Sage Intacct', cert: 'Cert', course: 'Course', hours: 25 },
  { id: 'x3', name: 'Sage X3', cert: 'Cert', course: 'Course', hours: 40 },
]

describe('toEnrolment', () => {
  it('returns undefined when there is no persisted training state (start state)', () => {
    expect(toEnrolment(null, [])).toBeUndefined()
  })

  it('folds a status row + progress rows into the enrolment view-model', () => {
    const enrolment = toEnrolment(
      status({ ilt_date: '2026-07-24', getting_started_done: true }),
      [
        { module_key: 'intacct:core:sage-intacct-getting-started', done: true },
        { module_key: 'intacct:core:cloud-accounting-foundations', done: false },
      ],
    )
    expect(enrolment).toMatchObject({
      employee_id: 'emp-1',
      product_id: 'intacct',
      ilt_date: '2026-07-24',
      getting_started_done: true,
      ilt_done: false,
      certified: false,
    })
    expect(enrolment?.modules_done).toEqual({
      'intacct:core:sage-intacct-getting-started': true,
      'intacct:core:cloud-accounting-foundations': false,
    })
  })

  it('yields a default-product enrolment from progress-only state', () => {
    const enrolment = toEnrolment(null, [
      { module_key: 'intacct:core:foundations', done: true },
    ])
    expect(enrolment?.product_id).toBe('intacct')
    expect(enrolment?.ilt_date).toBeNull()
    expect(enrolment?.modules_done['intacct:core:foundations']).toBe(true)
  })
})

describe('isJuniorConsultant', () => {
  it('includes anyone with a training_status row', () => {
    expect(
      isJuniorConsultant(employee({ department: 'Finance', status: 'active' }), true),
    ).toBe(true)
  })

  it('includes Consulting onboarding/probation staff without a row', () => {
    expect(isJuniorConsultant(employee({ status: 'onboarding' }), false)).toBe(true)
    expect(isJuniorConsultant(employee({ status: 'probation' }), false)).toBe(true)
  })

  it('excludes active staff and other departments without a row', () => {
    expect(isJuniorConsultant(employee({ status: 'active' }), false)).toBe(false)
    expect(
      isJuniorConsultant(employee({ department: 'Finance' }), false),
    ).toBe(false)
  })
})

describe('composeBillableSummary', () => {
  it('projects milestone dates from start date + entered ILT date', () => {
    const rows = composeBillableSummary(
      [employee()],
      [status({ ilt_date: '2026-07-24', getting_started_done: true })],
      products,
      REF,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      employee_id: 'emp-1',
      product_name: 'Sage Intacct',
      ilt_date_entered: '2026-07-24',
      supervised_date: '2026-07-08', // start + 7 days
      ilt_date: '2026-07-24',
      certified_date: '2026-08-03', // ILT + 10 days
      stage: 'supervised',
      next_milestone: 'ilt',
    })
  })

  it('renders the empty/start state for a consultant with no training rows', () => {
    const rows = composeBillableSummary([employee()], [], products, REF)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      product_id: 'intacct', // default product until they enrol
      ilt_date_entered: null,
      ilt_date: null,
      certified_date: null,
      stage: 'pre',
      next_milestone: 'supervised',
    })
  })

  it('uses the live products catalog for names, falling back to the client catalog', () => {
    const rows = composeBillableSummary(
      [employee()],
      [status({ product: 'payroll' })], // not in the `products` fixture
      products,
      REF,
    )
    expect(rows[0].product_id).toBe('payroll')
    expect(rows[0].product_name).toBeTruthy() // client-catalog fallback name
  })

  it('sorts soonest certified date first, unscheduled to the bottom', () => {
    const rows = composeBillableSummary(
      [
        employee({ id: 'a', display_name: 'Alpha' }),
        employee({ id: 'b', display_name: 'Bravo' }),
        employee({ id: 'c', display_name: 'Charlie' }),
      ],
      [
        status({ employee_id: 'a', ilt_date: '2026-08-01' }),
        status({ employee_id: 'b', ilt_date: '2026-07-10' }),
        // c: no row -> no certified date
      ],
      products,
      REF,
    )
    expect(rows.map((r) => r.employee_id)).toEqual(['b', 'a', 'c'])
  })

  it('only rolls up junior consultants', () => {
    const rows = composeBillableSummary(
      [
        employee({ id: 'jc' }),
        employee({ id: 'veteran', status: 'active' }),
      ],
      [],
      products,
      REF,
    )
    expect(rows.map((r) => r.employee_id)).toEqual(['jc'])
  })
})

describe('module keys (server-action contract)', () => {
  // Must match MODULE_KEY_RE in app/training/actions.ts — every key the UI can
  // generate from the real catalog must pass the server action's validation.
  const MODULE_KEY_RE = /^[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/

  it('every catalog module key is accepted by the write validation', () => {
    for (const product of PRODUCTS) {
      for (const path of pathsFor(product.id)) {
        for (const group of path.groups) {
          for (const mod of group.mods) {
            const key = moduleKey(product.id, path.id, mod.name)
            expect(key, key).toMatch(MODULE_KEY_RE)
            expect(key.length).toBeLessThanOrEqual(200)
          }
        }
      }
    }
  })
})
