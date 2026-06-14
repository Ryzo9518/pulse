'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

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
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const tabId = (val: string) => `${baseId}-tab-${val}`
  const panelId = (val: string) => `${baseId}-panel-${val}`

  const select = (next: string) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const focusTabAt = (index: number) => {
    const tab = tabs[index]
    if (!tab) return
    select(tab.value)
    tabRefs.current[index]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        focusTabAt(index >= last ? 0 : index + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        focusTabAt(index <= 0 ? last : index - 1)
        break
      case 'Home':
        e.preventDefault()
        focusTabAt(0)
        break
      case 'End':
        e.preventDefault()
        focusTabAt(last)
        break
      default:
        break
    }
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
        aria-orientation="horizontal"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.value === active
          const common = {
            id: tabId(tab.value),
            type: 'button' as const,
            role: 'tab' as const,
            'aria-selected': isActive,
            'aria-controls': panelId(tab.value),
            tabIndex: isActive ? 0 : -1,
            ref: (el: HTMLButtonElement | null) => {
              tabRefs.current[index] = el
            },
            onClick: () => select(tab.value),
            onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => onKeyDown(e, index),
          }
          if (variant === 'underline') {
            return (
              <button
                key={tab.value}
                {...common}
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
              {...common}
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
        <div
          role="tabpanel"
          id={panelId(activeTab.value)}
          aria-labelledby={tabId(activeTab.value)}
          tabIndex={0}
          className="mt-5"
        >
          {activeTab.content}
        </div>
      ) : null}
    </div>
  )
}

export default Tabs
