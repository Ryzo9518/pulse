import type { ReactNode } from 'react'

export type StatAccent = 'red' | 'blue' | 'green' | 'amber' | 'pink'

const ACCENT_BAR: Record<StatAccent, string> = {
  red: 'bg-jera-red',
  blue: 'bg-jera-blue',
  green: 'bg-jera-green',
  amber: 'bg-jera-amber',
  pink: 'bg-jera-pink',
}

export interface StatCardProps {
  /** The large headline number/value. */
  value: ReactNode
  /** Small muted caption shown beneath the value. */
  label: string
  /** Colour of the 3px top bar. Defaults to red. */
  accent?: StatAccent
  className?: string
}

/**
 * Dashboard stat tile: 3px coloured top bar, 32px/800 value, muted label.
 */
export function StatCard({ value, label, accent = 'red', className = '' }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-card border border-surface-border bg-surface-card p-5 shadow-card ${className}`}
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] ${ACCENT_BAR[accent]}`} aria-hidden />
      <div className="text-[32px] font-extrabold leading-none text-text">{value}</div>
      <div className="mt-[5px] text-xs text-text-muted">{label}</div>
    </div>
  )
}

export default StatCard
