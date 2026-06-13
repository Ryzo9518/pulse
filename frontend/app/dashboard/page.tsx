'use client'

// ── Dashboard (Unit 5) ───────────────────────────────────────────────────────
// The landing screen. Renders two views off the same page, branched on the dev
// session role (flip via the RoleSwitch in AppShell):
//   • employee → welcome header, task stat cards, progress, quick actions,
//     team-assignment cards with a (mock) Ping.
//   • admin    → all of the above PLUS pending expense approvals, an onboarding
//     summary, and an activity feed.
// Mirrors docs/pulse_v4_prototype.html `renderDashboard` and the Dashboard
// section of docs/FEATURE_SPEC.md. Mock-data phase: all reads go through
// @/lib/mock; the Ping fires a toast, not a real email.

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  ActionCard,
  Avatar,
  Badge,
  Button,
  Card,
  ProgressBar,
  StatCard,
  StatCardGrid,
  useToast,
} from '@/components/ui'
import {
  getEmployee,
  getOnboardingSummary,
  getTaskStatus,
  listAdminNotifications,
  listExpenseClaims,
  listTasks,
} from '@/lib/mock'
import { useSession } from '@/lib/mock/session'
import type { OnboardingTask, TaskStatus } from '@/types/database'

// Owner-key → display metadata. The onboarding tasks reference owners by a short
// key (e.g. 'ryan', 'hr'), not an employee id, so this static map (mirroring the
// prototype's TEAM constant) resolves each key to a name, role and avatar colour.
const TEAM: Record<string, { name: string; role: string; color: string }> = {
  ryan: { name: 'Ryan de Kock', role: 'Managing Director', color: '#911431' },
  siko: { name: 'Siko D', role: 'IT Support', color: '#2b72b9' },
  raymond: { name: 'Raymond', role: 'IT / Microsoft 365', color: '#C4880C' },
  joann: { name: 'Jo-Ann', role: 'Admin / Clothing', color: '#db4fb2' },
  hr: { name: 'HR Department', role: 'HR & Compliance', color: '#2D8A56' },
}

