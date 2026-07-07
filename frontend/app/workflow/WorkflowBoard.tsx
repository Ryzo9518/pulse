'use client'

// ── WorkflowBoard ────────────────────────────────────────────────────────────
// The onboarding task-board core, extracted from the page so it can be unit-
// tested without the AppShell/Sidebar (which depend on layout-only hooks).
//
// WS-2: data now flows through useWorkflow() — live (phases/tasks/instances +
// the selected instance's onboarding_task_status via the authenticated proxy;
// writes via server actions where RLS + the freeze/order triggers govern) or
// the mock seam behind the NEXT_PUBLIC_PULSE_DATA flag, unchanged UI either way.
//
// Every role gets the SAME phase-accordion shape (Pre-Arrival → Day 1 → IT Setup
// → HR Admin → Orientation) with per-phase progress bars; the active role only
// changes WHICH phases/tasks are visible (a manager never sees the HR-admin
// phase or the contract/NDA task — HANDOFF §2; live rows are RLS-scoped too).
//
// The defining per-task control is OWNER ASSIGNMENT (admins only, gated by
// can(role,'assignTaskOwners')): an owner <select> drawn from the roster, plus
// a ✉ resend button. Status is a done/pending checkbox with an inferred
// in-progress state; the legacy Start/Done button is kept as a secondary
// affordance. On the live board employees are READ-ONLY (contract C7-emp): the
// status controls render only for admin/manager; an onboardee sees their task
// list with status badges.

import { useCallback, useMemo, useState } from 'react'

import type {
  Employee,
  OnboardingPhase,
  OnboardingTask,
  TaskStatus,
  UserRole,
} from '@/types/database'
import { useWorkflow, type WriteOutcome } from '@/lib/data/useWorkflow'
import { progressOf } from '@/lib/data/workflow-live'
import {
  Badge,
  Button,
  Card,
  EmptyState,
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
  /** The signed-in employee's id (live) — picks their own instance by default. */
  viewerEmployeeId?: string
}

interface IntegrationTarget {
  taskTitle: string
  system: string
}

