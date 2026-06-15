import { describe, expect, it } from 'vitest'

import {
  getOnboardingGenerationPlan,
  getOnboardingGenerationTaskTotal,
} from '@/lib/mock'
import { deriveWorkEmail } from '@/lib/onboardGenerate'

// ── Schedule Onboarding — generation preview ──────────────────────────────────
// The "Will generate N tasks across M phases" preview reads the generation plan
// from the mock seam. A new starter generates 30 tasks across 5 phases, and the
// reported total must equal the sum of the per-phase counts (no double-count, no
// drift).

describe('onboarding generation plan', () => {
  it('reports 30 tasks across 5 phases', () => {
    const plan = getOnboardingGenerationPlan()
    expect(plan).toHaveLength(5)
    expect(getOnboardingGenerationTaskTotal()).toBe(30)
  })

  it('total equals the sum of the per-phase task counts', () => {
    const plan = getOnboardingGenerationPlan()
    const sum = plan.reduce((acc, p) => acc + p.task_count, 0)
    expect(sum).toBe(getOnboardingGenerationTaskTotal())
  })

  it('every phase contributes at least one task and has a name', () => {
    for (const phase of getOnboardingGenerationPlan()) {
      expect(phase.task_count).toBeGreaterThan(0)
      expect(phase.name.length).toBeGreaterThan(0)
    }
  })
})

describe('deriveWorkEmail — optional email auto-derivation', () => {
  it('auto-derives {first}@jera.co.za when email is blank', () => {
    expect(deriveWorkEmail('', 'Thabo Mokoena')).toBe('thabo@jera.co.za')
    expect(deriveWorkEmail('   ', 'Jane Q Public')).toBe('jane@jera.co.za')
  })

  it('keeps a supplied email verbatim (trimmed)', () => {
    expect(deriveWorkEmail('  custom@jera.co.za ', 'Thabo Mokoena')).toBe(
      'custom@jera.co.za',
    )
  })

  it('returns empty string when both email and name are blank', () => {
    expect(deriveWorkEmail('', '   ')).toBe('')
  })
})
