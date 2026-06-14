'use client'

// ── Admin · All Employees ─────────────────────────────────────────────────────
// Admin-only directory of every employee in the system. Mirrors the prototype's
// `renderAdminEmployees` table (avatar + name/email, role, department, status,
// phone, and a per-row "Notify" action that fires a toast). The route is guarded:
// non-admin viewers are redirected to /dashboard and see nothing meanwhile.

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
  const { role } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // ── Admin-only guard ──
  // Redirect non-admins away and render nothing while the redirect resolves.
  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [role, router])

  if (role !== 'admin') {
    return null
  }

  const employees = listEmployees()

  const columns: DataTableColumn<Employee>[] = [
    {
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
    },
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
      key: 'department',
      header: 'Department',
      render: (e) => e.department ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => (
        <Badge color={STATUS_COLOR[e.status]}>{statusLabel(e.status)}</Badge>
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

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="All Employees"
        subtitle="View and manage every employee in the system"
      />
      <div className="px-10 py-8">
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              rows={employees}
              rowKey={(e) => e.id}
              emptyMessage="No employees found."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
