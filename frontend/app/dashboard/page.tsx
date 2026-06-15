'use client'

// ── Dashboard (Unit 5) ───────────────────────────────────────────────────────
// The landing screen. Renders two distinct experiences off the same page,
// branched on the dev session role (flip via the RoleSwitch in AppShell):
//
//   • employee → a "Focus | Journey" toggle (progress ring + next-step CTA, or a
//     6-step path-to-billable timeline), a time-aware "This week" action list, a
//     curated "Your people" card, and an "Ask the Pulse Assistant" nudge.
//   • manager / admin (isStaffRole) → team-at-a-glance roster stats, a
//     certifications-needing-recert alert panel, a billable-readiness pipeline,
//     and an approvals queue (submitted expense claims + outstanding policy
//     sign-offs) with an empty state.
//
// Mirrors docs/prototype/Pulse.dc.html `dashboardData` / `renderVals` (route key
// "dashboard") and HANDOFF.md. Mock-data phase: all reads go through @/lib/mock;
// role gating via @/lib/capabilities. Manager-scoped task counts use
// listTasks(role) — never listTasks('admin') — so a manager never sees HR-owned
// counts (HANDOFF §2).

import { useState } from 'react'
import Link from 'next/link'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Card,
  StatCard,
  StatCardGrid,
  Tabs,
} from '@/components/ui'
import {
  BILLABLE_STAGES,
  buildThisWeek,
  certExpiryInfo,
  countSummaryStages,
  formatDate,
  getBillableSummary,
  getEmployee,
  getOnboardingSummary,
  getPolicyAckState,
  getTaskStatus,
  listCertifications,
  listEmployees,
  listExpenseClaims,
  listTasks,
} from '@/lib/mock'
import { isStaffRole } from '@/lib/capabilities'
import { useSession } from '@/lib/mock/session'
import type { Certification, Employee, UserRole } from '@/types/database'

function statusDone(taskId: string): boolean {
  return getTaskStatus(taskId)?.status === 'done'
}

function fmtMoney(value: number): string {
  return `R${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ── The six fixed onboarding-journey steps (prototype renderVals.jdef) ─────────
const JOURNEY_DEFS: ReadonlyArray<{ icon: string; label: string; sub: string }> = [
  { icon: '📝', label: 'Paperwork & Day 1', sub: 'Forms, contract, welcome tour' },
  { icon: '💻', label: 'IT verified', sub: 'Microsoft 365 · Zoho · VPN · Memtime' },
  { icon: '📖', label: 'SOPs & Policies', sub: '4 SOP walkthroughs · 20 HR policies' },
  { icon: '🎓', label: 'ILT booked', sub: 'Sage University instructor-led course' },
  { icon: '💼', label: 'Supervised-billable', sub: 'After foundations + shadowing' },
  { icon: '🏅', label: 'Certified', sub: 'After ILT + certification exam' },
]

export default function DashboardPage() {
  const { currentEmployee, role } = useSession()
  const staff = isStaffRole(role)

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${currentEmployee?.first_name ?? 'there'}`}
        subtitle={subtitleFor(currentEmployee, staff)}
      />
      <div className="space-y-7 px-10 py-8">
        {staff ? (
          <StaffDashboard role={role} currentEmployee={currentEmployee} />
        ) : (
          <EmployeeDashboard currentEmployee={currentEmployee} />
        )}
      </div>
    </AppShell>
  )
}

