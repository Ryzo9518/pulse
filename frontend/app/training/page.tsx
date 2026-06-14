'use client'

// ── Cert Tracker (Sage Intacct billable-readiness) ───────────────────────────
// Two experiences off the shared mock session role:
//  • Employee — a junior consultant logs the Sage U ILT session they are booked
//    on and sees when they become billable (supervised → ILT complete →
//    certified).
//  • Admin — Ryan sees every junior consultant and their projected billable
//    dates in one table.
// Mock-data phase: reads/writes go through the '@/lib/mock' accessor seam.

import { useReducer, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Select,
  StatCard,
  Tabs,
  type BadgeColor,
  type DataTableColumn,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import {
  formatDate,
  formatSessionLabel,
  getBillableSummary,
  getEmployeeMilestones,
  getTrainingEnrolment,
  listIltSessions,
  setTrainingMilestone,
  setTrainingSession,
} from '@/lib/mock'
import type {
  BillableMilestone,
  BillableSummaryRow,
  MilestoneKey,
  MilestoneStatus,
} from '@/types/database'

const STATUS_BADGE: Record<MilestoneStatus, { color: BadgeColor; label: string }> = {
  done: { color: 'green', label: 'Done' },
  on_track: { color: 'blue', label: 'On track' },
  pending: { color: 'amber', label: 'Action needed' },
}

const NEXT_LABEL: Record<MilestoneKey, string> = {
  supervised: 'Supervised-billable',
  ilt: 'ILT complete',
  certified: 'Certified',
}

const MILESTONE_BLURB: Record<MilestoneKey, string> = {
  supervised: 'Foundations + shadowing done — can bill supervised hours.',
  ilt: 'Finished the 25-hour Implementing course.',
  certified: 'Passed the Implementation Consultant certification.',
}

const MILESTONE_FLAG: Record<MilestoneKey, 'getting_started_done' | 'ilt_done' | 'certified'> = {
  supervised: 'getting_started_done',
  ilt: 'ilt_done',
  certified: 'certified',
}

export default function TrainingPage() {
  const { role } = useSession()
  return (
    <AppShell>
      <PageHeader
        eyebrow="Development"
        title="Cert Tracker"
        subtitle="Sage Intacct Implementation Consultant — billable readiness"
      />
      <div className="px-10 py-8">
        {role === 'admin' ? <AdminView /> : <EmployeeView />}
      </div>
    </AppShell>
  )
}

// ── Employee view ─────────────────────────────────────────────────────────────

function MilestoneCard({ milestone }: { milestone: BillableMilestone }) {
  const badge = STATUS_BADGE[milestone.status]
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
          {milestone.label}
        </span>
        <Badge color={badge.color}>{badge.label}</Badge>
      </div>
      <div className="text-[22px] font-extrabold leading-tight text-text">
        {formatDate(milestone.date)}
      </div>
      <p className="text-[12px] text-text-muted">{MILESTONE_BLURB[milestone.key]}</p>
    </Card>
  )
}

