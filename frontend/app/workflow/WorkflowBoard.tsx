'use client'

// ── WorkflowBoard ────────────────────────────────────────────────────────────
// The task-board core, extracted from the page so it can be unit-tested without
// the AppShell/Sidebar (which depend on layout-only hooks). It reads tasks for
// the active role from the mock accessor layer, groups them (by phase for the
// employee view, by responsible person for the admin view), and renders each
// task as a status-controllable row. All status mutation goes through the
// centralized `setTaskStatus` mutator; a local version counter forces a
// re-render so the UI reflects the freshly-read status.

import { useCallback, useMemo, useState } from 'react'

import type { OnboardingTask, TaskStatus, UserRole } from '@/types/database'
import {
  listPhases,
  listTasks,
  getTaskStatus,
  setTaskStatus,
} from '@/lib/mock'
import { Badge, Button, Card, Modal, ProgressBar, useToast } from '@/components/ui'

// Maps a task's `default_owner` token (e.g. 'hr', 'siko') to a display label.
// `null` owners (employee self-verification tasks) fall back to a sensible name.
const OWNER_LABELS: Record<string, string> = {
  hr: 'HR Team',
  ryan: 'Ryan de Kock',
  siko: 'Siko Dlamini',
  raymond: 'Raymond Mokoena',
  joann: 'Jo-Ann Visser',
}

function ownerLabel(owner: string | null): string {
  if (!owner) return 'You (self-service)'
  return OWNER_LABELS[owner] ?? owner
}

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
const CONTRACT_TASK_ID = 't7'

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

  // Re-read tasks whenever the role or version changes.
  const tasks = useMemo(() => listTasks(role), [role, version])
  const phases = useMemo(() => listPhases(), [])

  const statusOf = useCallback(
    (taskId: string): TaskStatus => getTaskStatus(taskId)?.status ?? 'pending',
    // version is a dependency so memoized consumers recompute after a mutation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  )

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

  const sendReminder = useCallback(
    (task: OnboardingTask) => {
      toast({
        title: 'Reminder sent',
        message: `Pinged ${ownerLabel(task.default_owner)} about "${task.title}".`,
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

    return (
      <div
        key={task.id}
        data-testid={`task-row-${task.id}`}
        data-status={status}
        className="flex items-start gap-3 border-b border-surface-border-light py-3 last:border-b-0"
      >
        <span
          aria-hidden
          className={`mt-[6px] h-2 w-2 flex-shrink-0 rounded-full ${
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
            <span className="text-[11px] text-text-muted">
              {ownerLabel(task.default_owner)}
            </span>
            <Badge color={prio}>{task.priority}</Badge>
            {task.system ? (
              <Badge color={task.system === 'zoho' ? 'amber' : 'blue'}>
                {SYSTEM_LABEL[task.system] ?? task.system}
              </Badge>
            ) : null}
          </div>

          {task.id === CONTRACT_TASK_ID ? (
            <ContractDropZone
              uploadedName={uploadedContract}
              onUpload={onContractUpload}
            />
          ) : null}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {isDone ? (
            <Badge color="green">✓ Done</Badge>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Send reminder for ${task.title}`}
                onClick={() => sendReminder(task)}
              >
                🔔
              </Button>
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
              <Button
                size="sm"
                variant={isInProgress ? 'secondary' : 'primary'}
                onClick={() => advance(task)}
              >
                {isInProgress ? '✓ Done' : 'Start'}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-10 py-8">
      {role === 'admin' ? (
        <AdminGroups tasks={tasks} renderTaskRow={renderTaskRow} />
      ) : (
        <PhaseAccordion
          tasks={tasks}
          phases={phases}
          statusOf={statusOf}
          renderTaskRow={renderTaskRow}
        />
      )}

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

// ── Employee view: phase accordions ───────────────────────────────────────────

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

// ── Admin view: grouped by responsible person ─────────────────────────────────

interface AdminGroupsProps {
  tasks: OnboardingTask[]
  renderTaskRow: (task: OnboardingTask) => React.ReactNode
}

function AdminGroups({ tasks, renderTaskRow }: AdminGroupsProps) {
  // Group by responsible person (default_owner), with a stable display order.
  const groups = useMemo(() => {
    const byOwner = new Map<string | null, OnboardingTask[]>()
    for (const task of tasks) {
      const list = byOwner.get(task.default_owner) ?? []
      list.push(task)
      byOwner.set(task.default_owner, list)
    }
    return Array.from(byOwner.entries())
      .map(([owner, ownerTasks]) => ({
        owner,
        label: ownerLabel(owner),
        tasks: ownerTasks,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [tasks])

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <Card
          key={group.owner ?? 'self'}
          title={`${group.label} · ${group.tasks.length} task${
            group.tasks.length === 1 ? '' : 's'
          }`}
        >
          <div>{group.tasks.map(renderTaskRow)}</div>
        </Card>
      ))}
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
