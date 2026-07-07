import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

// The board's data controller (useWorkflow) statically imports the WS-2 server
// actions, whose module graph reaches @/auth (NextAuth) — not loadable under
// jsdom. Mock mode never calls them, so stub the module out for unit tests.
vi.mock('@/app/workflow/actions', () => ({
  updateTaskStatus: vi.fn(async () => ({ ok: true })),
  assignTaskOwner: vi.fn(async () => ({ ok: true })),
}))

import { ToastProvider } from '@/components/ui'
import {
  __resetMockState,
  getTaskStatus,
  getTaskOwner,
  setTaskOwner,
  listTasks,
  listAssignableOwners,
} from '@/lib/mock'

import { WorkflowBoard } from '../WorkflowBoard'

// WorkflowBoard consumes useToast(); ToastProvider supplies it. We deliberately
// test the board core (not the full page) so jsdom doesn't need the AppShell /
// Sidebar layout hooks. Status assertions read back through the accessor layer.

function renderBoard(role: 'employee' | 'manager' | 'admin') {
  return render(
    <ToastProvider>
      <WorkflowBoard role={role} />
    </ToastProvider>,
  )
}

// A task that is 'pending' in the seed and visible in the employee view, so we
// can drive it through the full pending -> inprogress -> done lifecycle.
// t24 (Orientation: "1-on-1 with manager") is employee-visible and seeded pending.
const PENDING_EMPLOYEE_TASK = 't24'
// Its phase header label — accordions start collapsed except the first, so we
// open the target task's phase explicitly to keep the test position-independent.
const PENDING_TASK_PHASE = /Orientation/

beforeEach(() => {
  __resetMockState()
})

describe('WorkflowBoard — status transitions', () => {
  it('Start moves a pending task to inprogress, then Done moves it to done', () => {
    renderBoard('employee')

    expect(getTaskStatus(PENDING_EMPLOYEE_TASK)?.status).toBe('pending')

    // Open the phase that contains the target task (accordions are collapsed
    // unless they're the first phase with tasks).
    fireEvent.click(screen.getByRole('button', { name: PENDING_TASK_PHASE }))

    const row = screen.getByTestId(`task-row-${PENDING_EMPLOYEE_TASK}`)

    // Start -> inprogress
    fireEvent.click(within(row).getByRole('button', { name: 'Start' }))
    expect(getTaskStatus(PENDING_EMPLOYEE_TASK)?.status).toBe('inprogress')

    // The same row should now reflect inprogress via its data-status attribute.
    expect(
      screen.getByTestId(`task-row-${PENDING_EMPLOYEE_TASK}`),
    ).toHaveAttribute('data-status', 'inprogress')

    // Done -> done
    fireEvent.click(
      within(
        screen.getByTestId(`task-row-${PENDING_EMPLOYEE_TASK}`),
      ).getByRole('button', { name: '✓ Done' }),
    )
    expect(getTaskStatus(PENDING_EMPLOYEE_TASK)?.status).toBe('done')
    expect(
      screen.getByTestId(`task-row-${PENDING_EMPLOYEE_TASK}`),
    ).toHaveAttribute('data-status', 'done')
  })

  it('the status checkbox toggles a task done and back to pending', () => {
    renderBoard('employee')
    expect(getTaskStatus(PENDING_EMPLOYEE_TASK)?.status).toBe('pending')

    fireEvent.click(screen.getByRole('button', { name: PENDING_TASK_PHASE }))

    const checkbox = () =>
      within(
        screen.getByTestId(`task-row-${PENDING_EMPLOYEE_TASK}`),
      ).getByRole('checkbox')

    expect(checkbox()).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(checkbox())
    expect(getTaskStatus(PENDING_EMPLOYEE_TASK)?.status).toBe('done')
    expect(checkbox()).toHaveAttribute('aria-checked', 'true')

    // Toggling again returns it to pending.
    fireEvent.click(checkbox())
    expect(getTaskStatus(PENDING_EMPLOYEE_TASK)?.status).toBe('pending')
  })
})

