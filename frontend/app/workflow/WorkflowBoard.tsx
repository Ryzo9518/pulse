'use client'

// ── WorkflowBoard ────────────────────────────────────────────────────────────
// The onboarding task-board core, extracted from the page so it can be unit-
// tested without the AppShell/Sidebar (which depend on layout-only hooks).
//
// Every role gets the SAME phase-accordion shape (Pre-Arrival → Day 1 → IT Setup
// → HR Admin → Orientation) with per-phase progress bars; the active role only
// changes WHICH phases/tasks are visible. That role scoping lives in the data
// layer — listPhases(role)/listTasks(role) — so a manager never sees the HR-admin
// phase or the contract/NDA task (HANDOFF §2). The board just passes the role.
//
// The defining per-task control is OWNER ASSIGNMENT (admins only, gated by
// can(role,'assignTaskOwners')): an owner <select> drawn from the roster that
// fires an "assignment email sent" toast and persists via the setTaskOwner
// mutator, plus a ✉ resend button. Priority dots and Zoho/M365 system badges
// (decision D4) are kept but secondary. Status is a done/pending checkbox with an
// inferred in-progress state, matching the prototype; the legacy Start/Done
// button is kept alongside as a secondary affordance.
//
// All mutation goes through the centralized mock mutators; a local version
// counter forces a re-render so the UI reflects freshly-read state.

import { useCallback, useMemo, useState } from 'react'

import type { Employee, OnboardingTask, TaskStatus, UserRole } from '@/types/database'
import {
  listPhases,
  listTasks,
  listAssignableOwners,
  getTaskStatus,
  setTaskStatus,
  getTaskOwner,
  setTaskOwner,
  getEmployee,
} from '@/lib/mock'
import { can } from '@/lib/capabilities'
import {
  Badge,
  Button,
  Card,
  Modal,
  ProgressBar,
  Select,
  useToast,
} from '@/components/ui'

const PRIORITY_COLOR: Record<string, 'red' | 'amber' | 'grey'> = {
  high: 'red',
  medium: 'amber',
  low: 'grey',
}

const SYSTEM_LABEL: Record<string, string> = {
  zoho: 'Zoho',
  microsoft: 'M365',
}

// The contract task gets a file-drop affordance (FEATURE_SPEC "Contract Upload").
// It is visibility 'both' but manager_hidden, so only the employee + admin ever
// reach this row; the drop-zone itself stays admin-only.
const CONTRACT_TASK_ID = 't7'

/** First name → "@jera.co.za" email, matching the prototype's onEmail toast. */
function ownerEmail(employee: Employee | undefined): string {
  if (!employee) return ''
  return employee.email
}

export interface WorkflowBoardProps {
  role: UserRole
}

interface IntegrationTarget {
  taskTitle: string
  system: string
}

