import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the input. */
  label?: string
  /** Error text rendered in red beneath the input; also reddens the border. */
  error?: string
  /** Optional hint text shown beneath when there is no error. */
  hint?: ReactNode
}

/**
 * Text input with label, red focus ring, and optional error state.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = '', id, ...rest },
  ref,
) {
  const reactId = useId()
  const inputId = id ?? rest.name ?? reactId
  const describedById = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  return (
    <div className="flex flex-col">
      {label ? (
        <label htmlFor={inputId} className="mb-[5px] block text-[13px] font-semibold text-text-secondary">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`w-full rounded-btn border-[1.5px] bg-white px-[14px] py-[11px] font-display text-sm text-text outline-none transition-all duration-200 focus:ring-2 focus:ring-jera-red/20 ${
          error ? 'border-jera-red focus:border-jera-red' : 'border-surface-border focus:border-jera-red'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <span id={describedById} className="mt-[5px] text-xs text-jera-red">
          {error}
        </span>
      ) : hint ? (
        <span id={describedById} className="mt-[5px] text-xs text-text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  )
})

export default Input
