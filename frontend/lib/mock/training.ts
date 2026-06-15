// Mock training seed data + pure helpers — conforms to the training types in
// types/database.ts. Powers the multi-product Sage University learning-paths
// experience and the 4-stage billable-readiness ladder.
//
// Source of truth: docs/prototype/Pulse.dc.html (PRODUCTS, MODULE_TYPES,
// INTACCT_PATHS, X3_PATHS, PAYROLL_PATHS, PEOPLE300_PATHS, pathsFor,
// billableStage, TRAINING_STATUS) + HANDOFF §3/§4 + SCHEMA.sql
// (training_paths / training_modules / training_status).
//
// Per the frontend-first phase, this is in-memory mock data only.

import type {
  BillableMilestone,
  BillableStage,
  Employee,
  IltSession,
  MilestoneKey,
  ModuleType,
  ModuleTypeMeta,
  PathProgress,
  Product,
  ProductId,
  TrainingEnrolment,
  TrainingPath,
} from '@/types/database'

const NOW = '2026-06-13T08:00:00.000Z'

// ── Billable-readiness projection offsets (HANDOFF §4) ────────────────────────
// Supervised-billable: a junior can bill supervised hours once foundations +
// shadowing are done, ~7 calendar days (≈1 working week) after their start date.
export const SUPERVISED_OFFSET_DAYS = 7
// Certified: certification typically follows the ILT date by ~10 days (prep +
// sitting the exam).
export const CERT_PREP_DAYS = 10

export const IMPLEMENTING_COURSE = 'Sage Intacct: Implementing'

// ── Products (catalogue powering the product selector + cert names) ───────────
export const PRODUCTS: Product[] = [
  { id: 'intacct', name: 'Sage Intacct', cert: 'Sage Intacct Implementation Consultant', course: 'Sage Intacct: Implementing', hours: 25 },
  { id: 'x3', name: 'Sage X3', cert: 'Sage X3 Implementation Consultant', course: 'Sage X3: Implementation Essentials', hours: 32 },
  { id: '300people', name: 'Sage 300 People', cert: 'Sage 300 People Consultant', course: 'Sage 300 People: Core Implementation', hours: 24 },
  { id: '200evo', name: 'Sage 200 Evolution', cert: 'Sage 200 Evolution Consultant', course: 'Sage 200 Evolution: Implementation', hours: 20 },
  { id: 'pastel', name: 'Sage Business Cloud Accounting', cert: 'Sage Accounting Certified Consultant', course: 'Sage Accounting: Partner Certification', hours: 16 },
  { id: 'payroll', name: 'Sage Payroll Advanced', cert: 'Sage Payroll Advanced Implementation Consultant', course: 'Pre-work Certification + Contact Sessions', hours: 18 },
]

export function productById(id: ProductId): Product {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0]
}

// ── Module-type presentation metadata (icon + label + badge colour) ───────────
export const MODULE_TYPES: Record<ModuleType, ModuleTypeMeta> = {
  video: { label: 'Course', color: 'blue', icon: '▶' },
  ilt: { label: 'Instructor-led', color: 'red', icon: '🎓' },
  assessment: { label: 'Assessment', color: 'amber', icon: '☑' },
  exam: { label: 'Assessment', color: 'amber', icon: '☑' },
  link: { label: 'External', color: 'grey', icon: '🔗' },
  job: { label: 'On-the-job', color: 'green', icon: '💼' },
  stage: { label: 'Stage', color: 'pink', icon: '◆' },
}

export function moduleTypeMeta(type: ModuleType): ModuleTypeMeta {
  return MODULE_TYPES[type] ?? MODULE_TYPES.video
}

