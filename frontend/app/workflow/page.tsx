'use client'

// ── Workflow task board (Unit 6) ──────────────────────────────────────────────
// Onboarding task board. Every role gets the same phase-accordion shape
// (Pre-Arrival → Day 1 → IT Setup → HR Admin → Orientation) with per-phase
// progress; the active role only changes WHICH phases/tasks are visible (a
// manager loses the HR-admin phase + contract task per HANDOFF §2). Admins also
// get the per-task owner-assignment control. The board core lives in
// WorkflowBoard so it can be unit-tested without the AppShell.

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { isStaffRole } from '@/lib/capabilities'
import { useSession } from '@/lib/mock/session'

import { WorkflowBoard } from './WorkflowBoard'

export default function WorkflowPage() {
  const { role, currentEmployee } = useSession()

  const subtitle = isStaffRole(role)
    ? 'Onboarding phases from pre-arrival to fully productive — assign owners and track every step.'
    : `Your onboarding journey${
        currentEmployee ? `, ${currentEmployee.first_name}` : ''
      } — work through each phase.`

  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="Workflow"
        subtitle={subtitle}
      />
      <WorkflowBoard role={role} />
    </AppShell>
  )
}
