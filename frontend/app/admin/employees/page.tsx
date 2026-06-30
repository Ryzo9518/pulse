'use client'

// ── Admin · All Employees / Manager · My Team ─────────────────────────────────
// Roster of employees. Admins see EVERY employee with full fields (role, phone,
// and a per-row "Notify" action). Managers see only THEIR team (employees whose
// manager_id is the manager), restricted to work fields — no phone or other
// POPIA/personal data, no admin actions (HANDOFF §2). Employees are redirected
// to /dashboard and see nothing meanwhile.
//
// W8: the ADMIN view adds three stat cards (Total / Active / Onboarding) and a
// 2FA column (Enabled/Pending from employee.two_factor_enabled). The MANAGER view
// is unchanged — team-scoped, work-fields-only (name/department/status), with no
// phone, no 2FA, and no POPIA personal data. The column boundary is enforced by
// rosterColumnKeys(); the stat cards render only for the admin (canSeePersonal).

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
  StatCard,
  StatCardGrid,
  useToast,
  type BadgeColor,
  type DataTableColumn,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { can } from '@/lib/capabilities'
import { useDirectory } from '@/lib/data/useDirectory'
import { rosterColumnKeys } from '@/lib/roster'
import type { Employee, EmployeeStatus, UserRole } from '@/types/database'

const STATUS_COLOR: Record<EmployeeStatus, BadgeColor> = {
  active: 'green',
  onboarding: 'blue',
  probation: 'amber',
  suspended: 'amber',
  terminated: 'red',
}

const ROLE_BADGE: Record<UserRole, { color: BadgeColor; label: string }> = {
  admin: { color: 'red', label: 'Admin' },
  manager: { color: 'blue', label: 'Manager' },
  employee: { color: 'grey', label: 'Employee' },
}

function statusLabel(status: EmployeeStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function AdminEmployeesPage() {
  const { role, currentEmployee } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { employees: allEmployees, loading, error } = useDirectory()

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

  if (loading || error) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={canSeePersonal ? 'Admin' : 'My team'}
          title={canSeePersonal ? 'All Employees' : 'My Team'}
        />
        <div className="px-10 py-8">
          {error ? (
            <Card>
              <p className="text-sm text-jera-red" role="alert">
                Couldn’t load the roster ({error}). Please refresh.
              </p>
            </Card>
          ) : (
            <div className="space-y-2" aria-busy="true" aria-label="Loading roster">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-card bg-surface-card"
                />
              ))}
            </div>
          )}
        </div>
      </AppShell>
    )
  }

  // Admin sees everyone; manager sees only their direct team.
  const employees = canSeePersonal
    ? allEmployees
    : allEmployees.filter((e) => e.manager_id === currentEmployee?.id)

  // Admin-only roster stats (Total / Active / Onboarding), computed live from the
  // visible roster. Not shown to managers.
  const totalCount = employees.length
  const activeCount = employees.filter((e) => e.status === 'active').length
  const onboardingCount = employees.filter(
    (e) => e.status === 'onboarding',
  ).length

  // All available columns, keyed. The viewer's allowed set is decided by the
  // pure rosterColumnKeys() above, so the admin-only columns (role/phone/Notify)
  // can never render for a manager.
  const columnsByKey: Record<string, DataTableColumn<Employee>> = {
    name: {
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
    role: {
      key: 'role',
      header: 'Role',
      render: (e) => (
        <Badge color={ROLE_BADGE[e.role].color}>{ROLE_BADGE[e.role].label}</Badge>
      ),
    },
    department: {
      key: 'department',
      header: 'Department',
      render: (e) => e.department ?? '—',
    },
    status: {
      key: 'status',
      header: 'Status',
      render: (e) => (
        <Badge color={STATUS_COLOR[e.status]}>{statusLabel(e.status)}</Badge>
      ),
    },
    phone: {
      key: 'phone',
      header: 'Phone',
      render: (e) => (
        <span className="whitespace-nowrap font-mono text-[12px] text-text-secondary">
          {e.phone ?? '—'}
        </span>
      ),
    },
    twofa: {
      key: 'twofa',
      header: '2FA',
      render: (e) =>
        e.two_factor_enabled ? (
          <Badge color="green">Enabled</Badge>
        ) : (
          <Badge color="grey">Pending</Badge>
        ),
    },
    actions: {
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
  }

  const columns: DataTableColumn<Employee>[] = rosterColumnKeys(
    canSeePersonal,
  ).map((key) => columnsByKey[key])

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
      <div className="flex flex-col gap-6 px-10 py-8">
        {canSeePersonal ? (
          <StatCardGrid className="min-[900px]:grid-cols-3">
            <StatCard value={totalCount} label="Total employees" accent="blue" />
            <StatCard value={activeCount} label="Active" accent="green" />
            <StatCard
              value={onboardingCount}
              label="Onboarding"
              accent="amber"
            />
          </StatCardGrid>
        ) : null}
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
