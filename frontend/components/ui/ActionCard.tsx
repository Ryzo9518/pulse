import type { ReactNode } from 'react'

export interface ActionCardProps {
  /** Emoji or short icon rendered at 26px. */
  icon: ReactNode
  /** Bold card title. */
  title: string
  /** Muted supporting description. */
  description?: string
  /** Click handler — renders as a <button>. */
  onClick?: () => void
  /** Destination — renders as an <a>. Takes precedence over onClick for element choice. */
  href?: string
  className?: string
}

const BASE =
  'group flex w-full flex-col gap-2 rounded-card border border-surface-border bg-surface-card p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-px hover:border-jera-red hover:shadow-red-glow'

function Inner({ icon, title, description }: Pick<ActionCardProps, 'icon' | 'title' | 'description'>) {
  return (
    <>
      <span className="text-[26px] leading-none">{icon}</span>
      <span className="text-sm font-bold text-text">{title}</span>
      {description ? <span className="text-xs text-text-muted">{description}</span> : null}
    </>
  )
}

/**
 * Dashboard quick-action tile. Lifts and turns red on hover.
 * Renders as an anchor when `href` is set, otherwise a button.
 */
export function ActionCard({ icon, title, description, onClick, href, className = '' }: ActionCardProps) {
  if (href) {
    return (
      <a href={href} onClick={onClick} className={`${BASE} ${className}`}>
        <Inner icon={icon} title={title} description={description} />
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`${BASE} ${className}`}>
      <Inner icon={icon} title={title} description={description} />
    </button>
  )
}

export default ActionCard
