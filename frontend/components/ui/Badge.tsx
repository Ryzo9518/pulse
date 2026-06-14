import type { ReactNode } from 'react'

export type BadgeColor = 'red' | 'blue' | 'green' | 'amber' | 'pink' | 'grey'

const COLOR_CLASSES: Record<BadgeColor, string> = {
  red: 'bg-jera-red/15 text-jera-red border-jera-red/30',
  blue: 'bg-jera-blue/15 text-jera-blue border-jera-blue/30',
  green: 'bg-jera-green/15 text-jera-green border-jera-green/30',
  amber: 'bg-jera-amber/15 text-jera-amber border-jera-amber/30',
  pink: 'bg-jera-pink/15 text-jera-pink border-jera-pink/30',
  grey: 'bg-text-muted/15 text-text-secondary border-text-muted/30',
}

export interface BadgeProps {
  children: ReactNode
  /** Drives text, background (15% opacity) and border (30% opacity). */
  color?: BadgeColor
  className?: string
}

/**
 * Inline status pill. Colour at 15% background / 30% border, full-strength text.
 */
export function Badge({ children, color = 'grey', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-badge border px-[9px] py-[2px] text-[11px] font-semibold ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
