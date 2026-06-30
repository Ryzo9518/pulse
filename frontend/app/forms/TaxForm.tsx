'use client'

import { useState } from 'react'

import { Button, Card, Input, Select } from '@/components/ui'
import { ACCOUNT_TYPES, SA_BANKS } from '@/lib/constants'

import { ConsentCheckbox } from './ConsentCheckbox'
import { type FormSubViewProps, SaveError } from './PersonalForm'
import {
  validateForm,
  type FieldErrors,
  type FormValues,
} from './forms-config'
import { useFormPersistence } from './useFormPersistence'

const BANK_OPTIONS = SA_BANKS.map((b) => ({ value: b, label: b }))
const ACCOUNT_TYPE_OPTIONS = ACCOUNT_TYPES.map((t) => ({ value: t, label: t }))
const TAX_STATUS_OPTIONS = [
  { value: 'Standard (Code 3601)', label: 'Standard (Code 3601)' },
  { value: 'Director (Code 3616)', label: 'Director (Code 3616)' },
  { value: 'Independent Contractor', label: 'Independent Contractor' },
]

/** Form 3 of 5 — Tax & Banking Details + consent. */
export function TaxForm({ onComplete, onBack }: FormSubViewProps) {
  const [values, setValues] = useState<FormValues>({})
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const { saving, saveError, persist } = useFormPersistence('tax', setValues)

  const set = (name: string) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }))

  const handleSave = () => {
    const found = validateForm('tax', {
      ...values,
      consent: consent ? 'true' : 'false',
    })
    setErrors(found)
    if (Object.keys(found).length === 0) persist(values, onComplete)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Tax Information">
        <div className="flex flex-col gap-4">
          <Input
            label="Tax Reference Number"
            name="taxRef"
            placeholder="SARS tax number"
            value={values.taxRef ?? ''}
            onChange={set('taxRef')}
            error={errors.taxRef}
          />
          <Select
            label="Tax Status"
            name="taxStatus"
            placeholder="Select…"
            options={TAX_STATUS_OPTIONS}
            value={values.taxStatus ?? ''}
            onChange={set('taxStatus')}
          />
        </div>
      </Card>

      <Card title="Banking Details">
        <div className="flex flex-col gap-4">
          <Select
            label="Bank Name"
            name="bankName"
            placeholder="Select…"
            options={BANK_OPTIONS}
            value={values.bankName ?? ''}
            onChange={set('bankName')}
            error={errors.bankName}
          />
          <Input
            label="Account Holder Name"
            name="accountHolder"
            placeholder="Name as it appears on your account"
            value={values.accountHolder ?? ''}
            onChange={set('accountHolder')}
            error={errors.accountHolder}
          />
          <Input
            label="Account Number"
            name="accountNumber"
            value={values.accountNumber ?? ''}
            onChange={set('accountNumber')}
            error={errors.accountNumber}
          />
          <Input
            label="Branch Code"
            name="branchCode"
            placeholder="Universal branch code"
            value={values.branchCode ?? ''}
            onChange={set('branchCode')}
          />
          <Select
            label="Account Type"
            name="accountType"
            placeholder="Select…"
            options={ACCOUNT_TYPE_OPTIONS}
            value={values.accountType ?? ''}
            onChange={set('accountType')}
            error={errors.accountType}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <ConsentCheckbox checked={consent} onChange={setConsent} error={errors.consent}>
            I confirm that the banking and tax details provided are correct and
            authorise Jera Consulting (Pty) Ltd to use them for salary payments
            and statutory deductions.
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

export default TaxForm
