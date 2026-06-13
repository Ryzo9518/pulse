// ── PageHeader ───────────────────────────────────────────────────────────────
// Reusable screen header. Title 28px / 800 in the display font, optional eyebrow
// and muted subtitle, and an optional right-aligned actions slot. Padding follows
// the design system (~32px vertical, 40px horizontal).

import type { ReactNode } from 'react'

export interface PageHeaderProps {
  /** Small uppercase label above the title (e.g. "Dashboard"). */
  eyebrow?: string
  title: string
  /** Muted supporting line below the title. */
  subtitle?: string
  /** Right-aligned content (buttons, controls). */
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-surface-border px-10 py-8">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[1.5px] text-jera-red">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-[28px] font-extrabold leading-tight text-text">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export default PageHeader
