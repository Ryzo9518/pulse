import { describe, expect, it } from 'vitest'

import { ASK_HR_SUGGESTIONS, HR_EMAIL, answerHrQuestion } from '../askHr'

describe('answerHrQuestion', () => {
  it('answers the common HR questions from the documented rules', () => {
    expect(answerHrQuestion('How much annual leave do I get?')).toMatch(/15 days/)
    expect(answerHrQuestion('When do I get paid each month?')).toMatch(/25th/)
    expect(answerHrQuestion('What rate do I claim for business travel?')).toMatch(
      /AA/,
    )
  })

  it('defers to HR for anything it cannot answer', () => {
    const a = answerHrQuestion('What is the meaning of life?')
    expect(a).toContain(HR_EMAIL)
  })

  it('returns an empty string for empty input', () => {
    expect(answerHrQuestion('   ')).toBe('')
  })

  it('every starter suggestion gets a real (non-deferral) answer', () => {
    for (const q of ASK_HR_SUGGESTIONS) {
      expect(answerHrQuestion(q)).not.toContain(HR_EMAIL)
      expect(answerHrQuestion(q).length).toBeGreaterThan(0)
    }
  })
})
