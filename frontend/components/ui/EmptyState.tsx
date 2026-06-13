import type { ReactNode } from 'react'

export interface EmptyStateProps {
  /** Large emoji or icon node. */
  icon?: ReactNode
  /** Bold headline. */
  title: string
  /** Muted supporting copy. */
  description?: string
  /** Optional call-to-action node (e.g. a Button). */
  action?: ReactNode
  className?: string
}

/**
 * Centered empty / zero-data placeholder: icon, title, description, optional action.
 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      {icon ? <div className="mb-3 text-[40px] leading-none">{icon}</div> : null}
      <h3 className="text-base font-bold text-text">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export default EmptyState