function subtitleFor(employee: Employee | null, staff: boolean): string | undefined {
  if (staff) return 'Team onboarding, certifications and approvals at a glance'
  if (!employee) return undefined
  return [
    employee.job_title,
    employee.department,
    employee.start_date ? `Starts ${formatDate(employee.start_date)}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

// ── Employee view ─────────────────────────────────────────────────────────────

function EmployeeDashboard({ currentEmployee }: { currentEmployee: Employee | null }) {
  // Progress across the employee-visible onboarding tasks.
  const tasks = listTasks('employee')
  const total = tasks.length
  const done = tasks.filter((t) => statusDone(t.id)).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // ── This week: outstanding actions, due-date computed from start + days_offset ──
  const startIso = currentEmployee?.start_date ?? '2026-06-16'
  const itTasks = tasks.filter((t) => t.phase_id === 'it')
  const itLeft = itTasks.filter((t) => !statusDone(t.id)).length
  const { acknowledgedCount, total: polTotal } = getPolicyAckState()
  const polLeft = polTotal - acknowledgedCount

  // days_offset values mirror the onboarding seed for these areas (IT verify = 1,
  // policies = 5, training/orientation = ~4). Forms aren't in the task seam, so
  // the prototype's forms row is folded into the workflow CTA.
  const thisWeek = buildThisWeek(startIso, [
    {
      key: 'it',
      icon: '💻',
      label: 'Verify your IT setup',
      detail: `${itLeft} of ${itTasks.length} system checks left`,
      cta: 'Open Workflow',
      href: '/workflow',
      daysOffset: 1,
      include: itLeft > 0,
    },
    {
      key: 'forms',
      icon: '📝',
      label: 'Complete your onboarding forms',
      detail: 'Tax, banking and personal-detail forms',
      cta: 'Go to Forms',
      href: '/forms',
      daysOffset: 2,
      include: !currentEmployee?.onboarding_completed,
    },
    {
      key: 'policies',
      icon: '📖',
      label: 'Acknowledge HR policies',
      detail: `${acknowledgedCount}/${polTotal} signed off`,
      cta: 'Read policies',
      href: '/policies',
      daysOffset: 5,
      include: polLeft > 0,
    },
    {
      key: 'training',
      icon: '🎓',
      label: 'Progress your training',
      detail: 'Sage University learning paths',
      cta: 'Open Training',
      href: '/training',
      daysOffset: 13,
      include: true,
    },
  ])

  const contacts = curatedContacts(currentEmployee)

  // Focus | Journey toggle state. Controlled so the segmented bar (in the section
  // header) and the full-width panel below it stay in sync.
  const [hero, setHero] = useState<'focus' | 'journey'>('focus')

  return (
    <div className="space-y-7">
      {/* Focus | Journey toggle */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Your onboarding
          </h2>
          <Tabs
            renderPanel={false}
            value={hero}
            onChange={(v) => setHero(v as 'focus' | 'journey')}
            tabs={[
              { value: 'focus', label: 'Focus' },
              { value: 'journey', label: 'Journey' },
            ]}
          />
        </div>
        {hero === 'focus' ? (
          <FocusPanel pct={pct} done={done} total={total} />
        ) : (
          <JourneyPanel pct={pct} />
        )}
      </section>

      {/* This week */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
          This week
        </h2>
        <div className="space-y-2.5">
          {thisWeek.map((row) => (
            <Link
              key={row.key}
              href={row.href}
              className="flex items-center gap-4 rounded-card border border-surface-border border-l-4 bg-surface-card px-5 py-4 shadow-card transition-shadow hover:shadow-card-lg"
              style={{ borderLeftColor: accentHex(row.due.badgeColor) }}
            >
              <span className="flex-shrink-0 text-[22px]" aria-hidden>
                {row.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-text">{row.label}</div>
                <div className="mt-0.5 text-[12.5px] text-text-muted">{row.detail}</div>
              </div>
              <Badge color={row.due.badgeColor}>{row.due.label}</Badge>
              <span className="hidden whitespace-nowrap text-[12.5px] font-semibold text-jera-red sm:inline">
                {row.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Your people + Ask the Pulse Assistant */}
      <div className="grid gap-4 min-[760px]:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Your people
          </h2>
          <Card padded={false}>
            <ul className="divide-y divide-surface-border-light">
              {contacts.map((c) => (
                <li key={c.tagline} className="flex items-center gap-3 px-[18px] py-3.5">
                  <Avatar
                    name={c.name}
                    color={c.color}
                    size="sm"
                    label={c.name}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-text">{c.name}</div>
                    <div className="truncate text-[11.5px] text-text-muted">{c.role}</div>
                  </div>
                  <Badge color="red">{c.tagline}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Need a hand?
          </h2>
          <Link
            href="/chat"
            className="flex flex-1 flex-col justify-center gap-2.5 rounded-card bg-surface-sidebar p-[22px] shadow-card-lg transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[11px] bg-jera-red text-[21px]">
                🤖
              </span>
              <span className="text-base font-extrabold text-white">
                Ask the Pulse Assistant
              </span>
            </div>
            <p className="m-0 text-[13px] leading-[1.55] text-white/65">
              Leave, pay dates, expense rules, policies — get an instant answer from
              Jera&apos;s HR handbook.
            </p>
            <span className="text-[12.5px] font-semibold text-jera-pink">Open chat →</span>
          </Link>
        </section>
      </div>
    </div>
  )
}

function FocusPanel({ pct, done, total }: { pct: number; done: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-5">
      <div className="flex max-w-[330px] flex-1 basis-[250px] flex-col items-center justify-center rounded-[16px] bg-surface-sidebar p-7 text-center shadow-card-lg">
        <ProgressRing pct={pct} />
        <div className="mt-4 text-[13px] text-white/65">
          {done} of {total} tasks done
        </div>
      </div>
      <Card className="flex flex-[2] basis-[320px] flex-col justify-center">
        <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-jera-red">
          Next step
        </div>
        <h3 className="mb-1.5 mt-2.5 font-display text-[23px] font-extrabold tracking-tight text-text">
          Verify your IT setup
        </h3>
        <p className="m-0 max-w-[46ch] text-sm leading-[1.55] text-text-secondary">
          Once your laptop is configured, confirm you can log into Microsoft 365,
          Zoho Projects, Zoho Desk and the VPN. Six quick checks unlock the rest of
          your onboarding.
        </p>
        <div className="mt-5">
          <Link
            href="/workflow"
            className="inline-flex rounded-btn bg-jera-red px-[22px] py-3 font-display text-sm font-semibold text-white shadow-red-glow"
          >
            Open Workflow →
          </Link>
        </div>
      </Card>
    </div>
  )
}

function JourneyPanel({ pct }: { pct: number }) {
  // Mark the journey steps done/current/upcoming from the onboarding progress.
  // The first uncompleted-share step is "current"; everything before it is done.
  // We approximate completion by mapping pct across the six fixed steps.
  const completedSteps = Math.floor((pct / 100) * JOURNEY_DEFS.length)
  return (
    <Card>
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-jera-red">
            Your path to billable
          </div>
          <h3 className="mt-2 font-display text-[22px] font-extrabold tracking-tight text-text">
            From day one to certified consultant
          </h3>
        </div>
        <span className="flex-shrink-0 text-[13px] font-semibold text-text-muted">
          {pct}% complete
        </span>
      </div>
      <ol>
        {JOURNEY_DEFS.map((step, i) => {
          const state: 'done' | 'current' | 'upcoming' =
            i < completedSteps ? 'done' : i === completedSteps ? 'current' : 'upcoming'
          const showLine = i < JOURNEY_DEFS.length - 1
          return (
            <li key={step.label} className="flex gap-4">
              <div className="flex w-[34px] flex-shrink-0 flex-col items-center">
                <span
                  className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full text-[15px] ${
                    state === 'done'
                      ? 'bg-jera-green text-white'
                      : state === 'current'
                        ? 'bg-jera-red text-white shadow-red-glow'
                        : 'bg-surface-border-light text-text-muted'
                  }`}
                  aria-hidden
                >
                  {step.icon}
                </span>
                {showLine ? (
                  <span
                    className={`min-h-[26px] w-0.5 flex-1 ${
                      state === 'done' ? 'bg-jera-green' : 'bg-surface-border'
                    }`}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="pb-5 pt-[3px]">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[14.5px] font-bold ${
                      state === 'upcoming' ? 'text-text-muted' : 'text-text'
                    }`}
                  >
                    {step.label}
                  </span>
                  {state === 'current' ? (
                    <Badge color="red">In progress</Badge>
                  ) : null}
                </div>
                <div className="mt-0.5 text-[12.5px] text-text-muted">{step.sub}</div>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function ProgressRing({ pct }: { pct: number }) {
  // r=52 → circumference ≈ 327 (matches the prototype's stroke-dasharray).
  const circumference = 327
  const offset = Math.round(circumference * (1 - pct / 100))
  return (
    <div className="relative h-[148px] w-[148px]">
      <svg
        width="148"
        height="148"
        viewBox="0 0 120 120"
        className="-rotate-90"
        role="img"
        aria-label={`${pct}% of onboarding tasks complete`}
      >
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="#911431"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[36px] font-extrabold leading-none text-white">{pct}%</span>
        <span className="mt-0.5 text-[11px] text-white/50">complete</span>
      </div>
    </div>
  )
}

// Curated three contacts: manager (via manager_id), IT support, HR & payroll.
function curatedContacts(employee: Employee | null): Array<{
  name: string
  role: string
  tagline: string
  color: string
}> {
  const all = listEmployees()
  const byTitle = (match: (e: Employee) => boolean): Employee | undefined =>
    all.find(match)

  const manager = employee?.manager_id ? getEmployee(employee.manager_id) : undefined
  const it =
    byTitle((e) => e.department === 'IT' && /support/i.test(e.job_title ?? '')) ??
    byTitle((e) => e.department === 'IT')
  const hr =
    byTitle((e) => e.department === 'HR') ??
    byTitle((e) => /hr|payroll|compliance/i.test(e.job_title ?? ''))

  const rows: Array<{ person: Employee | undefined; tagline: string; role: string }> = [
    { person: manager, tagline: 'Your manager', role: manager?.job_title ?? 'Manager' },
    { person: it, tagline: 'IT support', role: it?.job_title ?? 'IT Support' },
    { person: hr, tagline: 'HR & payroll', role: hr?.job_title ?? 'HR & Payroll' },
  ]

  return rows.map((r) => ({
    name: r.person?.display_name ?? '—',
    role: r.role,
    tagline: r.tagline,
    color: r.person?.avatar_color ?? '#8C857D',
  }))
}

// ── Staff (manager / admin) view ──────────────────────────────────────────────

function StaffDashboard({
  role,
  currentEmployee,
}: {
  role: UserRole
  currentEmployee: Employee | null
}) {
  // Team-at-a-glance roster stats from the full roster.
  const roster = listEmployees()
  const rosterStats: Array<{ value: number; label: string; accent: 'blue' | 'amber' | 'green' | 'red' }> = [
    { value: roster.length, label: 'Employees', accent: 'blue' },
    { value: roster.filter((e) => e.status === 'onboarding').length, label: 'Onboarding', accent: 'amber' },
    { value: roster.filter((e) => e.status === 'probation').length, label: 'On probation', accent: 'red' },
    { value: roster.filter((e) => e.status === 'active').length, label: 'Active', accent: 'green' },
  ]

  // Certifications needing recertification — product certs expiring/expired,
  // scoped by role via the certifications accessor (manager = team only).
  const certAlerts = listCertifications(role, currentEmployee?.id ?? '', currentEmployee?.id)
    .filter((c) => c.cclass === 'product')
    .map((c) => ({ cert: c, exp: certExpiryInfo(c.expiry) }))
    .filter((x) => x.exp.state === 'soon' || x.exp.state === 'expired')
    .sort((a, b) => (a.exp.days ?? 9999) - (b.exp.days ?? 9999))

  // Billable-readiness pipeline — counts derived from getBillableSummary() (which
  // already computes each consultant's stage via the shared billableStage ladder).
  const summary = getBillableSummary()
  const stageCounts = countSummaryStages(summary)

  // Approvals queue — submitted expense claims + staff with outstanding policy
  // sign-offs. Task rollups use listTasks(role), never listTasks('admin').
  const submittedClaims = listExpenseClaims().filter((c) => c.status === 'submitted')
  const policyOutstanding = getOnboardingSummary().filter(
    (o) => o.policies_done < o.policies_total,
  )
  const approvals: Array<{ key: string; icon: string; title: string; detail: string; href: string; color: 'amber' | 'red' }> = []
  if (submittedClaims.length > 0) {
    approvals.push({
      key: 'claims',
      icon: '💰',
      title: `${submittedClaims.length} expense ${submittedClaims.length === 1 ? 'claim' : 'claims'} awaiting finance`,
      detail: submittedClaims
        .map((c) => getEmployee(c.employee_id)?.display_name ?? 'Unknown')
        .join(', '),
      href: '/expenses',
      color: 'amber',
    })
  }
  if (policyOutstanding.length > 0) {
    approvals.push({
      key: 'policies',
      icon: '📖',
      title: `${policyOutstanding.length} staff with outstanding policy sign-off`,
      detail: policyOutstanding.map((o) => o.display_name).join(', '),
      href: '/admin/employees',
      color: 'red',
    })
  }

  return (
    <div className="space-y-7">
      {/* Team at a glance */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
          Team at a glance
        </h2>
        <StatCardGrid>
          {rosterStats.map((s) => (
            <StatCard key={s.label} accent={s.accent} value={s.value} label={s.label} />
          ))}
        </StatCardGrid>
      </section>

      {/* Certifications needing recertification */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-jera-red">
            ⚠ Certifications needing recertification
          </h2>
          <Link
            href="/certifications"
            className="rounded-btn border border-surface-border bg-surface-card px-3.5 py-1.5 font-display text-xs font-semibold text-text-secondary"
          >
            View all →
          </Link>
        </div>
        {certAlerts.length === 0 ? (
          <Card>
            <p className="text-sm text-text-muted">
              All product certificates are current. Nothing expiring soon.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3.5 min-[640px]:grid-cols-2">
            {certAlerts.map(({ cert, exp }) => (
              <CertAlertCard
                key={cert.id}
                cert={cert}
                expLabel={exp.label}
                expired={exp.state === 'expired'}
              />
            ))}
          </div>
        )}
      </section>

      {/* Approvals + billable pipeline */}
      <div className="grid gap-5 min-[760px]:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Needs your action
          </h2>
          {approvals.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted">
                Nothing waiting on you — all approvals and sign-offs are clear.
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {approvals.map((a) => (
                <Link
                  key={a.key}
                  href={a.href}
                  className="flex items-center gap-3.5 rounded-card border border-surface-border border-l-4 bg-surface-card px-[18px] py-4 shadow-card transition-shadow hover:shadow-card-lg"
                  style={{ borderLeftColor: accentHex(a.color) }}
                >
                  <span className="flex-shrink-0 text-[20px]" aria-hidden>
                    {a.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold leading-tight text-text">
                      {a.title}
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px] text-text-muted">
                      {a.detail}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-base text-text-muted" aria-hidden>
                    ›
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            Billable readiness
          </h2>
          <Card>
            <ul className="space-y-3.5">
              {BILLABLE_STAGES.map((s) => (
                <li key={s.stage} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: accentHex(s.accent) }}
                    aria-hidden
                  />
                  <span className="flex-1 text-[13.5px] font-medium text-text">{s.label}</span>
                  <span className="font-mono text-[15px] font-extrabold text-text">
                    {stageCounts[s.stage]}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  )
}

function CertAlertCard({
  cert,
  expLabel,
  expired,
}: {
  cert: Certification
  expLabel: string
  expired: boolean
}) {
  const person = getEmployee(cert.employee_id)
  return (
    <Link
      href="/certifications"
      className="flex items-center gap-3.5 rounded-card border border-surface-border border-l-4 bg-surface-card px-[18px] py-4 shadow-card transition-shadow hover:shadow-card-lg"
      style={{ borderLeftColor: expired ? '#911431' : '#C4880C' }}
    >
      <Avatar
        name={person?.display_name}
        color="#1a1a1a"
        size="sm"
        label={person?.display_name}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold leading-tight text-text">{cert.name}</div>
        <div className="truncate text-[11.5px] text-text-muted">
          {person?.display_name ?? '—'} · {cert.product || cert.vendor || 'Product'}
        </div>
      </div>
      <Badge color={expired ? 'red' : 'amber'}>{expLabel}</Badge>
    </Link>
  )
}

// Map a badge palette colour to its hex token (for inline border / dot styling
// where Tailwind utility classes can't carry a runtime-chosen colour).
function accentHex(color: string): string {
  switch (color) {
    case 'red':
      return '#911431'
    case 'amber':
      return '#C4880C'
    case 'blue':
      return '#2b72b9'
    case 'green':
      return '#2D8A56'
    case 'pink':
      return '#db4fb2'
    case 'teal':
      return '#0a7c8a'
    default:
      return '#8C857D'
  }
}
