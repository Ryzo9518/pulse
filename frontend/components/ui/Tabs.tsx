'use client'

import { useState, type ReactNode } from 'react'

export interface TabItem {
  /** Unique tab id. */
  value: string
  /** Tab button label. */
  label: ReactNode
  /** Panel content for this tab. */
  content?: ReactNode
}

export type TabsVariant = 'pill' | 'underline'

export interface TabsProps {
  tabs: TabItem[]
  /** Controlled active value. */
  value?: string
  /** Uncontrolled initial value. Defaults to the first tab. */
  defaultValue?: string
  /** Called when the active tab changes. */
  onChange?: (value: string) => void
  /** `pill` = red filled active (SOP/Expenses style); `underline` = red underline. */
  variant?: TabsVariant
  /** Render panels from `tabs[].content`. Set false to render only the tab bar. */
  renderPanel?: boolean
  className?: string
}

/**
 * Tab bar with active jera-red pill or underline. Controlled or uncontrolled.
 */
export function Tabs({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = 'pill',
  renderPanel = true,
  className = '',
}: TabsProps) {
  const [internal, setInternal] = useState<string>(defaultValue ?? tabs[0]?.value ?? '')
  const active = value ?? internal

  const select = (next: string) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const activeTab = tabs.find((t) => t.value === active)

  return (
    <div className={className}>
      <div
        className={
          variant === 'underline'
            ? 'flex gap-6 border-b border-surface-border'
            : 'flex flex-wrap gap-[6px]'
        }
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.value === active
          if (variant === 'underline') {
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => select(tab.value)}
                className={`-mb-px border-b-2 px-1 pb-3 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'border-jera-red text-jera-red'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            )
          }
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(tab.value)}
              className={`rounded-btn border px-[18px] py-2 font-display text-[13px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'border-jera-red bg-jera-red text-white'
                  : 'border-surface-border bg-surface text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {renderPanel && activeTab?.content ? (
        <div role="tabpanel" className="mt-5">
          {activeTab.content}
        </div>
      ) : null}
    </div>
  )
}

export default Tabs
