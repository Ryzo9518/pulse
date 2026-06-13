// Mock HR policy seed data — all 20 policies + acknowledgement seed.
// Authoritative source: database/pulse_v5_schema.sql (hr_policies seed, HR001–HR020).
// Some full_text bodies are mined from the detailed POLICIES array in
// docs/pulse_v4_prototype.html.

import type { HrPolicy, HrPolicyAcknowledgement } from '@/types/database'
import { ONBOARDING_EMPLOYEE_ID } from './employees'

const NOW = '2026-06-13T08:00:00.000Z'

export const hrPolicies: HrPolicy[] = [
  {
    id: 'HR001',
    code: 'JERA-POL-HR001',
    title: 'Code of Ethics',
    icon: '⚖️',
    summary:
      'Principles and values guiding conduct of all Jera members — integrity, accountability, respect, excellence, and confidentiality.',
    full_text:
      'All Jera members are expected to act with integrity, accountability, respect, and excellence at all times. Maintain confidentiality of company and client information. Avoid conflicts of interest and disclose any that arise. Treat colleagues, clients, and suppliers fairly and honestly.',
    document_url: null,
    sort_order: 1,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR002',
    code: 'JERA-POL-HR002',
    title: 'Code of Conduct',
    icon: '📏',
    summary:
      'Standards for professional behaviour — respectful communication, dress code, punctuality, client interactions, and company property use.',
    full_text:
      'Professional conduct is expected at all times. Dress code: prescribed Jera clothing on-site, business casual in office. Confidentiality of remuneration information is required. No competing work without written consent. Safety standards must be followed. Cash shortages, damages, or loss of equipment are treated seriously.',
    document_url: null,
    sort_order: 2,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR003',
    code: 'JERA-POL-HR003',
    title: 'Remuneration Policy',
    icon: '💰',
    summary:
      'Fair, competitive, and performance-linked compensation. Annual reviews in February. CTC structures and benefits.',
    full_text:
      'Remuneration is paid on the 25th of each month. Compensation is fair, competitive, and performance-linked. Annual reviews take place in February. Cost-to-company structures include applicable benefits. Remuneration information is strictly confidential.',
    document_url: null,
    sort_order: 3,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR004',
    code: 'JERA-POL-HR004',
    title: 'Performance Management Policy',
    icon: '📊',
    summary:
      'Framework for assessing and developing employee performance. 30-60-90 day plans, quarterly reviews, annual BSC.',
    full_text:
      'Performance is assessed and developed through 30-60-90 day plans for new starters, quarterly reviews, and an annual Balanced Scorecard (BSC). Goals are set collaboratively and reviewed against measurable outcomes.',
    document_url: null,
    sort_order: 4,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR005',
    code: 'JERA-POL-HR005',
    title: 'Leave Policy',
    icon: '🏖️',
    summary:
      'Leave entitlements per BCEA: 21 consecutive days annual, sick leave cycles, maternity/paternity, family responsibility, study, and religious leave.',
    full_text:
      'Annual: 15 working days per year. Sick: 15 days per 36-month cycle (medical certificate after 2 consecutive days). Maternity: 4 months. Family responsibility: 3 half-days (birth, child illness, death of immediate family). Study leave: 1 day before exam plus exam day (MD approval). Religious leave must be applied for. All leave via the leave application form.',
    document_url: null,
    sort_order: 5,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR006',
    code: 'JERA-POL-HR006',
    title: 'Recruitment and Selection Policy',
    icon: '🔍',
    summary:
      "Fair, transparent recruitment compliant with EEA, BCEA, POPIA, and the Children's Act. Equal opportunity for all candidates.",
    full_text:
      "Recruitment is fair, transparent, and compliant with the Employment Equity Act, BCEA, POPIA, and the Children's Act. All candidates are given equal opportunity. Selection is based on merit and role fit.",
    document_url: null,
    sort_order: 6,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR007',
    code: 'JERA-POL-HR007',
    title: 'IT Equipment Allowance Policy',
    icon: '💻',
    summary:
      'Provision of IT equipment, technology allowances, tax implications, security requirements, and maintenance responsibilities.',
    full_text:
      'IT equipment is provided for work purposes. Technology allowances may apply with associated tax implications. Security requirements include MFA on all accounts and storing documents on SharePoint — never locally only. Employees are responsible for the maintenance and safekeeping of issued equipment.',
    document_url: null,
    sort_order: 7,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR008',
    code: 'JERA-POL-HR008',
    title: 'Travel and Subsistence Allowance Policy',
    icon: '✈️',
    summary:
      'Business travel reimbursement: R1.50/km SARS rate, R522/day per diem, accommodation caps, approval process, and expense claims by the 25th.',
    full_text:
      'Business travel in a personal vehicle is reimbursed at the SARS rate of R1.50/km. Per diem is R522 per full day (R261 per half day). Accommodation caps: R1500/night in major cities, R900/night in smaller towns. Expense claims must be submitted by the 25th of each month, accompanied by a timesheet.',
    document_url: null,
    sort_order: 8,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR009',
    code: 'JERA-POL-HR009',
    title: 'Private Work After Hours Policy',
    icon: '🌙',
    summary:
      'Guidelines for freelancing and consulting outside work hours. Written approval required. Non-compete and IP protections.',
    full_text:
      'Freelancing or consulting outside work hours requires written approval. Non-compete provisions apply: no work for or with Jera competitors or clients without consent. Intellectual property created during employment remains Jera property.',
    document_url: null,
    sort_order: 9,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR010',
    code: 'JERA-POL-HR010',
    title: 'Contractor Policy',
    icon: '🤝',
    summary:
      'Guidelines for engaging, managing, and terminating contractors. Compliance with LRA, tax obligations, and IP protections.',
    full_text:
      'Contractors are engaged, managed, and terminated in compliance with the LRA. Tax obligations and IP protections are clearly defined in each contractor agreement. Contractors follow the same confidentiality and conduct standards as employees.',
    document_url: null,
    sort_order: 10,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR011',
    code: 'JERA-POL-HR011',
    title: 'Overtime Payment Policy',
    icon: '⏰',
    summary:
      'Overtime framework per BCEA: 1.5x normal rate, max 3hrs/day, 10hrs/week. Pre-approval required. Sunday and public holiday rates.',
    full_text:
      'Overtime is paid at 1.5x the normal rate, subject to a maximum of 3 hours per day and 10 hours per week. Pre-approval is required. Sunday and public holiday work attracts enhanced rates per the BCEA.',
    document_url: null,
    sort_order: 11,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR012',
    code: 'JERA-POL-HR012',
    title: 'Smoke-Free Workplace Policy',
    icon: '🚭',
    summary:
      'No smoking or vaping in any Jera premises. Compliant with Tobacco Products Control Act. Designated outdoor areas only.',
    full_text:
      'No smoking or vaping is permitted in any Jera premises, in compliance with the Tobacco Products Control Act. Smoking is permitted only in designated outdoor areas.',
    document_url: null,
    sort_order: 12,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR013',
    code: 'JERA-POL-HR013',
    title: 'Employment Equity Policy',
    icon: '🤲',
    summary:
      'Commitment to diversity and inclusion. Eliminating unfair discrimination. Representative workforce reflecting SA society.',
    full_text:
      'Jera is committed to diversity and inclusion and to eliminating unfair discrimination. We strive for a representative workforce reflecting South African society, in line with the Employment Equity Act.',
    document_url: null,
    sort_order: 13,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR014',
    code: 'JERA-POL-HR014',
    title: 'Employee Relations Policy',
    icon: '🤝',
    summary:
      'Framework for discipline, grievances, and disputes. Fair, consistent, and transparent handling of workplace issues.',
    full_text:
      'Workplace discipline, grievances, and disputes are handled fairly, consistently, and transparently. Employees are entitled to fair process and representation. The aim is early, constructive resolution.',
    document_url: null,
    sort_order: 14,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR015',
    code: 'JERA-POL-HR015',
    title: 'Occupational Health and Safety Policy',
    icon: '🦺',
    summary:
      'Safe working environment per the OHS Act 1993. Risk assessments, incident reporting, emergency procedures, and PPE requirements.',
    full_text:
      'Jera provides a safe working environment per the OHS Act 1993. This includes risk assessments, incident reporting, emergency procedures, and PPE requirements where applicable. All employees share responsibility for workplace safety.',
    document_url: null,
    sort_order: 15,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR016',
    code: 'JERA-POL-HR016',
    title: 'Disciplinary Code and Procedure',
    icon: '⚠️',
    summary:
      'Fair disciplinary procedure per LRA. Progressive discipline: verbal warning → written → final → dismissal. Right to fair hearing.',
    full_text:
      'Discipline follows a fair procedure per the LRA, applying progressive discipline: verbal warning → written warning → final written warning → dismissal. Employees have the right to a fair hearing and representation.',
    document_url: null,
    sort_order: 16,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR017',
    code: 'JERA-POL-HR017',
    title: 'Grievance Policy and Procedure',
    icon: '📢',
    summary:
      'Structured mechanism for employees to raise concerns. Confidential, timely investigation and resolution. Escalation to CCMA if needed.',
    full_text:
      'Employees may raise concerns through a structured, confidential grievance procedure. Grievances are investigated and resolved in a timely manner. Unresolved matters may be escalated to the CCMA.',
    document_url: null,
    sort_order: 17,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR018',
    code: 'JERA-POL-HR018',
    title: 'Termination of Employment',
    icon: '📋',
    summary:
      'Procedures for resignation, dismissal, retirement. Notice periods per BCEA. Exit interviews, final payments, and handover.',
    full_text:
      'Termination procedures cover resignation, dismissal, and retirement. Notice periods follow the BCEA: 1 week (≤6 months), 2 weeks (6–12 months), 4 weeks (1+ year). Exit interviews, final payments, and proper handover are required.',
    document_url: null,
    sort_order: 18,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR019',
    code: 'JERA-POL-HR019',
    title: 'Retrenchment Policy',
    icon: '📉',
    summary:
      'Section 189 LRA compliance. Fair selection criteria, consultation process, severance pay (1 week per completed year), and alternatives.',
    full_text:
      'Retrenchments comply with Section 189 of the LRA, including fair selection criteria and a consultation process. Severance pay is 1 week per completed year of service. Alternatives to retrenchment are explored first.',
    document_url: null,
    sort_order: 19,
    is_active: true,
    created_at: NOW,
  },
  {
    id: 'HR020',
    code: 'JERA-POL-HR020',
    title: 'Workbook for Managing Incapacity',
    icon: '📖',
    summary:
      'Practical guide for managing poor performance, temporary ill-health, and permanent incapacity per Schedule 8 of the LRA.',
    full_text:
      'A practical guide for managing poor performance, temporary ill-health, and permanent incapacity per Schedule 8 of the LRA. Emphasises support, reasonable accommodation, and fair process before any incapacity-related action.',
    document_url: null,
    sort_order: 20,
    is_active: true,
    created_at: NOW,
  },
]

// Acknowledgement seed for the onboarding employee — all 20 start unacknowledged.
export const hrPolicyAcknowledgements: HrPolicyAcknowledgement[] = hrPolicies.map(
  (policy, i) => ({
    id: `ack-${String(i + 1).padStart(3, '0')}`,
    employee_id: ONBOARDING_EMPLOYEE_ID,
    policy_id: policy.id,
    acknowledged: false,
    read_started_at: null,
    acknowledged_at: null,
  })
)
