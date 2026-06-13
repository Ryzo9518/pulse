'use client'

import { useState } from 'react'

import { Button, Card, Input, Select } from '@/components/ui'
import { SA_PROVINCES } from '@/lib/constants'

import {
  validateForm,
  type FieldErrors,
  type FormValues,
} from './forms-config'

export interface FormSubViewProps {
  /** Called with no args when the form passes validation on Save. */
  onComplete: () => void
  /** Back to the forms overview. */
  onBack: () => void
}

const PROVINCE_OPTIONS = SA_PROVINCES.map((p) => ({ value: p, label: p }))
const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

/** Form 1 of 5 — Personal Information. */
export function PersonalForm({ onComplete, onBack }: FormSubViewProps) {
  const [values, setValues] = useState<FormValues>({})
  const [errors, setErrors] = useState<FieldErrors>({})

  const set = (name: string) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }))

  const handleSave = () => {
    const found = validateForm('personal', values)
    setErrors(found)
    if (Object.keys(found).length === 0) onComplete()
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            value={values.firstName ?? ''}
            onChange={set('firstName')}
            error={errors.firstName}
          />
          <Input
            label="Last Name"
            name="lastName"
            value={values.lastName ?? ''}
            onChange={set('lastName')}
            error={errors.lastName}
          />
        </div>
        <Input
          label="ID Number / Passport"
          name="idNumber"
          placeholder="SA ID or passport number"
          value={values.idNumber ?? ''}
          onChange={set('idNumber')}
          error={errors.idNumber}
        />
        <Input
          label="Date of Birth"
          name="dob"
          type="date"
          value={values.dob ?? ''}
          onChange={set('dob')}
          error={errors.dob}
        />
        <Select
          label="Gender"
          name="gender"
          placeholder="Select…"
          options={GENDER_OPTIONS}
          value={values.gender ?? ''}
          onChange={set('gender')}
        />
        <Input
          label="Nationality"
          name="nationality"
          placeholder="e.g. South African"
          value={values.nationality ?? ''}
          onChange={set('nationality')}
        />
        <Input
          label="Home Language"
          name="language"
          placeholder="e.g. English, Afrikaans, Zulu"
          value={values.language ?? ''}
          onChange={set('language')}
        />
        <div className="my-1 border-t border-surface-border-light" />
        <Input
          label="Home Address"
          name="address"
          placeholder="Street address"
          value={values.address ?? ''}
          onChange={set('address')}
        />
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          <Input
            label="City / Town"
            name="city"
            value={values.city ?? ''}
            onChange={set('city')}
          />
          <Select
            label="Province"
            name="province"
            placeholder="Select…"
            options={PROVINCE_OPTIONS}
            value={values.province ?? ''}
            onChange={set('province')}
            error={errors.province}
          />
        </div>
        <Input
          label="Postal Code"
          name="postal"
          placeholder="e.g. 1459"
          className="max-w-[160px]"
          value={values.postal ?? ''}
          onChange={set('postal')}
        />
        <div className="my-1 border-t border-surface-border-light" />
        <Input
          label="Cell Phone"
          name="cell"
          type="tel"
          placeholder="+27 ..."
          value={values.cell ?? ''}
          onChange={set('cell')}
          error={errors.cell}
        />
        <Input
          label="Personal Email"
          name="email"
          type="email"
          placeholder="your.email@gmail.com"
          value={values.email ?? ''}
          onChange={set('email')}
        />
        <div className="mt-2 flex gap-2">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button variant="primary" fullWidth onClick={handleSave}>
            Save &amp; Continue →
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default PersonalForm