describe('WorkflowBoard — visibility', () => {
  it('employee view never renders admin-only tasks', () => {
    renderBoard('employee')

    // Any task with visibility 'admin' must not appear in the employee board.
    const adminOnlyTasks = listTasks('admin').filter(
      (t) => t.visibility === 'admin',
    )
    expect(adminOnlyTasks.length).toBeGreaterThan(0)

    for (const task of adminOnlyTasks) {
      expect(screen.queryByTestId(`task-row-${task.id}`)).toBeNull()
    }
  })

  it('employee view renders at least one employee/both task', () => {
    renderBoard('employee')
    const visible = listTasks('employee')
    expect(visible.length).toBeGreaterThan(0)
    // At least one of the visible tasks should be present in the DOM (its phase
    // is open by default, or can be found once expanded — the first phase with
    // tasks is open on mount).
    const anyRendered = visible.some(
      (t) => screen.queryByTestId(`task-row-${t.id}`) !== null,
    )
    expect(anyRendered).toBe(true)
  })

  it('admin view renders the phase accordion (not grouped by person)', () => {
    renderBoard('admin')
    // The five onboarding phase headers render as accordion buttons.
    expect(
      screen.getByRole('button', { name: /Pre-Arrival/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /HR Admin/ })).toBeInTheDocument()
  })

  it('manager view excludes the HR-admin phase header AND the contract task', () => {
    renderBoard('manager')

    // The HR-admin phase header must not render for a manager.
    expect(screen.queryByRole('button', { name: /HR Admin/ })).toBeNull()

    // Every HR-admin-phase task and the contract task (t7) are absent, no matter
    // which phase is expanded.
    const managerTasks = listTasks('manager')
    expect(managerTasks.some((t) => t.phase_id === 'hr')).toBe(false)
    expect(managerTasks.some((t) => t.id === 't7')).toBe(false)

    // And admin would have seen both — proving the manager scope is doing work.
    const adminTasks = listTasks('admin')
    expect(adminTasks.some((t) => t.phase_id === 'hr')).toBe(true)
    expect(adminTasks.some((t) => t.id === 't7')).toBe(true)

    // The contract row is never in the manager DOM, even with its Day-1 phase
    // expanded (it is manager_hidden).
    fireEvent.click(screen.getByRole('button', { name: /Day 1 . Welcome/ }))
    expect(screen.queryByTestId('task-row-t7')).toBeNull()
  })

  it('only admins get the owner-assignment <select>; managers do not', () => {
    const { unmount } = renderBoard('admin')
    // "Welcome & office tour" (t6) lives in the Day-1 phase; open it. It is a
    // work task a manager can see too, so it's a fair comparison row.
    fireEvent.click(screen.getByRole('button', { name: /Day 1 . Welcome/ }))
    expect(
      within(screen.getByTestId('task-row-t6')).getByRole('combobox'),
    ).toBeInTheDocument()
    unmount()

    renderBoard('manager')
    fireEvent.click(screen.getByRole('button', { name: /Day 1 . Welcome/ }))
    expect(
      within(screen.getByTestId('task-row-t6')).queryByRole('combobox'),
    ).toBeNull()
  })
})

describe('WorkflowBoard — owner assignment', () => {
  it('changing the owner <select> updates the stored owner (admin)', () => {
    renderBoard('admin')

    // t6 (Welcome & office tour) sits in the Day-1 phase; open it first.
    fireEvent.click(screen.getByRole('button', { name: /Day 1 . Welcome/ }))
    const row = screen.getByTestId('task-row-t6')
    const select = within(row).getByRole('combobox') as HTMLSelectElement

    // Pick an assignable owner that is NOT the current owner.
    const current = getTaskOwner('t6')
    const target = listAssignableOwners().find((e) => e.id !== current)
    expect(target).toBeTruthy()

    fireEvent.change(select, { target: { value: target!.id } })

    // The mutator persisted the new owner, readable through the accessor seam.
    expect(getTaskOwner('t6')).toBe(target!.id)
  })

  it('setTaskOwner persists and can clear an assignment', () => {
    const target = listAssignableOwners()[0]
    setTaskOwner('t6', target.id)
    expect(getTaskOwner('t6')).toBe(target.id)

    setTaskOwner('t6', null)
    expect(getTaskOwner('t6')).toBeNull()
  })
})