export function WorkflowBoard({ role }: WorkflowBoardProps) {
  const { toast } = useToast()
  // Bumping `version` after a mutation re-reads accessor state and re-renders.
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const [integration, setIntegration] = useState<IntegrationTarget | null>(null)
  // Records a mock contract "upload" so the UI can reflect it (no real upload).
  const [uploadedContract, setUploadedContract] = useState<string | null>(null)

  const canAssignOwners = can(role, 'assignTaskOwners')

  // Re-read role-scoped tasks/phases whenever the role or version changes. This
  // is the single visibility boundary: a manager gets no HR-admin phase and no
  // contract task because the accessor layer drops them (HANDOFF §2).
  const tasks = useMemo(() => listTasks(role), [role, version])
  const phases = useMemo(() => listPhases(role), [role])

  // Roster for the owner <select> (admins only ever render it).
  const owners = useMemo(() => listAssignableOwners(), [])
  const ownerOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...owners.map((e) => ({ value: e.id, label: e.display_name })),
    ],
    [owners],
  )

  const statusOf = useCallback(
    (taskId: string): TaskStatus => getTaskStatus(taskId)?.status ?? 'pending',
    // version is a dependency so memoized consumers recompute after a mutation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  )

  const ownerOf = useCallback(
    (taskId: string): Employee | undefined => {
      const id = getTaskOwner(taskId)
      return id ? getEmployee(id) : undefined
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  )

  // Primary status control: a checkbox that toggles done <-> not-done. A
  // not-done task that has been started reads as 'inprogress'; otherwise
  // 'pending' (matching the prototype's inferred status).
  const toggleDone = useCallback(
    (task: OnboardingTask) => {
      const isDone = statusOf(task.id) === 'done'
      setTaskStatus(task.id, isDone ? 'pending' : 'done')
      if (!isDone) {
        toast({
          title: 'Task complete',
          message: `"${task.title}" marked done.`,
          variant: 'success',
        })
      }
      bump()
    },
    [statusOf, toast, bump],
  )

  // Secondary status control: advance pending -> inprogress -> done.
  const advance = useCallback(
    (task: OnboardingTask) => {
      const current = statusOf(task.id)
      const next: TaskStatus = current === 'inprogress' ? 'done' : 'inprogress'
      setTaskStatus(task.id, next)
      if (next === 'done') {
        toast({
          title: 'Task complete',
          message: `"${task.title}" marked done.`,
          variant: 'success',
        })
      }
      bump()
    },
    [statusOf, toast, bump],
  )

  // The defining interaction: assigning an owner fires an assignment email.
  const assignOwner = useCallback(
    (task: OnboardingTask, ownerId: string) => {
      setTaskOwner(task.id, ownerId || null)
      const person = ownerId ? getEmployee(ownerId) : undefined
      if (person) {
        toast({
          title: 'Task assigned',
          message: `"${task.title}" assigned to ${person.display_name} — assignment email sent.`,
          variant: 'success',
        })
      } else {
        toast({
          title: 'Task unassigned',
          message: `"${task.title}" has no owner.`,
        })
      }
      bump()
    },
    [toast, bump],
  )

  const resendAssignmentEmail = useCallback(
    (task: OnboardingTask, owner: Employee) => {
      toast({
        title: 'Assignment email sent',
        message: `${owner.display_name} was emailed about "${task.title}".`,
      })
    },
    [toast],
  )

  const onContractUpload = useCallback(
    (fileName: string) => {
      setUploadedContract(fileName)
      toast({
        title: 'Contract received',
        message: `${fileName} attached (mock — no file was uploaded).`,
        variant: 'success',
      })
    },
    [toast],
  )

  const renderTaskRow = (task: OnboardingTask) => {
    const status = statusOf(task.id)
    const isDone = status === 'done'
    const isInProgress = status === 'inprogress'
    const prio = PRIORITY_COLOR[task.priority] ?? 'grey'
    const owner = ownerOf(task.id)

    return (
      <div
        key={task.id}
        data-testid={`task-row-${task.id}`}
        data-status={status}
        className="flex items-start gap-3 border-b border-surface-border-light py-3 last:border-b-0"
      >
        {/* Primary status control: done/pending checkbox. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={`Mark "${task.title}" ${isDone ? 'not done' : 'done'}`}
          onClick={() => toggleDone(task)}
          className={`mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold transition-colors ${
            isDone
              ? 'border border-jera-red bg-jera-red text-white'
              : 'border-[1.5px] border-surface-border bg-white text-transparent hover:border-jera-red/50'
          }`}
        >
          {isDone ? '✓' : ''}
        </button>

        {/* Secondary priority dot (decision D4 — kept, de-emphasised). */}
        <span
          aria-hidden
          className={`mt-[7px] h-2 w-2 flex-shrink-0 rounded-full ${
            prio === 'red'
              ? 'bg-jera-red'
              : prio === 'amber'
                ? 'bg-jera-amber'
                : 'bg-text-muted'
          }`}
        />

        <div className="min-w-0 flex-1">
          <div
            className={`text-[13px] font-semibold ${
              isDone ? 'text-text-muted line-through' : 'text-text'
            }`}
          >
            {task.title}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {/* Non-admins see the resolved owner as a read-only chip. */}
            {!canAssignOwners ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                {owner ? (
                  <>
                    <span
                      aria-hidden
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] font-mono text-[9px] font-bold text-white"
                      style={{ backgroundColor: owner.avatar_color }}
                    >
                      {owner.avatar_initials}
                    </span>
                    {owner.display_name}
                  </>
                ) : (
                  'You (self-service)'
                )}
              </span>
            ) : null}
            <Badge color={prio}>{task.priority}</Badge>
            {task.system ? (
              <Badge color={task.system === 'zoho' ? 'amber' : 'blue'}>
                {SYSTEM_LABEL[task.system] ?? task.system}
              </Badge>
            ) : null}
          </div>

          {/* Contract drop-zone stays admin-only. */}
          {task.id === CONTRACT_TASK_ID && canAssignOwners ? (
            <ContractDropZone
              uploadedName={uploadedContract}
              onUpload={onContractUpload}
            />
          ) : null}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {/* PRIMARY per-task control for admins: owner assignment. */}
          {canAssignOwners ? (
            <span className="flex items-center gap-1.5">
              <Select
                aria-label={`Assign owner for ${task.title}`}
                value={owner?.id ?? ''}
                options={ownerOptions}
                onChange={(e) => assignOwner(task, e.target.value)}
                className="max-w-[170px] !py-[6px] !text-[12px]"
              />
              {owner ? (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Resend assignment email to ${ownerEmail(owner)}`}
                  title={`Resend assignment email to ${ownerEmail(owner)}`}
                  onClick={() => resendAssignmentEmail(task, owner)}
                >
                  ✉
                </Button>
              ) : null}
            </span>
          ) : null}

          {task.system ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setIntegration({
                  taskTitle: task.title,
                  system: task.system as string,
                })
              }
            >
              → {SYSTEM_LABEL[task.system] ?? task.system}
            </Button>
          ) : null}

          {/* Secondary status affordance kept alongside the checkbox. */}
          {isDone ? (
            <Badge color="green">✓ Done</Badge>
          ) : (
            <Button
              size="sm"
              variant={isInProgress ? 'secondary' : 'primary'}
              onClick={() => advance(task)}
            >
              {isInProgress ? '✓ Done' : 'Start'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-10 py-8">
      {canAssignOwners ? (
        <div className="mb-3 flex items-center gap-2.5 rounded-card border border-surface-border bg-surface-card px-4 py-3 shadow-card">
          <span aria-hidden className="text-[15px]">
            ✉
          </span>
          <span className="text-[12.5px] text-text-secondary">
            Assign responsibility per task using the dropdown — the assignee is
            emailed automatically. Use ✉ to resend.
          </span>
        </div>
      ) : null}

      <PhaseAccordion
        tasks={tasks}
        phases={phases}
        statusOf={statusOf}
        renderTaskRow={renderTaskRow}
      />

      <Modal
        open={integration !== null}
        onClose={() => setIntegration(null)}
        eyebrow="Integration preview"
        title={
          integration
            ? `${SYSTEM_LABEL[integration.system] ?? integration.system} sync`
            : ''
        }
        footer={
          <Button variant="ghost" onClick={() => setIntegration(null)}>
            Close
          </Button>
        }
      >
        {integration ? (
          <div className="space-y-3 text-sm text-text-secondary">
            <p>
              In a future release, completing{' '}
              <span className="font-semibold text-text">
                “{integration.taskTitle}”
              </span>{' '}
              will sync directly with{' '}
              {integration.system === 'zoho'
                ? 'Zoho One (Projects + Desk)'
                : 'Microsoft 365 (Entra, Teams, Outlook)'}
              .
            </p>
            <p className="text-text-muted">
              No live integration runs in this mock phase — this dialog is a stub
              showing where the connection will sit.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

// ── Phase accordions (shared by every role; visibility differs upstream) ───────

interface PhaseAccordionProps {
  tasks: OnboardingTask[]
  phases: ReturnType<typeof listPhases>
  statusOf: (taskId: string) => TaskStatus
  renderTaskRow: (task: OnboardingTask) => React.ReactNode
}

function PhaseAccordion({
  tasks,
  phases,
  statusOf,
  renderTaskRow,
}: PhaseAccordionProps) {
  // Open the first phase that actually has visible tasks by default.
  const phasesWithTasks = phases
    .map((p) => ({ phase: p, tasks: tasks.filter((t) => t.phase_id === p.id) }))
    .filter((g) => g.tasks.length > 0)

  const [openId, setOpenId] = useState<string | null>(
    phasesWithTasks[0]?.phase.id ?? null,
  )

  return (
    <div className="space-y-3">
      {phasesWithTasks.map(({ phase, tasks: phaseTasks }) => {
        const isOpen = openId === phase.id
        const done = phaseTasks.filter((t) => statusOf(t.id) === 'done').length
        const total = phaseTasks.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0

        return (
          <div key={phase.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : phase.id)}
              className={`flex w-full items-center gap-4 rounded-card border px-5 py-4 text-left transition-colors ${
                isOpen
                  ? 'border-jera-red bg-surface-sidebar text-white'
                  : 'border-surface-border bg-surface-card text-text hover:border-jera-red/40'
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {phase.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[15px] font-bold">
                  {phase.name}
                </div>
                <div
                  className={`text-[11px] ${
                    isOpen ? 'text-white/60' : 'text-text-muted'
                  }`}
                >
                  {phase.days_label} · {done}/{total} complete
                </div>
              </div>
              <div className="hidden w-32 flex-shrink-0 sm:block">
                <ProgressBar
                  percent={pct}
                  ariaLabel={`${phase.name} progress`}
                />
              </div>
              <span
                aria-hidden
                className={isOpen ? 'text-white/70' : 'text-text-muted'}
              >
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {isOpen ? (
              <Card className="mt-2">
                <div>{phaseTasks.map(renderTaskRow)}</div>
              </Card>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

// ── Contract upload drop-zone (mock; records an entry on select/drop) ─────────

interface ContractDropZoneProps {
  uploadedName: string | null
  onUpload: (fileName: string) => void
}

function ContractDropZone({ uploadedName, onUpload }: ContractDropZoneProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onUpload(file.name)
  }

  if (uploadedName) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-btn border border-jera-green/30 bg-jera-green/10 px-3 py-2 text-[12px] text-jera-green">
        <span aria-hidden>📎</span>
        <span className="font-semibold">{uploadedName}</span>
        <span className="text-text-muted">attached</span>
      </div>
    )
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-btn border border-dashed px-4 py-3 text-center text-[12px] transition-colors ${
        dragOver
          ? 'border-jera-red bg-jera-red/5 text-jera-red'
          : 'border-surface-border text-text-muted hover:border-jera-red/40'
      }`}
    >
      <span>Drop signed contract PDF here, or click to select</span>
      <input
        type="file"
        accept="application/pdf"
        className="sr-only"
        aria-label="Upload signed contract"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  )
}

export default WorkflowBoard
