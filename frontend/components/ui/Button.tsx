import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-jera-red text-white hover:bg-jera-red/90 hover:shadow-red-glow disabled:bg-text-muted/40 disabled:shadow-none',
  secondary:
    'bg-jera-blue text-white hover:bg-jera-blue/90 disabled:bg-text-muted/40',
  ghost:
    'bg-surface border border-surface-border text-text-secondary hover:bg-surface-border-light hover:border-surface-border disabled:opacity-50',
  danger:
    'bg-jera-red text-white hover:bg-jera-red/90 disabled:bg-text-muted/40',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-[5px] text-xs rounded-badge',
  md: 'px-5 py-[10px] text-[13px] rounded-btn',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Icon rendered before the label. */
  leftIcon?: ReactNode
  /** Stretch to full width and centre content. */
  fullWidth?: boolean
  children?: ReactNode
}

/**
 * Standard button. Variants: primary / secondary / ghost / danger. Sizes: sm / md.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center gap-[7px] font-display font-semibold transition-all duration-200 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full justify-center' : ''} ${className}`}
      {...rest}
    >
      {leftIcon ? <span className="inline-flex items-center">{leftIcon}</span> : null}
      {children}
    </button>
  )
}

export default Button
