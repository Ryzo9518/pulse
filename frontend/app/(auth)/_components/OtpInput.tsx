'use client'

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

const LENGTH = 6

export interface OtpInputProps {
  /** Current code value as an array of single-character strings (length 6). */
  value: string[]
  /** Called with the next 6-slot array whenever the code changes. */
  onChange: (next: string[]) => void
}

/**
 * Six single-digit inputs with auto-advance, backspace-to-previous, and paste
 * of a full 6-digit code. Digits only. Mirrors the prototype's OTP behaviour
 * (docs/pulse_v4_prototype.html `otpInputs` handlers).
 */
export function OtpInput({ value, onChange }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  function focusBox(idx: number) {
    const el = refs.current[idx]
    if (el) el.focus()
  }

  function handleChange(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[idx] = digit
    onChange(next)
    if (digit && idx < LENGTH - 1) focusBox(idx + 1)
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      e.preventDefault()
      const next = [...value]
      next[idx - 1] = ''
      onChange(next)
      focusBox(idx - 1)
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!data) return
    const next = Array.from({ length: LENGTH }, (_, i) => data[i] ?? '')
    onChange(next)
    focusBox(Math.min(data.length, LENGTH - 1))
  }

  return (
    <div className="my-2 flex justify-center gap-2" role="group" aria-label="6-digit verification code">
      {Array.from({ length: LENGTH }).map((_, idx) => {
        const filled = Boolean(value[idx])
        return (
          <input
            key={idx}
            ref={(el) => {
              refs.current[idx] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${idx + 1}`}
            value={value[idx] ?? ''}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={`h-14 w-12 rounded-btn border-2 bg-surface text-center font-mono text-2xl font-extrabold text-text outline-none transition-all duration-200 focus:border-jera-red focus:ring-[3px] focus:ring-jera-red/20 ${
              filled ? 'border-jera-green bg-jera-green/5' : 'border-surface-border'
            }`}
          />
        )
      })}
    </div>
  )
}

export const OTP_LENGTH = LENGTH

export default OtpInput
