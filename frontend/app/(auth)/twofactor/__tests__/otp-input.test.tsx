import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'

import { OtpInput, OTP_LENGTH } from '../../_components/OtpInput'

// Controlled host: mirrors how the 2FA page drives the OTP component.
function Host() {
  const [value, setValue] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ''),
  )
  return <OtpInput value={value} onChange={setValue} />
}

function boxes() {
  return screen.getAllByRole('textbox') as HTMLInputElement[]
}

describe('OtpInput', () => {
  it('auto-advances focus to the next box after a digit is entered', () => {
    render(<Host />)
    const [first, second] = boxes()

    fireEvent.change(first, { target: { value: '1' } })

    expect(first.value).toBe('1')
    expect(second).toHaveFocus()
  })

  it('ignores non-digit characters', () => {
    render(<Host />)
    const [first] = boxes()

    fireEvent.change(first, { target: { value: 'a' } })

    expect(first.value).toBe('')
  })

  it('moves focus back and clears the previous box on backspace in an empty box', () => {
    render(<Host />)
    const [first, second] = boxes()

    fireEvent.change(first, { target: { value: '1' } }) // fills box 0, focus -> box 1
    fireEvent.keyDown(second, { key: 'Backspace' }) // box 1 empty -> clear box 0, focus box 0

    expect(first).toHaveFocus()
    expect(first.value).toBe('')
  })

  it('distributes a pasted 6-digit code across all boxes', () => {
    render(<Host />)
    const all = boxes()

    fireEvent.paste(all[0], {
      clipboardData: { getData: () => '123456' },
    })

    expect(all.map((b) => b.value)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('strips non-digits from a pasted code and only fills available digits', () => {
    render(<Host />)
    const all = boxes()

    fireEvent.paste(all[0], {
      clipboardData: { getData: () => '12-34ab' },
    })

    expect(all.map((b) => b.value)).toEqual(['1', '2', '3', '4', '', ''])
  })
})
