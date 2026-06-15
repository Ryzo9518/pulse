'use client'

// ── Admin · All Employees / Manager · My Team ─────────────────────────────────
// Roster of employees. Admins see EVERY employee with full fields (role, phone,
// and a per-row "Notify" action). Managers see only THEIR team (employees whose
// manager_id is the manager), restricted to work fields — no phone or other
// POPIA/personal data, no admin actions (HANDOFF §2). Employees are redirected
// to /dashboard and see nothing meanwhile.
//
// NOTE (W8): the manager view here is the minimal POPIA-safe roster. The richer
// prototype version (stat cards, 2FA column) lands in the admin-screens
// workstream. The team scoping + work-fields-only projection are enforced now so
// no personal data leaks to managers in the interim.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  useToast,
  type BadgeColor,
  type DataTableColumn,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { can } from '@/lib/capabilities'
import { listEmployees } from '@/lib/mock'
import type { Employee, EmployeeStatus } from '@/types/database'

const STATUS_COLOR: Record<EmployeeStatus, BadgeColor> = {
  active: 'green',
  onboarding: 'blue',
  probation: 'amber',
  suspended: 'amber',
  terminated: 'red',
}

function statusLabel(status: EmployeeStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function AdminEmployeesPage() {
  const { role, currentEmployee } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // ── Capability guard ──
  // Managers and admins may view a roster; employees are redirected and render
  // nothing while the redirect resolves.
  const canView = can(role, 'viewTeam')
  const canSeePersonal = can(role, 'viewPersonalData') // admin only
  useEffect(() => {
    if (!canView) {
      router.replace('/dashboard')
    }
  }, [canView, router])

  if (!canView) {
    return null
  }

  // Admin sees everyone; manager sees only their direct team.
  const employees = canSeePersonal
    ? listEmployees()
    : listEmployees().filter((e) => e.manager_id === currentEmployee?.id)

  const nameColumn: DataTableColumn<Employee> = {
    key: 'name',
    header: 'Employee',
    render: (e) => (
      <div className="flex items-center gap-3">
        <Avatar
          initials={e.avatar_initials}
          color={e.avatar_color}
          label={e.display_name}
          size="sm"
        />
        <div className="min-w-0">
          <div className="font-semibold text-text">{e.display_name}</div>
          <div className="text-[11px] text-text-muted">{e.email}</div>
        </div>
      </div>
    ),
  }

  const departmentColumn: DataTableColumn<Employee> = {
    key: 'department',
    header: 'Department',
    render: (e) => e.department ?? '—',
  }

  const statusColumn: DataTableColumn<Employee> = {
    key: 'status',
    header: 'Status',
    render: (e) => (
      <Badge color={STATUS_COLOR[e.status]}>{statusLabel(e.status)}</Badge>
    ),
  }

  // Role, phone, and the Notify action are admin-only — phone is POPIA personal
  // data and must never reach a manager.
  const adminColumns: DataTableColumn<Employee>[] = [
    {
      key: 'role',
      header: 'Role',
      render: (e) => (
        <Badge color={e.role === 'admin' ? 'red' : 'grey'}>
          {e.role === 'admin' ? 'Admin' : 'Employee'}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (e) => (
        <span className="whitespace-nowrap font-mono text-[12px] text-text-secondary">
          {e.phone ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            toast({
              title: 'Notification sent',
              message: `${e.display_name} has been notified.`,
              variant: 'success',
            })
          }
        >
          Notify
        </Button>
      ),
    },
  ]

  const columns: DataTableColumn<Employee>[] = canSeePersonal
    ? [nameColumn, adminColumns[0], departmentColumn, statusColumn, adminColumns[1], adminColumns[2]]
    : [nameColumn, departmentColumn, statusColumn]

  return (
    <AppShell>
      <PageHeader
        eyebrow={canSeePersonal ? 'Admin' : 'My team'}
        title={canSeePersonal ? 'All Employees' : 'My Team'}
        subtitle={
          canSeePersonal
            ? 'View and manage every employee in the system'
            : 'Your team members'
        }
      />
      <div className="px-10 py-8">
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              rows={employees}
              rowKey={(e) => e.id}
              emptyMessage={
                canSeePersonal
                  ? 'No employees found.'
                  : 'No team members assigned to you yet.'
              }
            />
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
