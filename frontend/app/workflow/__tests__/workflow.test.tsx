import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { ToastProvider } from '@/components/ui'
import {
  __resetMockState,
  getTaskStatus,
  listTasks,
} from '@/lib/mock'

import { WorkflowBoard } from '../WorkflowBoard'

// WorkflowBoard consumes useToast(); ToastProvider supplies it. We deliberately
// test the board core (not the full page) so jsdom doesn't need the AppShell /
// Sidebar layout hooks. Status assertions read back through the accessor layer.

function renderBoard(role: 'employee' | 'admin') {
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

  it('admin view renders admin-only tasks (grouped by person)', () => {
    renderBoard('admin')
    // An admin-only task should be present in the admin board.
    const adminOnly = listTasks('admin').find((t) => t.visibility === 'admin')
    expect(adminOnly).toBeTruthy()
    expect(
      screen.getByTestId(`task-row-${adminOnly!.id}`),
    ).toBeInTheDocument()
  })
})
