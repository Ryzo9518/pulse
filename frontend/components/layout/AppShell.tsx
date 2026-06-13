'use client'

// ── AppShell ─────────────────────────────────────────────────────────────────
// The persistent frame every screen lives inside: a fixed 260px Sidebar on the
// left and a scrollable main content area (surface background) rendering the
// screen. The dev-only RoleSwitch floats top-right over the content.

import type { ReactNode } from 'react'

import { Sidebar } from './Sidebar'
import { RoleSwitch } from './RoleSwitch'

export interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto bg-surface">
        <div className="pointer-events-none absolute right-6 top-6 z-40">
          <div className="pointer-events-auto">
            <RoleSwitch />
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

export default AppShell