export function WorkflowBoard({ role, viewerEmployeeId }: WorkflowBoardProps) {
  const { toast } = useToast()
  const board = useWorkflow(role, viewerEmployeeId)

  const [integration, setIntegration] = useState<IntegrationTarget | null>(null)
  // Records a mock contract "upload" so the UI can reflect it (no real upload).
  const [uploadedContract, setUploadedContract] = useState<string | null>(null)

  const { canAssignOwners, canWriteStatus, statusOf, ownerOf, savingTaskId } = board

  const ownerOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...board.owners.map((e) => ({ value: e.id, label: e.display_name })),
    ],
    [board.owners],
  )

  const instanceOptions = useMemo(
    () =>
      board.instances.map((w) => ({ value: w.id, label: w.employeeName })),
    [board.instances],
  )

  const progress = useMemo(
    () => progressOf(board.tasks, statusOf),
    [board.tasks, statusOf],
  )

  // Surfaces a write failure per the outcome contract: the DB's own message
  // (MSG-DENY-TRIGGER) or the generic save error (MSG-ERR-GENERIC); an RLS
  // zero-row denial (MSG-DENY-RLS) is silent — the view simply doesn't change.
  const handleFailure = useCallback(
    (result: WriteOutcome) => {
      if (result.ok || result.denied) return
      toast({
        title: "Couldn't save",
        message:
          result.error ??
          'Something went wrong — your changes were not saved. Try again.',
        variant: 'error',
      })
    },
    [toast],
  )

  // Primary status control: a checkbox that toggles done <-> not-done. A
  // not-done task that has been started reads as 'inprogress'; otherwise
  // 'pending' (matching the prototype's inferred status).
  const toggleDone = useCallback(
    async (task: OnboardingTask) => {
      const isDone = statusOf(task.id) === 'done'
      const result = await board.setStatus(task.id, isDone ? 'pending' : 'done')
      if (result.ok && !isDone) {
        toast({
          title: 'Task complete',
          message: `"${task.title}" marked done.`,
          variant: 'success',
        })
      }
      handleFailure(result)
    },
    [board, statusOf, toast, handleFailure],
  )

  // Secondary status control: advance pending -> inprogress -> done.
  const advance = useCallback(
    async (task: OnboardingTask) => {
      const current = statusOf(task.id)
      const next: TaskStatus = current === 'inprogress' ? 'done' : 'inprogress'
      const result = await board.setStatus(task.id, next)
      if (result.ok && next === 'done') {
        toast({
          title: 'Task complete',
          message: `"${task.title}" marked done.`,
          variant: 'success',
        })
      }
      handleFailure(result)
    },
    [board, statusOf, toast, handleFailure],
  )

  // The defining admin interaction: assigning an owner.
  const assignOwner = useCallback(
    async (task: OnboardingTask, ownerId: string) => {
      const result = await board.assignOwner(task.id, ownerId || null)
      if (!result.ok) {
        handleFailure(result)
        return
      }
      const person = ownerId
        ? board.owners.find((e) => e.id === ownerId)
        : undefined
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
    },
    [board, toast, handleFailure],
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
    const saving = savingTaskId === task.id

    return (
      <div
        key={task.id}
        data-testid={`task-row-${task.id}`}
        data-status={status}
        className="flex items-start gap-3 border-b border-surface-border-light py-3 last:border-b-0"
      >
        {/* Primary status control: done/pending checkbox (admin/manager). An
            onboardee's live board is read-only (C7-emp) — badge instead. */}
        {canWriteStatus ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={isDone}
            disabled={saving}
            aria-label={`Mark "${task.title}" ${isDone ? 'not done' : 'done'}`}
            onClick={() => void toggleDone(task)}
            className={`mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold transition-colors disabled:opacity-50 ${
              isDone
                ? 'border border-jera-red bg-jera-red text-white'
                : 'border-[1.5px] border-surface-border bg-white text-transparent hover:border-jera-red/50'
            }`}
          >
            {isDone ? '✓' : ''}
          </button>
        ) : (
          <span
            aria-hidden
            className={`mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold ${
              isDone
                ? 'border border-jera-red bg-jera-red text-white'
                : 'border-[1.5px] border-surface-border bg-white text-transparent'
            }`}
          >
            {isDone ? '✓' : ''}
          </span>
        )}

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
                disabled={saving}
                onChange={(e) => void assignOwner(task, e.target.value)}
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
          ) : canWriteStatus ? (
            <Button
              size="sm"
              variant={isInProgress ? 'secondary' : 'primary'}
              disabled={saving}
              onClick={() => void advance(task)}
            >
              {saving ? 'Saving…' : isInProgress ? '✓ Done' : 'Start'}
            </Button>
          ) : (
            <Badge color={isInProgress ? 'amber' : 'grey'}>
              {isInProgress ? 'In progress' : 'Pending'}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  // ── Loading / error / empty states (live data path) ────────────────────────
  if (board.loading) {
    return (
      <div className="px-10 py-8">
        <Card>
          <p className="py-8 text-center text-[13px] text-text-muted">
            Loading onboarding board…
          </p>
        </Card>
      </div>
    )
  }

  if (board.error) {
    return (
      <div className="px-10 py-8">
        <Card>
          <EmptyState
            icon="⚠️"
            title="Couldn't load the onboarding board"
            description={`Something went wrong (${board.error}). Refresh to try again.`}
          />
        </Card>
      </div>
    )
  }

  if (!board.hasWorkflow) {
    // No onboarding workflow instance exists for this viewer — the empty state,
    // never a phantom 0% task list.
    const staff = role === 'admin' || role === 'manager'
    return (
      <div className="px-10 py-8">
        <Card>
          <EmptyState
            icon="🗂️"
            title={
              staff
                ? 'No active onboarding workflows'
                : 'No onboarding workflow yet'
            }
            description={
              staff
                ? 'Nobody is being onboarded right now. Onboard a new hire to create their workflow and task list.'
                : "You don't have an active onboarding workflow. If you're a new starter, HR will schedule your onboarding shortly."
            }
          />
        </Card>
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

      {/* Live boards can hold several onboarding instances (one per new hire):
          staff pick whose onboarding they're viewing; progress = done/total. */}
      {board.instances.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-card border border-surface-border bg-surface-card px-5 py-4 shadow-card">
          {(role === 'admin' || role === 'manager') &&
          board.instances.length > 0 ? (
            <label className="flex items-center gap-2 text-[12.5px] font-semibold text-text-secondary">
              Onboarding for
              <Select
                aria-label="Select whose onboarding to view"
                value={board.selectedId ?? ''}
                options={instanceOptions}
                onChange={(e) => board.select(e.target.value)}
                className="max-w-[220px] !py-[6px] !text-[12px]"
              />
            </label>
          ) : (
            <span className="text-[12.5px] font-semibold text-text-secondary">
              {
                board.instances.find((w) => w.id === board.selectedId)
                  ?.employeeName
              }
            </span>
          )}
          <div className="flex min-w-[200px] flex-1 items-center gap-3">
            <div className="flex-1">
              <ProgressBar
                percent={progress.pct}
                ariaLabel="Overall onboarding progress"
              />
            </div>
            <span className="whitespace-nowrap text-[12px] text-text-muted">
              {progress.done}/{progress.total} tasks · {progress.pct}%
            </span>
          </div>
        </div>
      ) : null}

      <PhaseAccordion
        tasks={board.tasks}
        phases={board.phases}
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
              No live integration runs in this phase — this dialog is a stub
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
  phases: OnboardingPhase[]
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
