import type { ReactNode } from 'react'

export interface StatCardGridProps {
  /** Stat cards (or any tiles) to lay out responsively. */
  children: ReactNode
  className?: string
}

/**
 * Responsive wrapper for stat cards: 2 columns below 900px, 4 columns at/above.
 * Gives every screen one consistent stat grid instead of re-specifying the rule.
 */
export function StatCardGrid({ children, className = '' }: StatCardGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 min-[900px]:grid-cols-4 ${className}`}>
      {children}
    </div>
  )
}

export default StatCardGrid