// ── Real Sage University learning paths for Sage Intacct (Sage U / CSOD) ───────
export const INTACCT_PATHS: TrainingPath[] = [
  {
    id: 'core',
    name: 'Sage Intacct Implementer',
    tag: 'Core path',
    note: 'The core implementer learning path. Complete this before any specialised path.',
    groups: [
      {
        label: 'Core Learning',
        mods: [
          { name: 'Sage Intacct: Getting Started', type: 'video' },
          { name: 'Cloud & Accounting Foundations', type: 'video' },
          { name: 'Sage Intacct: Implementing', type: 'ilt' },
          { name: 'Configuration, Dashboards & Reporting', type: 'video' },
        ],
      },
      {
        label: 'Get Certified',
        mods: [
          { name: 'Implementation Consultant certification assessment', type: 'assessment', tag: 'required' },
        ],
      },
    ],
  },
  {
    id: 'pm',
    name: 'Project Management',
    groups: [
      { label: 'Core Learning', mods: [{ name: 'Managing Implementation Projects', type: 'video' }] },
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    groups: [
      {
        label: 'Core Learning',
        mods: [
          { name: 'Implementing Time and Expenses', type: 'video' },
          { name: 'Tracking Time with Projects', type: 'video' },
          { name: 'Processing Expenses with Projects', type: 'video' },
          { name: 'Managing Labor Costing with Projects', type: 'video' },
        ],
      },
      {
        label: 'Additional Learning',
        note: 'Select the option that applies to you:',
        mods: [
          { name: 'Billing and Invoicing with Projects', type: 'video', choice: 'a' },
          { name: 'Qualified Expenses and Invoicing with Projects and Grants', type: 'video', choice: 'b' },
        ],
      },
      {
        label: 'Additional Learning',
        note: 'Select the option that applies to you:',
        mods: [
          { name: 'Recognizing Revenue with Projects', type: 'video', choice: 'a' },
          { name: 'Recognizing Revenue with Projects and Grants', type: 'video', choice: 'b' },
        ],
      },
    ],
  },
  {
    id: 'contracts',
    name: 'Contracts',
    note: 'Partners must be pre-approved for Contracts. Complete the core Implementer path first.',
    groups: [
      {
        label: 'Core Learning',
        mods: [
          { name: 'Automating Subscription Billing and Rev Rec with Contracts', type: 'video' },
          { name: 'Automating Usage Billing with Contracts', type: 'video' },
          { name: 'Recognizing Expenses in Contracts', type: 'video' },
          { name: 'Managing Multiple-element Arrangement Allocations in Contracts', type: 'video' },
          { name: 'Managing Evergreen Contracts', type: 'video' },
          { name: 'Using Historical Contracts with Sage Intacct', type: 'video' },
          { name: 'Implementing Contracts', type: 'ilt' },
          { name: 'Contracts: What comes next - ACP and Beyond', type: 'video' },
        ],
      },
    ],
  },
  {
    id: 'construction',
    name: 'Construction',
    note: 'Partners must be pre-approved. Certify in Sage Construction Industry and Implementation Consultant.',
    groups: [
      {
        label: 'Prerequisites',
        mods: [
          { name: 'Sage Construction Industry assessment', type: 'assessment', tag: 'required' },
          { name: 'Sage Intacct Implementation Consultant assessment', type: 'assessment', tag: 'required' },
          { name: 'Introduction to the Construction Industry', type: 'video', tag: 'recommended' },
          { name: 'Sage Intacct: Implementing', type: 'ilt', tag: 'recommended' },
        ],
      },
      {
        label: 'Core Learning',
        mods: [
          { name: 'Introduction to the Construction Industry', type: 'video' },
          { name: 'Understanding Construction Workflows for Implementation', type: 'video', tag: 'required' },
          { name: 'Implementing Sage Intacct Construction', type: 'ilt' },
        ],
      },
      {
        label: 'Get Certified',
        mods: [
          { name: 'Construction Implementation Consultant sample assessment', type: 'assessment' },
          { name: 'Construction Implementation Consultant certification assessment', type: 'assessment', tag: 'required' },
        ],
      },
    ],
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    note: 'Partners must be approved. Certify in Implementation Consultant and Real Estate Industry.',
    groups: [
      {
        label: 'Prerequisites',
        mods: [
          { name: 'Sage Intacct Real Estate Industry assessment', type: 'assessment', tag: 'required' },
          { name: 'Implementation Consultant certification assessment', type: 'assessment', tag: 'required' },
          { name: 'Introduction to the Real Estate Industry', type: 'video', tag: 'recommended' },
          { name: 'Sage Intacct: Implementing', type: 'ilt', tag: 'recommended' },
        ],
      },
      {
        label: 'Core Learning',
        mods: [
          { name: 'Implementing Sage Intacct Real Estate', type: 'video', tag: 'recommended' },
          { name: 'Sage Intacct Real Estate Sales and Demo training', type: 'video', tag: 'recommended' },
        ],
      },
      {
        label: 'Get Certified',
        mods: [
          { name: 'Sage Intacct Real Estate Implementation assessment', type: 'assessment', tag: 'required' },
        ],
      },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory Control',
    note: 'Complete the core Implementer path before starting Inventory Control.',
    groups: [
      {
        label: 'Core Learning',
        mods: [
          { name: 'Implementing Inventory Control', type: 'ilt' },
          { name: 'Reserving and Picking Items During Order Entry', type: 'video' },
          { name: 'Managing Sales Orders with Fulfillment', type: 'video' },
        ],
      },
    ],
  },
]

// ── Real Sage X3 partner enablement — role-based learning paths (Sage U) ───────
const X3_FOUNDATION_3 = [
  { name: 'Getting Started with Sage X3', type: 'video' as const },
  { name: 'Getting Started with Common Data', type: 'video' as const },
  { name: 'Getting Started with the Cloud', type: 'video' as const },
]
const X3_STAGES_FULL = [
  { name: 'Get Started', type: 'stage' as const, desc: 'Learn basic functions and operations' },
  { name: 'Core Learning', type: 'stage' as const, desc: 'Learn the skills to perform your everyday duties' },
  { name: 'Certification', type: 'assessment' as const, desc: 'Earn the ultimate in Sage X3 learning' },
  { name: 'Additional Learning', type: 'stage' as const, desc: 'Extend your skills as you gain experience' },
  { name: 'Advanced Learning', type: 'stage' as const, desc: 'Achieve the ultimate level of learning' },
  { name: 'Expert Learning', type: 'stage' as const, desc: 'Master your skills in your chosen specialty' },
]

export const X3_PATHS: TrainingPath[] = [
  { id: 'sales', name: 'Sales Consultant', tag: 'Sales & Pre-Sales', groups: [{ label: 'Learning stages', mods: [{ name: 'Sales', type: 'stage' }] }] },
  { id: 'presales', name: 'Pre-Sales Consultant', tag: 'Sales & Pre-Sales', groups: [{ label: 'Learning stages', mods: [{ name: 'Pre-Sales', type: 'stage' }] }] },
  {
    id: 'financials',
    name: 'Financials Consultant',
    tag: 'Financials & Distribution',
    groups: [
      { label: 'Foundational courses', mods: X3_FOUNDATION_3 },
      { label: 'Learning stages', mods: [...X3_STAGES_FULL, { name: 'Expert Financials', type: 'stage' }] },
    ],
  },
  {
    id: 'distribution',
    name: 'Distribution Consultant',
    tag: 'Financials & Distribution',
    groups: [
      { label: 'Foundational courses', mods: X3_FOUNDATION_3 },
      { label: 'Learning stages', mods: X3_STAGES_FULL },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing Consultant',
    tag: 'Manufacturing',
    groups: [
      { label: 'Foundational courses', mods: X3_FOUNDATION_3 },
      { label: 'Learning stages', mods: X3_STAGES_FULL },
      {
        label: 'Specialisation — Web Scheduling',
        mods: [
          { name: 'Introduction to Web Scheduling', type: 'video' },
          { name: 'Installing and Configuring Web Scheduling', type: 'video' },
          { name: 'Working with Sage X3 and Web Scheduling', type: 'video' },
        ],
      },
      {
        label: 'Specialisation — Shop Floor Control',
        mods: [
          { name: 'Overview of Shop Floor Control', type: 'video' },
          { name: 'Using Shop Floor Control', type: 'video' },
        ],
      },
    ],
  },
  {
    id: 'projects',
    name: 'Project Management (Job Costing)',
    tag: 'Project Management',
    groups: [
      { label: 'Foundational courses', mods: X3_FOUNDATION_3 },
      {
        label: 'Learning stages',
        mods: [
          { name: 'Get Started', type: 'stage', desc: 'Learn basic functions and operations' },
          { name: 'Core Learning', type: 'stage', desc: 'Learn the skills to perform your everyday duties' },
          { name: 'Expert Learning', type: 'stage', desc: 'Master your skills in your chosen specialty' },
        ],
      },
    ],
  },
  {
    id: 'sysengineer',
    name: 'System Engineer',
    tag: 'System Engineer & Admin',
    groups: [
      { label: 'Foundational courses', mods: X3_FOUNDATION_3 },
      {
        label: 'Learning stages',
        mods: [
          { name: 'Get Started', type: 'stage', desc: 'Learn basic functions and operations' },
          { name: 'Core Learning', type: 'stage', desc: 'Learn the skills to perform your everyday duties' },
          { name: 'Certification', type: 'assessment', desc: 'Earn the ultimate in Sage X3 learning' },
          { name: 'Additional Learning', type: 'stage', desc: 'Extend your skills as you gain experience' },
          { name: 'Expert Learning', type: 'stage', desc: 'Master your skills in your chosen specialty' },
        ],
      },
    ],
  },
  {
    id: 'sysadmin',
    name: 'System Administrator',
    tag: 'System Engineer & Admin',
    groups: [
      { label: 'Foundational courses', mods: X3_FOUNDATION_3 },
      { label: 'Learning stages', mods: X3_STAGES_FULL },
    ],
  },
  {
    id: 'developer',
    name: 'Certified Developer',
    tag: 'Developer',
    groups: [
      {
        label: 'Foundational courses',
        mods: [
          { name: 'Getting Started with Sage X3', type: 'video' },
          { name: 'Getting Started with Common Data', type: 'video' },
        ],
      },
      { label: 'Learning stages', mods: X3_STAGES_FULL },
    ],
  },
  {
    id: 'mobiledev',
    name: 'Certified Mobile Automation Developer',
    tag: 'Developer',
    groups: [
      {
        label: 'Foundational courses',
        mods: [
          { name: 'Getting Started with Sage X3', type: 'video' },
          { name: 'Getting Started with Common Data', type: 'video' },
          { name: 'Introduction to Sage X3 Builder', type: 'video' },
        ],
      },
      {
        label: 'Learning stages',
        mods: [
          { name: 'Get Started', type: 'stage', desc: 'Learn basic functions and operations' },
          { name: 'Core Learning', type: 'stage', desc: 'Learn the skills to perform your everyday duties' },
          { name: 'Certification', type: 'assessment', desc: 'Earn the ultimate in Sage X3 learning' },
        ],
      },
    ],
  },
  {
    id: 'apidev',
    name: 'Certified Sage X3 API Developer',
    tag: 'Developer',
    groups: [
      {
        label: 'Foundational courses',
        mods: [
          { name: 'Getting Started with Sage X3', type: 'video' },
          { name: 'Getting Started with Common Data', type: 'video' },
          { name: 'Introduction to Sage X3 Builder', type: 'video' },
        ],
      },
      { label: 'Learning stages', mods: X3_STAGES_FULL },
    ],
  },
  {
    id: 'reporting',
    name: 'Reporting & Analytics',
    tag: 'Reporting',
    groups: [
      { label: 'Sage Business Reporting', mods: [{ name: 'Sage Business Reporting', type: 'video' }] },
      {
        label: 'Sage Enterprise Intelligence (SEI)',
        note: 'Complete all 4 core courses to earn the Sage X3 SEI badge.',
        mods: [
          { name: 'Getting Started with the Basics', type: 'video' },
          { name: 'Using the SEI Add-in for Excel', type: 'video' },
          { name: 'Report Designer', type: 'video' },
          { name: 'Formatting, Filtering and Sorting', type: 'video' },
        ],
      },
      { label: 'Crystal Reports', mods: [{ name: 'Crystal Reports Basics', type: 'video' }] },
      {
        label: 'Sage Data & Analytics (SD&A)',
        note: 'Robust BI toolkit for Sage 100, 300 and X3. For learning options, contact Zap directly.',
        mods: [{ name: 'Sage Data & Analytics — partner enablement', type: 'link' }],
      },
    ],
  },
  {
    id: 'additional',
    name: 'Additional Learning Opportunities',
    tag: 'Optional',
    groups: [
      {
        label: 'Other tracks',
        mods: [
          { name: 'Supply Chain Intelligence (North America only)', type: 'video' },
          { name: 'X3 Procession', type: 'video' },
        ],
      },
    ],
  },
]

// ── Real Sage Payroll Advanced partner certification (2025/2026) — Sage U ──────
export const PAYROLL_PATHS: TrainingPath[] = [
  {
    id: 'core',
    name: 'Onboarding & getting started',
    tag: 'Start here',
    note: 'Complete these onboarding steps before enrolling on a certification role.',
    groups: [
      {
        label: 'Onboarding steps',
        mods: [
          { name: 'Watch the welcome video', type: 'video', desc: '“Introduction to Sage Certification 2025/2026” · 3 min 7 sec' },
          { name: 'Request your pre-work package', type: 'link', desc: 'Follow the guide “How to Request your Pre-work Package” (Google Drive)' },
          { name: 'View the course catalogue', type: 'link', desc: 'Download for an overview of all modules and assessments' },
          { name: 'Book your contact sessions', type: 'stage', desc: 'Pre-work assessment must be completed before Contact Session 1. Install required software first.' },
        ],
      },
    ],
  },
  {
    id: 'implementation',
    name: 'Implementation Consultant',
    tag: 'South Africa only',
    note: 'Become a Sage Payroll Advanced Certified Implementation Consultant (South Africa) via pre-work learning + assessment, then the full certification.',
    groups: [
      { label: 'Pre-work Certification — On-demand', mods: [{ name: 'Pre-work Certification Learning Package (South Africa)', type: 'video', desc: 'On-demand course package' }] },
      {
        label: 'Certification flow',
        mods: [
          { name: 'Complete Pre-work Learning Package', type: 'stage' },
          { name: 'Pass the Pre-work Assessment', type: 'assessment', tag: 'required' },
          { name: 'Register for the full Certification (Contact Sessions)', type: 'ilt' },
        ],
      },
    ],
  },
  {
    id: 'sales',
    name: 'Sales Consultant',
    tag: 'All regions',
    note: 'Become a Sage Payroll Advanced Certified Sales Consultant via the certification learning modules and sales assessment.',
    groups: [
      { label: 'Certification Learning — On-demand', mods: [{ name: 'Sales Certification Learning Package', type: 'video', desc: 'On-demand course package' }] },
      {
        label: 'Certification flow',
        mods: [
          { name: 'Complete Sales Certification Learning Package', type: 'stage' },
          { name: 'Pass the Sales Certification Assessment', type: 'assessment', tag: 'required' },
        ],
      },
    ],
  },
]

// ── Real Sage 300 People partner certification (2025/2026, South Africa) ───────
export const PEOPLE300_PATHS: TrainingPath[] = [
  {
    id: 'core',
    name: 'Onboarding & getting started',
    tag: 'Start here',
    note: 'South Africa consultants. Complete and pass the pre-work assessment before registering for the full certification sessions.',
    groups: [
      {
        label: 'Onboarding steps',
        mods: [
          { name: 'Watch the welcome video', type: 'video', desc: '“Introduction to Sage Certification 2025/2026” · 3 min 7 sec' },
          { name: 'Request your pre-work package', type: 'link', desc: 'Follow the guide “How to Request your Pre-work Package” (Google Drive)' },
          { name: 'View the course catalogue', type: 'link', desc: 'Download for an overview of all modules and assessments' },
          { name: 'Download and install software', type: 'stage', desc: 'Required before Contact Session 1. If 300 People Payroll is already installed, no extra install needed for HR.' },
          { name: 'Book your contact / welcome sessions', type: 'stage', desc: 'Sessions via Google Calendar (Africa/Johannesburg). Pre-work assessment must be done first.' },
        ],
      },
    ],
  },
  {
    id: 'payroll-impl',
    name: 'Payroll — Implementation Consultant',
    tag: 'Payroll · SA only',
    note: 'Become a Sage 300 People Payroll Certified Implementation Consultant via pre-work learning + assessment, then the contact sessions.',
    groups: [
      { label: 'Pre-work Certification — On-demand', mods: [{ name: 'Pre-work Certification Learning Package (South Africa)', type: 'video', desc: 'On-demand course package' }] },
      {
        label: 'Certification flow',
        mods: [
          { name: 'Complete Pre-work Certification Learning Package', type: 'stage' },
          { name: 'Pass the Pre-work Assessment', type: 'assessment', tag: 'required' },
          { name: 'Register for and attend full Certification Contact Sessions', type: 'ilt' },
        ],
      },
    ],
  },
  {
    id: 'payroll-sales',
    name: 'Payroll — Sales Consultant',
    tag: 'Payroll',
    note: 'Become a Sage 300 People Certified Sales Consultant via the certification learning modules and sales assessment.',
    groups: [
      { label: 'Certification Learning — On-demand', mods: [{ name: 'Sales Certification Learning Package', type: 'video', desc: 'On-demand course package' }] },
      {
        label: 'Certification flow',
        mods: [
          { name: 'Complete Sales Certification Learning Package', type: 'stage' },
          { name: 'Pass the Sales Certification Assessment', type: 'assessment', tag: 'required' },
        ],
      },
    ],
  },
  {
    id: 'hr-impl',
    name: 'HR — Implementation Consultant',
    tag: 'HR · SA only',
    note: 'Become a Sage 300 People HR Certified Implementation Consultant via pre-work learning + assessment, then the welcome sessions.',
    groups: [
      { label: 'Pre-work Certification — On-demand', mods: [{ name: 'Pre-work Certification Learning Package (South Africa)', type: 'video', desc: 'On-demand course package' }] },
      {
        label: 'Certification flow',
        mods: [
          { name: 'Complete Pre-work Certification Learning Package', type: 'stage' },
          { name: 'Pass the Pre-work Assessment', type: 'assessment', tag: 'required' },
          { name: 'Register for and attend full Certification Welcome Sessions', type: 'ilt' },
        ],
      },
    ],
  },
  {
    id: 'hr-sales',
    name: 'HR — Sales Consultant',
    tag: 'HR',
    note: 'Become a Sage 300 People Certified Sales Consultant via the certification learning package and sales assessment.',
    groups: [
      { label: 'Certification Learning — On-demand', mods: [{ name: 'Sales Certification Learning Package', type: 'video', desc: 'On-demand course package' }] },
      {
        label: 'Certification flow',
        mods: [
          { name: 'Complete Sales Certification Learning Package', type: 'stage' },
          { name: 'Pass the Sales Certification Assessment', type: 'assessment', tag: 'required' },
        ],
      },
    ],
  },
  {
    id: 'cpd',
    name: 'Already certified? — CPD',
    tag: 'HR',
    note: 'For consultants who completed the Sage 300 People HR certification: refresh knowledge and earn badges.',
    groups: [
      {
        label: 'Continuing professional development',
        mods: [{ name: 'View continuing development training (Sage U)', type: 'link', desc: 'Separate training catalogue available' }],
      },
    ],
  },
]

// ── Generic fallback path for products without a curated path set ──────────────
function genericPaths(product: Product): TrainingPath[] {
  return [
    {
      id: 'core',
      name: 'Core Learning',
      tag: 'Core path',
      note: `Foundational learning toward the ${product.cert} certification.`,
      groups: [
        {
          label: 'Core Learning',
          mods: [
            { name: `${product.name}: Getting Started`, type: 'video' },
            { name: 'Foundations', type: 'video' },
            { name: product.course, type: 'ilt' },
            { name: 'Configuration & Reporting', type: 'video' },
          ],
        },
        {
          label: 'Get Certified',
          mods: [{ name: `${product.cert} assessment`, type: 'assessment', tag: 'required' }],
        },
      ],
    },
  ]
}

/** The learning paths for a product (curated where available, else generic). */
export function pathsFor(product: ProductId): TrainingPath[] {
  if (product === 'intacct') return INTACCT_PATHS
  if (product === 'x3') return X3_PATHS
  if (product === 'payroll') return PAYROLL_PATHS
  if (product === '300people') return PEOPLE300_PATHS
  return genericPaths(productById(product))
}

// ── Legacy Sage U ILT session catalogue (reference data; ILT date is canonical) ─
export const iltSessions: IltSession[] = [
  { id: 'ilt-2026-06-16', course: IMPLEMENTING_COURSE, start_date: '2026-06-16', end_date: '2026-06-26', format: 'spread', register_by: '2026-06-13', seats_note: '2 seats' },
  { id: 'ilt-2026-06-22-fd', course: IMPLEMENTING_COURSE, start_date: '2026-06-22', end_date: '2026-06-26', format: 'fullday', register_by: '2026-06-19', seats_note: 'Waitlist' },
  { id: 'ilt-2026-06-22-sp', course: IMPLEMENTING_COURSE, start_date: '2026-06-22', end_date: '2026-07-02', format: 'spread', register_by: '2026-06-19', seats_note: '2 seats' },
  { id: 'ilt-2026-07-06', course: IMPLEMENTING_COURSE, start_date: '2026-07-06', end_date: '2026-07-16', format: 'spread', register_by: '2026-07-03', seats_note: '6 seats' },
  { id: 'ilt-2026-07-14', course: IMPLEMENTING_COURSE, start_date: '2026-07-14', end_date: '2026-07-23', format: 'spread', register_by: '2026-07-11', seats_note: '16 seats' },
  { id: 'ilt-2026-07-20-fd', course: IMPLEMENTING_COURSE, start_date: '2026-07-20', end_date: '2026-07-24', format: 'fullday', register_by: '2026-07-17', seats_note: '12 seats' },
  { id: 'ilt-2026-07-20-ev', course: IMPLEMENTING_COURSE, start_date: '2026-07-20', end_date: '2026-07-24', format: 'spread', register_by: '2026-07-17', seats_note: '20 seats' },
  { id: 'ilt-2026-07-21', course: IMPLEMENTING_COURSE, start_date: '2026-07-21', end_date: '2026-07-30', format: 'spread', register_by: '2026-07-18', seats_note: '19 seats' },
  { id: 'ilt-2026-08-17-fd', course: IMPLEMENTING_COURSE, start_date: '2026-08-17', end_date: '2026-08-21', format: 'fullday', register_by: '2026-08-14', seats_note: '18 seats' },
  { id: 'ilt-2026-08-18', course: IMPLEMENTING_COURSE, start_date: '2026-08-18', end_date: '2026-08-28', format: 'spread', register_by: '2026-08-15', seats_note: '19 seats' },
  { id: 'ilt-2026-08-24', course: IMPLEMENTING_COURSE, start_date: '2026-08-24', end_date: '2026-09-03', format: 'spread', register_by: '2026-08-21', seats_note: '20 seats' },
]

// ── Per-employee enrolments — seeded across multiple products ──────────────────
// Mirrors the prototype TRAINING_STATUS consultants:
//  • Lerato (emp-009) — Intacct, foundations done, ILT booked 24 Jul.
//  • Daniel (emp-010) — X3, foundations + ILT done, ILT was 26 Jun.
//  • Naledi (emp-011) — 300 People, nothing yet (pre-supervised).
// Sarah (emp-008, the current onboarding user) is intentionally left without an
// enrolment so the employee view demonstrates the first-run flow.
export const trainingEnrolments: TrainingEnrolment[] = [
  {
    employee_id: 'emp-009',
    product_id: 'intacct',
    cert_path: 'implementation',
    ilt_date: '2026-07-24',
    getting_started_done: true,
    ilt_done: false,
    certified: false,
    modules_done: {},
    updated_at: NOW,
  },
  {
    employee_id: 'emp-010',
    product_id: 'x3',
    cert_path: 'implementation',
    ilt_date: '2026-06-26',
    getting_started_done: true,
    ilt_done: true,
    certified: false,
    modules_done: {},
    updated_at: NOW,
  },
  {
    employee_id: 'emp-011',
    product_id: '300people',
    cert_path: 'implementation',
    ilt_date: null,
    getting_started_done: false,
    ilt_done: false,
    certified: false,
    modules_done: {},
    updated_at: NOW,
  },
]

// ── Pure helpers (no module state; safe to unit test) ─────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

/** Add `n` calendar days to an ISO date (YYYY-MM-DD). Returns YYYY-MM-DD. */
export function addCalendarDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10)
}

/** Find a legacy session by id. */
export function findSession(sessionId: string | null): IltSession | undefined {
  if (!sessionId) return undefined
  return iltSessions.find((s) => s.id === sessionId)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "20–24 Jul 2026" style range from two ISO dates. */
export function formatDateRange(startIso: string, endIso: string): string {
  const s = new Date(`${startIso}T00:00:00.000Z`)
  const e = new Date(`${endIso}T00:00:00.000Z`)
  const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()
  const sd = s.getUTCDate()
  const ed = e.getUTCDate()
  if (sameMonth) {
    return `${sd}–${ed} ${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`
  }
  return `${sd} ${MONTHS[s.getUTCMonth()]} – ${ed} ${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`
}

/** Single ISO date as "24 Jul 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00.000Z`)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Human label for a session: date range + format. */
export function formatSessionLabel(session: IltSession): string {
  const fmt = session.format === 'fullday' ? 'full-day week' : 'part-days'
  return `${formatDateRange(session.start_date, session.end_date)} (${fmt})`
}

/** Stable slug for a module name (matches the prototype's `slug`). */
export function slugify(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Module-completion key for a path/module within a product. */
export function moduleKey(product: ProductId, pathId: string, moduleName: string): string {
  return `${product}:${pathId}:${slugify(moduleName)}`
}

const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  supervised: 'Supervised-billable',
  ilt: 'ILT complete',
  certified: 'Certified',
}

/** The ISO "today" used for status. Overridable for deterministic tests. */
function todayIso(reference?: Date): string {
  return (reference ?? new Date()).toISOString().slice(0, 10)
}

/**
 * The 4-stage billable-readiness ladder (HANDOFF §4) — the single source of
 * truth the Training screen AND the dashboard pipeline derive from a
 * consultant's flags:
 *   Pre-supervised → Supervised-billable → ILT complete → Certified.
 * Pure: depends only on its input.
 */
export function billableStage(d: {
  getting_started_done: boolean
  ilt_done: boolean
  certified: boolean
}): BillableStage {
  if (d.certified) return 'certified'
  if (d.ilt_done) return 'ilt'
  if (d.getting_started_done) return 'supervised'
  return 'pre'
}

/**
 * Project the three dated billable milestones for a consultant from their start
 * date + the ILT date they entered. Pure: depends only on its inputs.
 *  • supervised = start + 7 days
 *  • ilt        = the entered ILT date
 *  • certified  = ILT date + 10 days
 */
export function computeMilestones(
  employee: Pick<Employee, 'start_date'>,
  enrolment: TrainingEnrolment | undefined,
  reference?: Date,
): BillableMilestone[] {
  const today = todayIso(reference)
  const iltDate = enrolment?.ilt_date ?? null

  const supervisedDate = employee.start_date
    ? addCalendarDays(employee.start_date, SUPERVISED_OFFSET_DAYS)
    : null
  const certifiedDate = iltDate ? addCalendarDays(iltDate, CERT_PREP_DAYS) : null

  const status = (done: boolean, date: string | null): BillableMilestone['status'] => {
    if (done) return 'done'
    if (date && date < today) return 'pending'
    return 'on_track'
  }

  return [
    {
      key: 'supervised',
      label: MILESTONE_LABELS.supervised,
      date: supervisedDate,
      status: status(Boolean(enrolment?.getting_started_done), supervisedDate),
    },
    {
      key: 'ilt',
      label: MILESTONE_LABELS.ilt,
      date: iltDate,
      status: status(Boolean(enrolment?.ilt_done), iltDate),
    },
    {
      key: 'certified',
      label: MILESTONE_LABELS.certified,
      date: certifiedDate,
      status: status(Boolean(enrolment?.certified), certifiedDate),
    },
  ]
}

/** The next milestone a consultant has not yet reached, or null when certified. */
export function nextMilestone(milestones: BillableMilestone[]): MilestoneKey | null {
  const next = milestones.find((m) => m.status !== 'done')
  return next ? next.key : null
}

/** Count modules done / total for one learning path against a completion map. */
export function computePathProgress(
  product: ProductId,
  path: TrainingPath,
  modulesDone: Record<string, boolean>,
): PathProgress {
  let total = 0
  let done = 0
  for (const group of path.groups) {
    for (const mod of group.mods) {
      total += 1
      if (modulesDone[moduleKey(product, path.id, mod.name)]) done += 1
    }
  }
  return { path_id: path.id, done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

/** Overall modules done / total across every path for a product. */
export function computeOverallProgress(
  product: ProductId,
  modulesDone: Record<string, boolean>,
): { done: number; total: number; percent: number } {
  let total = 0
  let done = 0
  for (const path of pathsFor(product)) {
    const p = computePathProgress(product, path, modulesDone)
    total += p.total
    done += p.done
  }
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}
