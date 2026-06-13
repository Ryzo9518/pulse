'use client'

import { useId, type ReactNode } from 'react'

export interface ConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  /** Error text shown beneath when consent is required but unchecked. */
  error?: string
}

/**
 * Consent checkbox matching the prototype's form consent rows (jera-red accent).
 * Surfaces an error message the same way Input/Select do.
 */
export function ConsentCheckbox({
  checked,
  onChange,
  children,
  error,
}: ConsentCheckboxProps) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-[10px]">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="mt-[2px] h-[18px] w-[18px] flex-shrink-0 accent-jera-red"
        />
        <label htmlFor={id} className="text-[13px] leading-[1.5] text-text-secondary">
          {children}
        </label>
      </div>
      {error ? (
        <span id={errorId} className="mt-[5px] text-xs text-jera-red">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export default ConsentCheckbox