function EmployeeView() {
  const { currentEmployee } = useSession()
  const [, forceRender] = useReducer((n: number) => n + 1, 0)

  if (!currentEmployee) {
    return <EmptyState icon="🔒" title="Not signed in" description="Sign in to view your tracker." />
  }

  const employeeId = currentEmployee.id
  const enrolment = getTrainingEnrolment(employeeId)
  const milestones = getEmployeeMilestones(employeeId)
  const sessions = listIltSessions()

  const sessionOptions = sessions.map((s) => ({
    value: s.id,
    label: `${formatSessionLabel(s)} — ${s.seats_note}`,
  }))

  const handleSelectSession = (sessionId: string) => {
    setTrainingSession(employeeId, sessionId || null)
    forceRender()
  }

  const handleToggle = (key: MilestoneKey, value: boolean) => {
    setTrainingMilestone(employeeId, MILESTONE_FLAG[key], value)
    forceRender()
  }

  const sessionTab = (
    <div className="flex flex-col gap-5">
      <Card title="My instructor-led training session">
        <p className="mb-4 max-w-2xl text-[13px] text-text-muted">
          Choose the Sage University “Sage Intacct: Implementing” session you are
          booked on. Your billable dates update automatically. Full-day weeks
          finish fastest.
        </p>
        <div className="max-w-xl">
          <Select
            label="Sage U session"
            placeholder="Select a session…"
            value={enrolment?.session_id ?? ''}
            options={sessionOptions}
            onChange={(e) => handleSelectSession(e.target.value)}
          />
        </div>
        {enrolment?.session_id ? (
          <p className="mt-3 text-[12px] text-jera-green">
            ✓ Logged. Your manager can now see your projected billable dates.
          </p>
        ) : null}
      </Card>

      <Card title="Mark your progress">
        <div className="flex flex-col gap-3">
          {milestones.map((m) => (
            <label
              key={m.key}
              className="flex cursor-pointer items-center gap-3 rounded-btn border border-surface-border bg-surface px-4 py-3"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-jera-red"
                checked={m.status === 'done'}
                onChange={(e) => handleToggle(m.key, e.target.checked)}
              />
              <span className="text-[13px] font-semibold text-text">{NEXT_LABEL[m.key]}</span>
              <span className="text-[12px] text-text-muted">{MILESTONE_BLURB[m.key]}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  )

  const milestonesTab = enrolment?.session_id ? (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {milestones.map((m) => (
        <MilestoneCard key={m.key} milestone={m} />
      ))}
    </div>
  ) : (
    <EmptyState
      icon="🗓️"
      title="No session logged yet"
      description="Pick your Sage U session under “My Session” and your billable milestone dates will appear here."
    />
  )

  return (
    <Tabs
      variant="pill"
      tabs={[
        { value: 'session', label: 'My Session', content: sessionTab },
        { value: 'milestones', label: 'Billable Milestones', content: milestonesTab },
      ]}
    />
  )
}

// ── Admin view ────────────────────────────────────────────────────────────────

function AdminView() {
  const [version, bump] = useReducer((n: number) => n + 1, 0)
  // version participates in the render so the table refreshes after any change.
  void version
  const rows = getBillableSummary()

  const tracked = rows.length
  const enrolled = rows.filter((r) => r.session_id).length
  const notEnrolled = tracked - enrolled

  const columns: DataTableColumn<BillableSummaryRow>[] = [
    {
      key: 'consultant',
      header: 'Consultant',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.display_name} initials={r.avatar_initials} color={r.avatar_color} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-text">{r.display_name}</div>
            <div className="truncate text-[12px] text-text-muted">{r.job_title}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'session',
      header: 'ILT session',
      render: (r) =>
        r.session_label ? (
          <span className="text-text">{r.session_label}</span>
        ) : (
          <Badge color="grey">Not enrolled</Badge>
        ),
    },
    {
      key: 'supervised',
      header: 'Supervised-billable',
      render: (r) => formatDate(r.supervised_date),
    },
    {
      key: 'ilt',
      header: 'ILT complete',
      render: (r) => formatDate(r.ilt_date),
    },
    {
      key: 'certified',
      header: 'Certified',
      render: (r) => formatDate(r.certified_date),
    },
    {
      key: 'next',
      header: 'Next milestone',
      render: (r) =>
        r.next_milestone ? (
          <Badge color="blue">{NEXT_LABEL[r.next_milestone]}</Badge>
        ) : (
          <Badge color="green">Fully certified</Badge>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={tracked} label="Junior consultants tracked" accent="red" />
        <StatCard value={enrolled} label="Booked on an ILT session" accent="blue" />
        <StatCard value={notEnrolled} label="Not enrolled yet" accent="amber" />
      </div>

      <Card title="Billable readiness by consultant" padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No junior consultants yet"
            description="Junior consultants in onboarding or probation will appear here once added."
          />
        ) : (
          <div className="p-2">
            <DataTable
              columns={columns}
              rows={rows}
              headerTone="dark"
              rowKey={(r) => r.employee_id}
              onRowClick={() => bump()}
            />
          </div>
        )}
      </Card>

      <p className="text-[12px] text-text-muted">
        Dates are projected from each consultant’s start date and chosen Sage U
        session: supervised-billable ~1 week after start, ILT-complete on the
        session end date, and certified ~10 days after the ILT. Source: Sage
        University, captured 13 Jun 2026.
      </p>
    </div>
  )
}
