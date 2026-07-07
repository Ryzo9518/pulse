'use client'

// ── Workflow task board (Unit 6) ──────────────────────────────────────────────
// Onboarding task board. Every role gets the same phase-accordion shape
// (Pre-Arrival → Day 1 → IT Setup → HR Admin → Orientation) with per-phase
// progress; the active role only changes WHICH phases/tasks are visible (a
// manager loses the HR-admin phase + contract task per HANDOFF §2). Admins also
// get the per-task owner-assignment control. The board core lives in
// WorkflowBoard so it can be unit-tested without the AppShell.
//
// WS-2: identity comes from the real Auth.js session when NEXT_PUBLIC_PULSE_DATA
// =live (role + employee id drive visibility and instance selection); the mock
// session keeps powering dev/mock mode.

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { isStaffRole } from '@/lib/capabilities'
import { useCurrentEmployee } from '@/lib/data/useCurrentEmployee'
import { useSession } from '@/lib/mock/session'
import type { UserRole } from '@/types/database'

import { WorkflowBoard } from './WorkflowBoard'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

export default function WorkflowPage() {
  const mockSession = useSession()
  const liveEmployee = useCurrentEmployee()

  const role: UserRole = LIVE
    ? ((liveEmployee.role as UserRole) ?? 'employee')
    : mockSession.role
  const viewerEmployeeId = LIVE
    ? liveEmployee.id
    : mockSession.currentEmployee?.id
  const firstName = LIVE
    ? liveEmployee.displayName?.split(' ')[0]
    : mockSession.currentEmployee?.first_name

  const subtitle = isStaffRole(role)
    ? 'Onboarding phases from pre-arrival to fully productive — assign owners and track every step.'
    : `Your onboarding journey${firstName ? `, ${firstName}` : ''} — work through each phase.`

  return (
    <AppShell>
      <PageHeader eyebrow="Onboarding" title="Workflow" subtitle={subtitle} />
      <WorkflowBoard role={role} viewerEmployeeId={viewerEmployeeId} />
    </AppShell>
  )
}