function statusOf(taskId: string): TaskStatus {
  return getTaskStatus(taskId)?.status ?? 'pending'
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmtMoney(value: number): string {
  return `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DashboardPage() {
  const { currentEmployee, role } = useSession()
  const { toast } = useToast()
  const isAdmin = role === 'admin'

  // Employee task stats (employee-visible tasks only): the four headline numbers
  // plus the overall progress bar. Admin still sees these as the base view.
  const tasks = listTasks('employee')
  const total = tasks.length
  const done = tasks.filter((t) => statusOf(t.id) === 'done').length
  const inProgress = tasks.filter((t) => statusOf(t.id) === 'inprogress').length
  const pending = total - done - inProgress
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // Team assignments: group ALL tasks (every phase) by owner key so each person's
  // share of the onboarding is visible, then compute per-person completion.
  const allTasks = listTasks('admin')
  const byOwner = new Map<string, OnboardingTask[]>()
  for (const t of allTasks) {
    if (!t.default_owner) continue
    const list = byOwner.get(t.default_owner) ?? []
    list.push(t)
    byOwner.set(t.default_owner, list)
  }
  const teamRows = Array.from(byOwner.entries())
    .filter(([key]) => TEAM[key])
    .map(([key, ownerTasks]) => {
      const person = TEAM[key]
      const ownerDone = ownerTasks.filter((t) => statusOf(t.id) === 'done').length
      return { key, person, total: ownerTasks.length, done: ownerDone }
    })

  const empName = currentEmployee?.display_name ?? 'there'
  const empSub = [
    currentEmployee?.job_title,
    currentEmployee?.department,
    currentEmployee?.start_date ? `Starts ${fmtDate(currentEmployee.start_date)}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  function ping(name: string) {
    toast({
      title: `Pinged ${name}`,
      message: `A reminder to review ${empName}'s onboarding tasks was sent.`,
      variant: 'success',
    })
  }

  // ── Admin-only data ──
  const pendingApprovals = isAdmin
    ? listExpenseClaims().filter((c) => c.status === 'submitted')
    : []
  const onboardingSummary = isAdmin ? getOnboardingSummary() : []
  const activity = isAdmin ? listAdminNotifications() : []

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${currentEmployee?.first_name ?? empName}`}
        subtitle={empSub || undefined}
      />

      <div className="space-y-8 px-10 py-8">
        {/* Onboarding progress stats */}
        <section className="space-y-4">
          <StatCardGrid>
            <StatCard accent="blue" value={total} label="Total tasks" />
            <StatCard accent="green" value={done} label="Completed" />
            <StatCard accent="amber" value={inProgress} label="In progress" />
            <StatCard accent="red" value={pending} label="Pending" />
          </StatCardGrid>

          <Card title="Overall onboarding progress">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[32px] font-extrabold leading-none text-text">
                {pct}%
              </span>
              <span className="text-xs text-text-muted">
                {done} of {total} tasks complete
              </span>
            </div>
            <ProgressBar
              value={done}
              max={total}
              ariaLabel="Overall onboarding progress"
            />
          </Card>
        </section>

        {/* Quick actions */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-4 min-[900px]:grid-cols-4">
            <ActionCard
              href="/workflow"
              icon="📋"
              title="Workflow"
              description="Track onboarding tasks"
            />
            <ActionCard
              href="/sop"
              icon="📁"
              title="SOPs"
              description="Step-by-step guides"
            />
            <ActionCard
              href="/forms"
              icon="📝"
              title="My Forms"
              description="Onboarding forms to complete"
            />
            <ActionCard
              href="/policies"
              icon="📖"
              title="Policies"
              description="Read & acknowledge HR policies"
            />
          </div>
        </section>

        {/* Team assignments */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Team assignments
          </h2>
          <Card padded={false}>
            <ul className="divide-y divide-surface-border">
              {teamRows.map(({ key, person, total: t, done: d }) => {
                const ppct = t > 0 ? Math.round((d / t) * 100) : 0
                return (
                  <li
                    key={key}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <Avatar
                      name={person.name}
                      color={person.color}
                      size="sm"
                      label={person.name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-bold text-text">
                          {person.name}
                        </span>
                        <span className="truncate text-[11px] text-text-muted">
                          {person.role}
                        </span>
                      </div>
                      <ProgressBar
                        className="mt-1.5"
                        value={d}
                        max={t}
                        label={`${d}/${t}`}
                        ariaLabel={`${person.name} task progress`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => ping(person.name)}
                    >
                      Ping
                    </Button>
                    {ppct === 100 ? <Badge color="green">Done</Badge> : null}
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>

        {/* ── Admin-only sections ── */}
        {isAdmin ? (
          <>
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
                Pending approvals
              </h2>
              <Card padded={false}>
                {pendingApprovals.length === 0 ? (
                  <p className="px-6 py-5 text-sm text-text-muted">
                    No expense claims awaiting approval.
                  </p>
                ) : (
                  <ul className="divide-y divide-surface-border">
                    {pendingApprovals.map((claim) => {
                      const submitter = getEmployee(claim.employee_id)
                      return (
                        <li
                          key={claim.id}
                          className="flex items-center gap-4 px-6 py-4"
                        >
                          <Avatar
                            name={submitter?.display_name}
                            color={submitter?.avatar_color}
                            size="sm"
                            label={submitter?.display_name}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-text">
                              {submitter?.display_name ?? 'Unknown employee'}
                            </div>
                            <div className="text-[11px] text-text-muted">
                              Expense claim · {claim.claim_period ?? '—'}
                              {claim.submitted_at
                                ? ` · submitted ${fmtDate(claim.submitted_at)}`
                                : ''}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-text">
                            {fmtMoney(claim.grand_total)}
                          </span>
                          <Badge color="amber">Submitted</Badge>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
                Onboarding summary
              </h2>
              <Card padded={false}>
                {onboardingSummary.length === 0 ? (
                  <p className="px-6 py-5 text-sm text-text-muted">
                    No employees currently onboarding.
                  </p>
                ) : (
                  <ul className="divide-y divide-surface-border">
                    {onboardingSummary.map((row) => {
                      const totalSteps =
                        row.forms_total + row.sops_total + row.policies_total
                      const doneSteps =
                        row.forms_done + row.sops_done + row.policies_done
                      return (
                        <li
                          key={row.id}
                          className="flex items-center gap-4 px-6 py-4"
                        >
                          <Avatar
                            name={row.display_name}
                            size="sm"
                            label={row.display_name}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="truncate text-sm font-bold text-text">
                                {row.display_name}
                              </span>
                              <span className="truncate text-[11px] text-text-muted">
                                {row.job_title ?? row.department ?? ''}
                              </span>
                            </div>
                            <ProgressBar
                              className="mt-1.5"
                              value={doneSteps}
                              max={totalSteps}
                              label={`${doneSteps}/${totalSteps}`}
                              ariaLabel={`${row.display_name} onboarding progress`}
                            />
                          </div>
                          <div className="flex flex-col items-end gap-1 text-[11px] text-text-muted">
                            <span>
                              Policies {row.policies_done}/{row.policies_total}
                            </span>
                            {row.expense_claims_pending > 0 ? (
                              <Badge color="amber">
                                {row.expense_claims_pending} claim
                                {row.expense_claims_pending === 1 ? '' : 's'} pending
                              </Badge>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
                Activity feed
              </h2>
              <Card padded={false}>
                {activity.length === 0 ? (
                  <p className="px-6 py-5 text-sm text-text-muted">
                    No recent activity.
                  </p>
                ) : (
                  <ul className="divide-y divide-surface-border">
                    {activity.map((item) => {
                      const sender = getEmployee(item.sent_by)
                      return (
                        <li key={item.id} className="flex gap-4 px-6 py-4">
                          <Avatar
                            name={sender?.display_name}
                            color={sender?.avatar_color}
                            size="sm"
                            label={sender?.display_name}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-sm font-bold text-text">
                                {item.subject}
                              </span>
                              <span className="flex-shrink-0 text-[11px] text-text-muted">
                                {fmtDate(item.created_at)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs leading-[1.5] text-text-muted">
                              {item.body}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
