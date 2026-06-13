// Shared config + validation for the My Forms screen (Unit 8).
//
// FORM_KEYS lives in @/lib/constants; this module adds the presentation metadata
// (icon, title, description) and the client-side required-field validation rules
// that the prototype's FORMS_LIST + saveForm() implied. Kept framework-free so
// the validators can be unit-tested in isolation.

import type { FormKey } from '@/types/database'

export interface FormMeta {
  key: FormKey
  icon: string
  title: string
  description: string
  /** Position label, e.g. "Form 1 of 5". */
  index: number
}

// Order mirrors FORM_KEYS in @/lib/constants and the prototype FORMS_LIST.
export const FORMS_META: FormMeta[] = [
  {
    key: 'personal',
    icon: '📋',
    title: 'Personal Information',
    description: 'Name, ID, address, contact details',
    index: 1,
  },
  {
    key: 'emergency',
    icon: '🚨',
    title: 'Emergency Contact Details',
    description: 'Two emergency contacts + medical info',
    index: 2,
  },
  {
    key: 'tax',
    icon: '🏦',
    title: 'Tax & Banking Details',
    description: 'SARS tax ref, bank account for payroll',
    index: 3,
  },
  {
    key: 'policies',
    icon: '📖',
    title: 'Company Policies & Handbook',
    description: 'Read and acknowledge Jera policies',
    index: 4,
  },
  {
    key: 'goals',
    icon: '🎯',
    title: '30-60-90 Day Goals',
    description: 'Set your first 90-day objectives',
    index: 5,
  },
]

export function getFormMeta(key: FormKey): FormMeta {
  const meta = FORMS_META.find((f) => f.key === key)
  if (!meta) throw new Error(`Unknown form key: ${key}`)
  return meta
}

// ── Validation ───────────────────────────────────────────────────────────────
// A validator takes the form's value record and returns a map of fieldName ->
// error message for every invalid field. An empty object means the form is valid
// and may be marked complete. Screens pass these errors straight to Input/Select
// `error` props.

export type FieldErrors = Record<string, string>

const REQUIRED = 'This field is required'

function isBlank(value: string | undefined | null): boolean {
  return value === undefined || value === null || value.trim() === ''
}

/**
 * Validate a South African 13-digit ID number.
 *
 * Rule used: exactly 13 digits, a valid calendar date in the YYMMDD prefix, and
 * a correct Luhn check digit (the SA ID standard). A non-SA passport is accepted
 * when the value contains a non-digit character (treated as a passport string),
 * so foreign nationals are not blocked — only an all-numeric value that *looks*
 * like an SA ID but fails the checks is rejected.
 */
export function isValidSaId(raw: string): boolean {
  const value = raw.trim()
  // Passport / non-numeric identifier: accept as long as it is non-trivial.
  if (!/^\d+$/.test(value)) return value.length >= 4
  if (value.length !== 13) return false

  // Date-of-birth sanity check on YYMMDD.
  const month = Number(value.slice(2, 4))
  const day = Number(value.slice(4, 6))
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  // Luhn checksum across all 13 digits.
  let sum = 0
  let alternate = false
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = Number(value[i])
    if (alternate) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    alternate = !alternate
  }
  return sum % 10 === 0
}

export type FormValues = Record<string, string>

/** Per-form required-field + format validators, keyed by FormKey. */
export const VALIDATORS: Record<
  Exclude<FormKey, 'policies'>,
  (values: FormValues) => FieldErrors
> = {
  personal(values) {
    const errors: FieldErrors = {}
    if (isBlank(values.firstName)) errors.firstName = REQUIRED
    if (isBlank(values.lastName)) errors.lastName = REQUIRED
    if (isBlank(values.idNumber)) {
      errors.idNumber = REQUIRED
    } else if (!isValidSaId(values.idNumber)) {
      errors.idNumber = 'Enter a valid SA ID (13 digits) or passport number'
    }
    if (isBlank(values.dob)) errors.dob = REQUIRED
    if (isBlank(values.province)) errors.province = REQUIRED
    if (isBlank(values.cell)) errors.cell = REQUIRED
    return errors
  },
  emergency(values) {
    const errors: FieldErrors = {}
    if (isBlank(values.contact1Name)) errors.contact1Name = REQUIRED
    if (isBlank(values.contact1Cell)) errors.contact1Cell = REQUIRED
    if (isBlank(values.contact2Name)) errors.contact2Name = REQUIRED
    if (isBlank(values.contact2Cell)) errors.contact2Cell = REQUIRED
    if (values.consent !== 'true') errors.consent = 'You must provide consent to continue'
    return errors
  },
  tax(values) {
    const errors: FieldErrors = {}
    if (isBlank(values.taxRef)) errors.taxRef = REQUIRED
    if (isBlank(values.bankName)) errors.bankName = REQUIRED
    if (isBlank(values.accountHolder)) errors.accountHolder = REQUIRED
    if (isBlank(values.accountNumber)) {
      errors.accountNumber = REQUIRED
    } else if (!/^\d{6,12}$/.test(values.accountNumber.trim())) {
      errors.accountNumber = 'Account number must be 6–12 digits'
    }
    if (isBlank(values.accountType)) errors.accountType = REQUIRED
    if (values.consent !== 'true') errors.consent = 'You must confirm these details to continue'
    return errors
  },
  goals(values) {
    const errors: FieldErrors = {}
    if (isBlank(values.goal30_1)) errors.goal30_1 = REQUIRED
    if (isBlank(values.goal60_1)) errors.goal60_1 = REQUIRED
    if (isBlank(values.goal90_1)) errors.goal90_1 = REQUIRED
    return errors
  },
}

/** Validate a non-policy form by key. Returns field errors ({} when valid). */
export function validateForm(
  key: Exclude<FormKey, 'policies'>,
  values: FormValues,
): FieldErrors {
  return VALIDATORS[key](values)
}
