'use client'

// ── RoleSwitch ───────────────────────────────────────────────────────────────
// Dev-only affordance (NOT a product feature) that flips the active view between
// the employee and admin experiences. Lets Ryan see both without a real login
// (plan R3). Styled subtly with a 🔧 marker so it reads as a dev tool.

import type { UserRole } from '@/types/database'
import { useSession } from '@/lib/mock/session'

const ROLES: UserRole[] = ['employee', 'admin']

export function RoleSwitch() {
  const { role, setRole } = useSession()

  return (
    <div
      className="inline-flex items-center gap-2 rounded-btn border border-dashed border-surface-border bg-surface-card px-2 py-1 text-xs text-text-muted shadow-card"
      title="Dev only — switch between the employee and admin views"
    >
      <span aria-hidden className="text-[13px]">
        🔧
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
        Dev view
      </span>
      <div className="flex overflow-hidden rounded-badge border border-surface-border">
        {ROLES.map((r) => {
          const active = role === r
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={active}
              className={`px-[10px] py-[3px] text-[11px] font-semibold capitalize transition-colors ${
                active
                  ? 'bg-jera-red text-white'
                  : 'bg-surface-card text-text-secondary hover:bg-surface-border-light'
              }`}
            >
              {r}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default RoleSwitch
