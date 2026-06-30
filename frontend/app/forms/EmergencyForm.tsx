'use client'

import { useState } from 'react'

import { Button, Card, Input, Select } from '@/components/ui'

import { ConsentCheckbox } from './ConsentCheckbox'
import { type FormSubViewProps, SaveError } from './PersonalForm'
import {
  validateForm,
  type FieldErrors,
  type FormValues,
} from './forms-config'
import { useFormPersistence } from './useFormPersistence'

const RELATIONSHIP_OPTIONS = [
  { value: 'Spouse / Partner', label: 'Spouse / Partner' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Child', label: 'Child' },
  { value: 'Other Family', label: 'Other Family' },
  { value: 'Friend', label: 'Friend' },
]

/** Form 2 of 5 — Emergency Contact Details + medical info + consent. */
export function EmergencyForm({ onComplete, onBack }: FormSubViewProps) {
  const [values, setValues] = useState<FormValues>({})
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const { saving, saveError, persist } = useFormPersistence('emergency', setValues)

  const set = (name: string) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }))

  const handleSave = () => {
    const found = validateForm('emergency', {
      ...values,
      consent: consent ? 'true' : 'false',
    })
    setErrors(found)
    if (Object.keys(found).length === 0) persist(values, onComplete)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Primary Emergency Contact">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <Input
              label="Full Name"
              name="contact1Name"
              value={values.contact1Name ?? ''}
              onChange={set('contact1Name')}
              error={errors.contact1Name}
            />
            <Select
              label="Relationship"
              name="contact1Rel"
              placeholder="Select…"
              options={RELATIONSHIP_OPTIONS}
              value={values.contact1Rel ?? ''}
              onChange={set('contact1Rel')}
            />
          </div>
          <Input
            label="Address"
            name="contact1Address"
            value={values.contact1Address ?? ''}
            onChange={set('contact1Address')}
          />
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <Input
              label="Cell Phone"
              name="contact1Cell"
              type="tel"
              placeholder="+27 ..."
              value={values.contact1Cell ?? ''}
              onChange={set('contact1Cell')}
              error={errors.contact1Cell}
            />
            <Input
              label="Home Phone"
              name="contact1Home"
              type="tel"
              placeholder="Optional"
              value={values.contact1Home ?? ''}
              onChange={set('contact1Home')}
            />
          </div>
        </div>
      </Card>

      <Card title="Secondary Emergency Contact">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <Input
              label="Full Name"
              name="contact2Name"
              value={values.contact2Name ?? ''}
              onChange={set('contact2Name')}
              error={errors.contact2Name}
            />
            <Select
              label="Relationship"
              name="contact2Rel"
              placeholder="Select…"
              options={RELATIONSHIP_OPTIONS}
              value={values.contact2Rel ?? ''}
              onChange={set('contact2Rel')}
            />
          </div>
          <Input
            label="Address"
            name="contact2Address"
            value={values.contact2Address ?? ''}
            onChange={set('contact2Address')}
          />
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <Input
              label="Cell Phone"
              name="contact2Cell"
              type="tel"
              placeholder="+27 ..."
              value={values.contact2Cell ?? ''}
              onChange={set('contact2Cell')}
              error={errors.contact2Cell}
            />
            <Input
              label="Home Phone"
              name="contact2Home"
              type="tel"
              placeholder="Optional"
              value={values.contact2Home ?? ''}
              onChange={set('contact2Home')}
            />
          </div>
        </div>
      </Card>

      <Card title="Medical Contact Info">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <Input
              label="Doctor Name"
              name="doctorName"
              value={values.doctorName ?? ''}
              onChange={set('doctorName')}
            />
            <Input
              label="Doctor Phone"
              name="doctorPhone"
              type="tel"
              value={values.doctorPhone ?? ''}
              onChange={set('doctorPhone')}
            />
          </div>
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <Input
              label="Medical Aid Provider"
              name="medicalAid"
              placeholder="e.g. Discovery, Bonitas"
              value={values.medicalAid ?? ''}
              onChange={set('medicalAid')}
            />
            <Input
              label="Medical Aid Number"
              name="medicalAidNumber"
              value={values.medicalAidNumber ?? ''}
              onChange={set('medicalAidNumber')}
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="allergies"
              className="mb-[5px] block text-[13px] font-semibold text-text-secondary"
            >
              Allergies / Medical Conditions
            </label>
            <textarea
              id="allergies"
              name="allergies"
              placeholder="List any allergies or conditions we should know about…"
              value={values.allergies ?? ''}
              onChange={set('allergies')}
              className="min-h-[60px] w-full rounded-btn border-[1.5px] border-surface-border bg-white px-[14px] py-[11px] font-display text-sm text-text outline-none transition-all duration-200 focus:border-jera-red focus:ring-2 focus:ring-jera-red/20"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <ConsentCheckbox checked={consent} onChange={setConsent} error={errors.consent}>
            I voluntarily provide this contact information and authorise Jera
            Consulting (Pty) Ltd to contact the above on my behalf in the event
            of an emergency.
          </ConsentCheckbox>
        </div>
        <SaveError message={saveError} />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSave}
            isLoading={saving}
          >
            Save &amp; Continue →
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default EmergencyForm
