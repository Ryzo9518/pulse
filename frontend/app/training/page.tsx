'use client'

// ── Training (multi-product Sage U learning paths + billable readiness) ───────
// Two experiences off the shared mock session role:
//  • Employee — a junior consultant picks the Sage product they are training on,
//    works through nested learning paths (grouped, typed modules with checkbox
//    completion), enters their instructor-led training (ILT) date, and watches
//    the 4-stage billable ladder advance: Pre-supervised → Supervised-billable →
//    ILT complete → Certified.
//  • Admin / Manager — sees every junior consultant with product, ILT date and
//    projected billable dates in one table.
// Mock-data phase: reads/writes go through the '@/lib/mock' accessor seam.

import { useReducer } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Card,
  DataTable,
  EmptyState,
  Input,
  ProgressBar,
  Select,
  StatCard,
  type BadgeColor,
  type DataTableColumn,
} from '@/components/ui'
import { isStaffRole } from '@/lib/capabilities'
import { useSession } from '@/lib/mock/session'
import {
  computePathProgress,
  formatDate,
  getBillableSummary,
  getEmployeeMilestones,
  getEmployeeOverallProgress,
  getProduct,
  getProductPaths,
  getTrainingEnrolment,
  listProducts,
  moduleKey,
  moduleTypeMeta,
  setTrainingIltDate,
  setTrainingMilestone,
  setTrainingModule,
  setTrainingProduct,
} from '@/lib/mock'
import type {
  BillableMilestone,
  BillableStage,
  BillableSummaryRow,
  MilestoneKey,
  ModuleTag,
  ProductId,
  TrainingModule,
  TrainingPath,
} from '@/types/database'

const STATUS_BADGE: Record<
  BillableMilestone['status'],
  { color: BadgeColor; label: string }
> = {
  done: { color: 'green', label: 'Done' },
  on_track: { color: 'blue', label: 'On track' },
  pending: { color: 'amber', label: 'Action needed' },
}

const NEXT_LABEL: Record<MilestoneKey, string> = {
  supervised: 'Supervised-billable',
  ilt: 'ILT complete',
  certified: 'Certified',
}

// 4-stage billable ladder, in order. Stage labels and the meaning of each rung.
const STAGES: { key: BillableStage; label: string }[] = [
  { key: 'pre', label: 'Pre-supervised' },
  { key: 'supervised', label: 'Supervised-billable' },
  { key: 'ilt', label: 'ILT complete' },
  { key: 'certified', label: 'Certified' },
]

const STAGE_INDEX: Record<BillableStage, number> = {
  pre: 0,
  supervised: 1,
  ilt: 2,
  certified: 3,
}

const TAG_BADGE: Record<ModuleTag, { color: BadgeColor; label: string }> = {
  required: { color: 'red', label: 'Required' },
  recommended: { color: 'grey', label: 'Recommended' },
}

export default function TrainingPage() {
  const { role } = useSession()
  return (
    <AppShell>
      <PageHeader
        eyebrow="Development"
        title="Training"
        subtitle="Sage product training plans & billable readiness — every step from day one to certified"
      />
      <div className="px-10 py-8">
        {isStaffRole(role) ? <TeamView /> : <EmployeeView />}
      </div>
    </AppShell>
  )
}

// ── Employee view ─────────────────────────────────────────────────────────────

