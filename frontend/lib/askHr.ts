// ── Ask HR — stubbed assistant knowledge ──────────────────────────────────────
// The production "Pulse Assistant" wires a real LLM grounded on the 24-policy
// corpus + payroll/leave/expense rules (deferred to the backend phase). Until
// then we answer the common questions from the documented rules (HANDOFF §4) and
// defer anything else to HR. Pure (no data access) so it is unit-testable.

export const HR_EMAIL = 'ben@jera.co.za'

/** The starter prompts shown as chips on the empty state (from the prototype). */
export const ASK_HR_SUGGESTIONS = [
  'How much annual leave do I get?',
  'What rate do I claim for business travel?',
  'When do I get paid each month?',
  'How do I submit an expense claim?',
  'What is the overtime policy?',
  'How do I get billable on Sage Intacct?',
] as const

interface Answer {
  match: RegExp
  text: string
}

const ANSWERS: Answer[] = [
  {
    match: /annual leave|how much leave|vacation|holiday|sick leave/i,
    text: 'You get 15 days of annual leave per year. Sick leave is 15 days over a rolling 36-month cycle. You can read the full Leave Policy under Policies.',
  },
  {
    match: /travel|km|mileage|aa rate|petrol|fuel/i,
    text: 'Business travel is reimbursed at your AA Vehicle Rates Certificate rate — the full AA rate for travel invoiced to a client, and the fixed-cost rate for non-invoiced travel. Capture it on your claim under Expenses.',
  },
  {
    match: /paid|pay ?date|payday|salary|when.*pay/i,
    text: 'Salaries are paid on the 25th of each month.',
  },
  {
    match: /expense claim|submit.*expense|claim.*expense|reimburse|receipt|slip/i,
    text: 'Open Expenses, capture your expenses incurred, travel and any advances, attach your timesheet and receipt slips, then submit by the 25th for finance approval.',
  },
  {
    match: /overtime/i,
    text: 'Overtime is governed by the Overtime Payment Policy (HR011) — read the full policy under Policies.',
  },
  {
    match: /billable|intacct|certif|ilt|supervised|sage u/i,
    text: "Work through your product learning path and shadowing — you become supervised-billable about 7 days after your start date. Enter your ILT date once you finish instructor-led training; you're certified about 10 days after that. Track it all under Training.",
  },
  {
    match: /notice period|resign|termination|retrench/i,
    text: 'Notice follows the BCEA: 1 week if employed 6 months or less, 2 weeks for 6–12 months, and 4 weeks after 1 year. See the Termination of Employment policy.',
  },
]

/**
 * Answer an HR/payroll question from the documented rules, or defer to HR.
 * Empty input returns an empty string.
 */
export function answerHrQuestion(question: string): string {
  const q = question.trim()
  if (!q) return ''
  const hit = ANSWERS.find((a) => a.match.test(q))
  if (hit) return hit.text
  return `I can't answer that one yet — I'll be connected to the full HR handbook soon. For now, please check with HR (${HR_EMAIL}).`
}
