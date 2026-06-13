// PULSE constants — Jera Consulting

export const APP_NAME = 'PULSE'
export const APP_TAGLINE = 'The heartbeat of your team'
export const COMPANY_NAME = 'Jera Consulting (Pty) Ltd'
export const COMPANY_ADDRESS = '256 Rondebult Rd, Parkdene, Boksburg, 1459, Gauteng'
export const COMPANY_PHONE = '+27 11 913 3320'
export const COMPANY_REG = '1988/007393/07'
export const COMPANY_VAT = '4210112126'

// SARS 2026 rates (from Jera Travel Policy HR008)
export const SARS_KM_RATE = 1.50          // R per km for personal vehicle
export const SARS_PER_DIEM_FULL = 522     // R per full day domestic
export const SARS_PER_DIEM_HALF = 261     // R per half day (< 12 hours)

// Expense claim deadline
export const EXPENSE_DEADLINE_DAY = 25     // Submit by the 25th of each month

// Accommodation caps (from Travel Policy)
export const ACCOM_CITY_MAX = 1500         // R per night (JHB, CPT, DBN)
export const ACCOM_REGIONAL_MAX = 900      // R per night (smaller towns)

// Onboarding
export const TOTAL_POLICIES = 20
export const TOTAL_SOPS = 4
export const TOTAL_FORMS = 5

// SA Provinces (for address forms)
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
]

// SA Banks (for banking details form)
export const SA_BANKS = [
  'ABSA',
  'African Bank',
  'Capitec',
  'Discovery Bank',
  'FNB (First National Bank)',
  'Investec',
  'Nedbank',
  'Standard Bank',
  'TymeBank',
  'Other',
]

// Account types
export const ACCOUNT_TYPES = [
  'Cheque / Current',
  'Savings',
  'Transmission',
]

// Leave types (for future use)
export const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', days: 15 },
  { value: 'sick', label: 'Sick Leave', days: 15 },
  { value: 'maternity', label: 'Maternity Leave', days: '4 months' },
  { value: 'paternity', label: 'Paternity Leave', days: 10 },
  { value: 'family', label: 'Family Responsibility', days: 3 },
  { value: 'study', label: 'Study Leave', days: 'Per approval' },
  { value: 'religious', label: 'Religious Leave', days: 'Unpaid' },
  { value: 'unpaid', label: 'Unpaid Leave', days: 'N/A' },
  { value: 'compassionate', label: 'Compassionate Leave', days: 'Per approval' },
]

// Avatar colours (assign to employees for visual variety)
export const AVATAR_COLOURS = [
  '#911431', // Jera Red
  '#2b72b9', // Jera Blue
  '#db4fb2', // Jera Pink
  '#2D8A56', // Green
  '#C4880C', // Amber
  '#6366f1', // Indigo
  '#0891b2', // Cyan
  '#be185d', // Rose
]

// SOP keys
export const SOP_KEYS = ['projects', 'desk', 'timekeeping', 'client_access'] as const

// Form keys
export const FORM_KEYS = ['personal', 'emergency', 'tax', 'policies', 'goals'] as const