/** A single rung in the 4-stage billable ladder. */
function StageRung({
  label,
  state,
  date,
}: {
  label: string
  state: 'done' | 'current' | 'upcoming'
  date: string | null
}) {
  const dot =
    state === 'done'
      ? 'bg-jera-green text-white border-jera-green'
      : state === 'current'
        ? 'bg-jera-red text-white border-jera-red'
        : 'bg-surface text-text-muted border-surface-border'
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-bold ${dot}`}
        aria-hidden
      >
        {state === 'done' ? '✓' : ''}
      </span>
      <span
        className={`text-[12px] font-semibold ${
          state === 'upcoming' ? 'text-text-muted' : 'text-text'
        }`}
      >
        {label}
      </span>
      <span className="text-[11px] text-text-muted">{date ? formatDate(date) : '—'}</span>
    </div>
  )
}

/** The 4-stage Pre → Supervised → ILT → Certified ladder for the current consultant. */
function BillableLadder({
  stage,
  milestones,
}: {
  stage: BillableStage
  milestones: BillableMilestone[]
}) {
  const dateFor = (key: MilestoneKey) =>
    milestones.find((m) => m.key === key)?.date ?? null
  const current = STAGE_INDEX[stage]
  const dateByStage: Record<BillableStage, string | null> = {
    pre: null,
    supervised: dateFor('supervised'),
    ilt: dateFor('ilt'),
    certified: dateFor('certified'),
  }
  return (
    <Card title="Billable readiness">
      <div className="flex items-start gap-2">
        {STAGES.map((s) => {
          const idx = STAGE_INDEX[s.key]
          const state = idx < current ? 'done' : idx === current ? 'current' : 'upcoming'
          return (
            <StageRung
              key={s.key}
              label={s.label}
              state={state}
              date={dateByStage[s.key]}
            />
          )
        })}
      </div>
      <p className="mt-4 text-[12px] text-text-muted">
        Supervised-billable ≈ start date + 7 days · ILT complete = your entered ILT
        date · Certified ≈ ILT date + 10 days.
      </p>
    </Card>
  )
}

/** One learning module row with type icon/badge, tags, choice marker, checkbox. */
function ModuleRow({
  module,
  done,
  onToggle,
}: {
  module: TrainingModule
  done: boolean
  onToggle: (value: boolean) => void
}) {
  const meta = moduleTypeMeta(module.type)
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-btn border border-surface-border bg-surface px-4 py-3 transition-colors hover:border-jera-red/40">
      <input
        type="checkbox"
        className="mt-[3px] h-4 w-4 accent-jera-red"
        checked={done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span aria-hidden className="mt-px text-base leading-none">
        {meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`text-[13.5px] font-medium ${
            done ? 'text-text-muted line-through' : 'text-text'
          }`}
        >
          {module.choice ? (
            <span className="mr-1 font-mono text-[12px] font-bold text-jera-red">
              {module.choice}.
            </span>
          ) : null}
          {module.name}
        </span>
        {module.desc ? (
          <span className="mt-0.5 block text-[12px] text-text-muted">{module.desc}</span>
        ) : null}
      </span>
      <span className="flex flex-shrink-0 items-center gap-2">
        {module.tag ? (
          <Badge color={TAG_BADGE[module.tag].color}>{TAG_BADGE[module.tag].label}</Badge>
        ) : null}
        <Badge color={meta.color}>{meta.label}</Badge>
      </span>
    </label>
  )
}

/** One expandable learning path: header with per-path progress + nested groups. */
function PathCard({
  product,
  path,
  modulesDone,
  open,
  onToggleOpen,
  onToggleModule,
}: {
  product: ProductId
  path: TrainingPath
  modulesDone: Record<string, boolean>
  open: boolean
  onToggleOpen: () => void
  onToggleModule: (key: string, value: boolean) => void
}) {
  const progress = computePathProgress(product, path, modulesDone)
  return (
    <div className="overflow-hidden rounded-card border border-surface-border bg-surface-card">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface"
      >
        <span aria-hidden className="text-text-muted">
          {open ? '▾' : '▸'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-text">{path.name}</span>
            {path.tag ? <Badge color="grey">{path.tag}</Badge> : null}
          </span>
          {path.note ? (
            <span className="mt-0.5 block text-[12px] text-text-muted">{path.note}</span>
          ) : null}
        </span>
        <span className="flex w-40 flex-shrink-0 items-center gap-2">
          <ProgressBar
            value={progress.done}
            max={progress.total}
            ariaLabel={`${path.name} progress`}
          />
          <span className="w-10 flex-shrink-0 text-right font-mono text-[11px] text-text-muted">
            {progress.done}/{progress.total}
          </span>
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-5 border-t border-surface-border px-5 py-4">
          {path.groups.map((group, gi) => (
            <div key={`${group.label}-${gi}`} className="flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                {group.label}
              </div>
              {group.note ? (
                <div className="text-[12px] italic text-text-muted">{group.note}</div>
              ) : null}
              <div className="flex flex-col gap-2">
                {group.mods.map((mod) => {
                  const key = moduleKey(product, path.id, mod.name)
                  return (
                    <ModuleRow
                      key={key}
                      module={mod}
                      done={Boolean(modulesDone[key])}
                      onToggle={(value) => onToggleModule(key, value)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function EmployeeView() {
  const { currentEmployee } = useSession()
  const [openState, setOpen] = useReducer(
    (prev: string | null, next: string | null) => (prev === next ? null : next),
    'core',
  )
  const [, forceRender] = useReducer((n: number) => n + 1, 0)

  if (!currentEmployee) {
    return (
      <EmptyState icon="🔒" title="Not signed in" description="Sign in to view your training." />
    )
  }

  const employeeId = currentEmployee.id
  const enrolment = getTrainingEnrolment(employeeId)
  const productId = enrolment?.product_id ?? 'intacct'
  const product = getProduct(productId)
  const paths = getProductPaths(productId)
  const modulesDone = enrolment?.modules_done ?? {}
  const milestones = getEmployeeMilestones(employeeId)
  const overall = getEmployeeOverallProgress(employeeId)
  const stage: BillableStage = (() => {
    if (enrolment?.certified) return 'certified'
    if (enrolment?.ilt_done) return 'ilt'
    if (enrolment?.getting_started_done) return 'supervised'
    return 'pre'
  })()

  const productOptions = listProducts().map((p) => ({ value: p.id, label: p.name }))

  const handleProduct = (value: string) => {
    setTrainingProduct(employeeId, value as ProductId)
    // Re-open the first path of the newly selected product.
    setOpen(null)
    setOpen(getProductPaths(value as ProductId)[0]?.id ?? null)
    forceRender()
  }

  const handleIltDate = (value: string) => {
    setTrainingIltDate(employeeId, value || null)
    forceRender()
  }

  const handleModule = (key: string, value: boolean) => {
    setTrainingModule(employeeId, key, value)
    forceRender()
  }

  const handleFlag = (
    key: 'getting_started_done' | 'ilt_done' | 'certified',
    value: boolean,
  ) => {
    setTrainingMilestone(employeeId, key, value)
    forceRender()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Your product">
        <p className="mb-4 max-w-2xl text-[13px] text-text-muted">
          Work through every {product.name} learning path below. Enter your
          instructor-led training (ILT) date once it is booked — your billable
          readiness dates update automatically.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Sage product"
            value={productId}
            options={productOptions}
            onChange={(e) => handleProduct(e.target.value)}
          />
          <Input
            label="Instructor-led training (ILT) date"
            type="date"
            value={enrolment?.ilt_date ?? ''}
            hint={
              enrolment?.ilt_date
                ? '✓ Saved. Your billable dates update from this date.'
                : 'Enter the date once your ILT is booked.'
            }
            onChange={(e) => handleIltDate(e.target.value)}
          />
        </div>
      </Card>

      <BillableLadder stage={stage} milestones={milestones} />

      <Card title="Billable readiness flags">
        <div className="flex flex-col gap-3">
          <FlagRow
            label="Foundations + shadowing done"
            blurb={`Getting Started on ${product.name} complete — can bill supervised hours.`}
            checked={Boolean(enrolment?.getting_started_done)}
            onToggle={(v) => handleFlag('getting_started_done', v)}
          />
          <FlagRow
            label="ILT complete"
            blurb={`Finished the ${product.hours}-hour ${product.course} course.`}
            checked={Boolean(enrolment?.ilt_done)}
            onToggle={(v) => handleFlag('ilt_done', v)}
          />
          <FlagRow
            label="Certified"
            blurb={`Passed the ${product.cert} certification.`}
            checked={Boolean(enrolment?.certified)}
            onToggle={(v) => handleFlag('certified', v)}
          />
        </div>
      </Card>

      <Card title={`${product.name} learning paths`}>
        <div className="mb-4 flex items-center gap-3">
          <ProgressBar
            value={overall.done}
            max={overall.total}
            ariaLabel="Overall training progress"
          />
          <span className="flex-shrink-0 font-mono text-[12px] font-semibold text-text">
            {overall.done}/{overall.total} modules
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {paths.map((path) => (
            <PathCard
              key={path.id}
              product={productId}
              path={path}
              modulesDone={modulesDone}
              open={openState === path.id}
              onToggleOpen={() => setOpen(path.id)}
              onToggleModule={handleModule}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

function FlagRow({
  label,
  blurb,
  checked,
  onToggle,
}: {
  label: string
  blurb: string
  checked: boolean
  onToggle: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-btn border border-surface-border bg-surface px-4 py-3">
      <input
        type="checkbox"
        className="h-4 w-4 accent-jera-red"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="text-[13px] font-semibold text-text">{label}</span>
      <span className="text-[12px] text-text-muted">{blurb}</span>
    </label>
  )
}

// ── Admin / manager view ──────────────────────────────────────────────────────

function TeamView() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const rows = getBillableSummary()

  const tracked = rows.length
  const enrolled = rows.filter((r) => r.ilt_date_entered).length
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
      key: 'product',
      header: 'Product',
      render: (r) => <span className="text-text">{r.product_name}</span>,
    },
    {
      key: 'ilt_date',
      header: 'ILT date',
      render: (r) =>
        r.ilt_date_entered ? (
          <span className="font-mono text-[13px] text-text">{formatDate(r.ilt_date_entered)}</span>
        ) : (
          <Badge color="grey">No date set</Badge>
        ),
    },
    {
      key: 'supervised',
      header: 'Supervised',
      render: (r) => formatDate(r.supervised_date),
    },
    {
      key: 'ilt_done',
      header: 'ILT done',
      render: (r) => formatDate(r.ilt_date),
    },
    {
      key: 'certified',
      header: 'Certified',
      render: (r) => formatDate(r.certified_date),
    },
    {
      key: 'next',
      header: 'Next',
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
        <StatCard value={enrolled} label="ILT date entered" accent="blue" />
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
        Dates are projected from each consultant’s start date and entered ILT
        date: supervised-billable ~1 week after start, ILT-complete on the entered
        ILT date, and certified ~10 days after the ILT.
      </p>
    </div>
  )
}
