'use client'

// ── Admin · Passwords + 2FA ───────────────────────────────────────────────────
// Admin-only screen (Unit 15). Lists every employee with their 2FA status and
// mock account actions: "Reset password" (toast only — no real change) and an
// "Enable/Disable 2FA" toggle that flips local display state + fires a toast.
//
// Mirrors renderAdminPasswords() in docs/pulse_v4_prototype.html. All mutation is
// mock/local: there is no password-reset or 2FA mutator in @/lib/mock, so the
// 2FA state is held in local React state (seeded from each employee's
// two_factor_enabled) and reset-password is a toast-only action.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Badge, Button, Card, DataTable, useToast } from '@/components/ui'
import type { DataTableColumn } from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { listEmployees } from '@/lib/mock'
import type { Employee } from '@/types/database'

export default function AdminPasswordsPage() {
  const { role } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Admin-only guard: bounce non-admins to the dashboard and render nothing.
  useEffect(() => {
    if (role !== 'admin') router.replace('/dashboard')
  }, [role, router])

  const employees = useMemo(() => listEmployees(), [])

  // Local 2FA display state keyed by employee id (seeded from the mock data).
  // There is no 2FA mutator in @/lib/mock, so the toggle lives here for the
  // mock phase; the backend phase would swap this for a real mutator.
  const [twoFactor, setTwoFactor] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(employees.map((e) => [e.id, e.two_factor_enabled])),
  )

  if (role !== 'admin') return null

  const resetPassword = (employee: Employee) => {
    toast({
      variant: 'success',
      title: 'Password reset',
      message: `A temporary password has been sent to ${employee.email}.`,
    })
  }

  const toggle2fa = (employee: Employee) => {
    setTwoFactor((prev) => {
      const next = !prev[employee.id]
      toast({
        variant: next ? 'success' : 'default',
        title: next ? '2FA enabled' : '2FA disabled',
        message: `Two-factor authentication has been ${
          next ? 'enabled' : 'disabled'
        } for ${employee.display_name}.`,
      })
      return { ...prev, [employee.id]: next }
    })
  }

  const columns: DataTableColumn<Employee>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (e) => (
        <div className="flex items-center gap-[10px]">
          <Avatar
            initials={e.avatar_initials}
            color={e.avatar_color}
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
      key: 'twofa',
      header: '2FA Status',
      render: (e) =>
        twoFactor[e.id] ? (
          <Badge color="green">✓ Enabled</Badge>
        ) : (
          <Badge color="red">✗ Disabled</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div className="flex justify-end gap-[6px]">
          <Button variant="ghost" size="sm" onClick={() => resetPassword(e)}>
            Reset password
          </Button>
          <Button
            variant={twoFactor[e.id] ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => toggle2fa(e)}
          >
            {twoFactor[e.id] ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Passwords & 2FA"
        subtitle="Reset passwords and manage two-factor authentication for staff accounts."
      />
      <div className="px-10 py-8">
        <Card padded={false} className="overflow-hidden p-4">
          <DataTable
            columns={columns}
            rows={employees}
            rowKey={(e) => e.id}
            emptyMessage="No employees found."
          />
        </Card>
      </div>
    </AppShell>
  )
}
