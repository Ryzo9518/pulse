import type { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  /** Optional uppercase label rendered above the body (design-system "card-label"). */
  title?: string
  /** Optional custom header node, rendered instead of `title`. */
  header?: ReactNode
  className?: string
  /** Padding override; defaults to 24px (p-6). */
  padded?: boolean
}

/**
 * White surface card: surface-border, 14px radius, 24px padding, subtle shadow.
 */
export function Card({ children, title, header, className = '', padded = true }: CardProps) {
  return (
    <div
      className={`rounded-card border border-surface-border bg-surface-card shadow-card ${padded ? 'p-6' : ''} ${className}`}
    >
      {header ?? (title ? (
        <div className="mb-[14px] text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
          {title}
        </div>
      ) : null)}
      {children}
    </div>
  )
}

export default Card
