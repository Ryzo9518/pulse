'use client'

// ── Workflow task board (Unit 6) ──────────────────────────────────────────────
// Onboarding task board. The employee view shows employee/both tasks grouped
// into expandable phase accordions; the admin view shows ALL tasks grouped by
// the responsible person. The board core lives in WorkflowBoard so it can be
// unit-tested without the AppShell. Session role drives which variant renders.

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSession } from '@/lib/mock/session'

import { WorkflowBoard } from './WorkflowBoard'

export default function WorkflowPage() {
  const { role, currentEmployee } = useSession()

  const subtitle =
    role === 'admin'
      ? 'All onboarding tasks, grouped by who is responsible.'
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
