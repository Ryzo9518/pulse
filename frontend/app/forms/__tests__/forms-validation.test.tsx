import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'

import { __resetMockState } from '@/lib/mock'

import { PersonalForm } from '../PersonalForm'
import { TaxForm } from '../TaxForm'
import { isValidSaId, validateForm } from '../forms-config'

// Forms track completion in local state (no mock mutation), but reset defensively
// in case a future change wires a mutator in.
beforeEach(() => {
  __resetMockState()
})

/**
 * Small harness that mirrors how app/forms/page.tsx drives a form: it renders the
 * form and exposes a live "X of N" completion count that increments when the
 * form calls onComplete. Lets us assert progress advances on a valid save.
 */
function FormHarness({
  Form,
}: {
  Form: typeof PersonalForm | typeof TaxForm
}) {
  const [done, setDone] = useState(0)
  return (
    <div>
      <div data-testid="progress">{done} of 5 forms completed</div>
      <Form onComplete={() => setDone((n) => n + 1)} onBack={() => {}} />
    </div>
  )
}

function fillInput(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('isValidSaId', () => {
  it('accepts a valid 13-digit SA ID (correct Luhn + date)', () => {
    // 8001015009087 is a commonly used valid SA ID test number.
    expect(isValidSaId('8001015009087')).toBe(true)
  })

  it('rejects a 13-digit number with a bad check digit', () => {
    expect(isValidSaId('8001015009088')).toBe(false)
  })

  it('rejects a too-short numeric ID', () => {
    expect(isValidSaId('123456')).toBe(false)
  })

  it('rejects an ID with an impossible month', () => {
    // Month "13" — invalid even if length is right.
    expect(isValidSaId('8013015009087')).toBe(false)
  })

  it('accepts an alphanumeric passport-style identifier', () => {
    expect(isValidSaId('A1234567')).toBe(true)
  })
})

describe('validateForm — personal', () => {
  it('flags every required field when all are empty', () => {
    const errors = validateForm('personal', {})
    expect(errors.firstName).toBeDefined()
    expect(errors.lastName).toBeDefined()
    expect(errors.idNumber).toBeDefined()
    expect(errors.dob).toBeDefined()
    expect(errors.province).toBeDefined()
    expect(errors.cell).toBeDefined()
  })

  it('returns no errors when required fields are present and ID is valid', () => {
    const errors = validateForm('personal', {
      firstName: 'Thandi',
      lastName: 'Mokoena',
      idNumber: '8001015009087',
      dob: '1980-01-01',
      province: 'Gauteng',
      cell: '+27 82 555 1234',
    })
    expect(errors).toEqual({})
  })
})

describe('PersonalForm', () => {
  it('marks complete and increments progress when required fields are valid', () => {
    render(<FormHarness Form={PersonalForm} />)
    expect(screen.getByTestId('progress')).toHaveTextContent('0 of 5')

    fillInput('First Name', 'Thandi')
    fillInput('Last Name', 'Mokoena')
    fillInput('ID Number / Passport', '8001015009087')
    fillInput('Date of Birth', '1980-01-01')
    fillInput('Province', 'Gauteng')
    fillInput('Cell Phone', '+27 82 555 1234')

    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }))

    expect(screen.getByTestId('progress')).toHaveTextContent('1 of 5')
    // No validation errors surfaced.
    expect(screen.queryByText(/this field is required/i)).toBeNull()
  })

  it('shows a validation error and does NOT increment when a required field is empty', () => {
    const onComplete = vi.fn()
    render(<PersonalForm onComplete={onComplete} onBack={() => {}} />)

    // Fill everything except Last Name.
    fillInput('First Name', 'Thandi')
    fillInput('ID Number / Passport', '8001015009087')
    fillInput('Date of Birth', '1980-01-01')
    fillInput('Province', 'Gauteng')
    fillInput('Cell Phone', '+27 82 555 1234')

    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }))

    expect(onComplete).not.toHaveBeenCalled()
    expect(screen.getAllByText(/this field is required/i).length).toBeGreaterThan(0)
  })

  it('rejects an invalid SA ID number even when other required fields are filled', () => {
    const onComplete = vi.fn()
    render(<PersonalForm onComplete={onComplete} onBack={() => {}} />)

    fillInput('First Name', 'Thandi')
    fillInput('Last Name', 'Mokoena')
    fillInput('ID Number / Passport', '8001015009088') // bad check digit
    fillInput('Date of Birth', '1980-01-01')
    fillInput('Province', 'Gauteng')
    fillInput('Cell Phone', '+27 82 555 1234')

    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }))

    expect(onComplete).not.toHaveBeenCalled()
    expect(screen.getByText(/valid sa id/i)).toBeInTheDocument()
  })
})

describe('TaxForm', () => {
  it('blocks save until the consent checkbox is ticked', () => {
    const onComplete = vi.fn()
    render(<TaxForm onComplete={onComplete} onBack={() => {}} />)

    fillInput('Tax Reference Number', '1234567890')
    fillInput('Bank Name', 'Capitec')
    fillInput('Account Holder Name', 'T Mokoena')
    fillInput('Account Number', '1234567890')
    fillInput('Account Type', 'Savings')

    // Save without consent -> blocked.
    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }))
    expect(onComplete).not.toHaveBeenCalled()
    expect(screen.getByText(/must confirm these details/i)).toBeInTheDocument()

    // Tick consent and retry -> completes.
    fireEvent.click(screen.getByLabelText(/i confirm that the banking and tax details/i))
    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('rejects a non-numeric account number', () => {
    const onComplete = vi.fn()
    render(<TaxForm onComplete={onComplete} onBack={() => {}} />)

    fillInput('Tax Reference Number', '1234567890')
    fillInput('Bank Name', 'Capitec')
    fillInput('Account Holder Name', 'T Mokoena')
    fillInput('Account Number', 'ABC123') // invalid format
    fillInput('Account Type', 'Savings')
    fireEvent.click(screen.getByLabelText(/i confirm that the banking and tax details/i))

    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }))
    expect(onComplete).not.toHaveBeenCalled()
    expect(screen.getByText(/6–12 digits/i)).toBeInTheDocument()
  })
})
