import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Field label rendered above the control. */
  label?: string
  /** Error text rendered in red beneath the control. */
  error?: string
  /** Options to render. If omitted, pass <option> children instead. */
  options?: SelectOption[]
  /** Optional placeholder shown as a disabled first option. */
  placeholder?: string
  children?: ReactNode
}

/**
 * Select control sharing the Input styling family (red focus ring, error state).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className = '', id, children, ...rest },
  ref,
) {
  const reactId = useId()
  const selectId = id ?? rest.name ?? reactId
  const describedById = error ? `${selectId}-error` : undefined
  return (
    <div className="flex flex-col">
      {label ? (
        <label htmlFor={selectId} className="mb-[5px] block text-[13px] font-semibold text-text-secondary">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`w-full rounded-btn border-[1.5px] bg-white px-[14px] py-[11px] font-display text-sm text-text outline-none transition-all duration-200 focus:ring-2 focus:ring-jera-red/20 ${
          error ? 'border-jera-red focus:border-jera-red' : 'border-surface-border focus:border-jera-red'
        } ${className}`}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <span id={describedById} className="mt-[5px] text-xs text-jera-red">
          {error}
        </span>
      ) : null}
    </div>
  )
})

export default Select
