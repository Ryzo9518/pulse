'use client'

// ── Admin · Onboard New Employee ──────────────────────────────────────────────
// Admin-only "New Employee" form. Mirrors the prototype's `view-admin-onboard`:
// name, job title/role, email, department, start date, and manager (chosen from
// existing employees). On submit it validates required fields, appends a mock
// employee, and fires a success toast.
//
// NOTE: the mock accessor layer (lib/mock) exposes no add-employee mutator, so
// this screen falls back to LOCAL component state for the created record. The
// newly-added employees are shown in an on-page confirmation list. When a
// mutator is added later, swap `setCreated` for that call — the rest stays.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  Card,
  Input,
  Select,
  useToast,
  type SelectOption,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { listEmployees } from '@/lib/mock'
import { AVATAR_COLOURS } from '@/lib/constants'
import type { Employee } from '@/types/database'

const DEPARTMENTS = [
  'Management',
  'IT',
  'Development',
  'Consulting',
  'Admin',
  'HR',
  'Support',
]

interface FormState {
  name: string
  jobTitle: string
  email: string
  department: string
  startDate: string
  managerId: string
}

interface FormErrors {
  name?: string
  jobTitle?: string
  email?: string
  department?: string
  startDate?: string
  managerId?: string
}

const EMPTY_FORM: FormState = {
  name: '',
  jobTitle: '',
  email: '',
  department: '',
  startDate: '',
  managerId: '',
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { first: parts[0] ?? '', last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

export default function AdminOnboardPage() {
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

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  // Local fallback for created employees — no add-employee mutator exists in
  // the mock layer yet, so newly created records live here for this session.
  const [created, setCreated] = useState<Employee[]>([])

  const managerOptions: SelectOption[] = useMemo(
    () =>
      listEmployees().map((e) => ({
        value: e.id,
        label: `${e.display_name}${e.job_title ? ` · ${e.job_title}` : ''}`,
      })),
    [],
  )

  const departmentOptions: SelectOption[] = useMemo(
    () => DEPARTMENTS.map((d) => ({ value: d, label: d })),
    [],
  )

  if (role !== 'admin') {
    return null
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(values: FormState): FormErrors {
    const next: FormErrors = {}
    if (!values.name.trim()) next.name = 'Full name is required.'
    if (!values.jobTitle.trim()) next.jobTitle = 'Job title is required.'
    if (!values.email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = 'Enter a valid email address.'
    }
    if (!values.department) next.department = 'Select a department.'
    if (!values.startDate) next.startDate = 'Start date is required.'
    if (!values.managerId) next.managerId = 'Select a manager.'
    return next
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast({
        title: 'Check the form',
        message: 'Please complete all required fields.',
        variant: 'error',
      })
      return
    }

    const { first, last } = splitName(form.name)
    const now = new Date().toISOString()
    const id = `emp-new-${created.length + 1}-${Date.now()}`
    const color = AVATAR_COLOURS[created.length % AVATAR_COLOURS.length]

    const employee: Employee = {
      id,
      email: form.email.trim(),
      first_name: first,
      last_name: last,
      display_name: form.name.trim(),
      avatar_initials: deriveInitials(form.name),
      role: 'employee',
      status: 'onboarding',
      job_title: form.jobTitle.trim(),
      department: form.department,
      phone: null,
      avatar_color: color,
      manager_id: form.managerId,
      start_date: form.startDate,
      two_factor_enabled: false,
      expense_role: 'submitter',
      policies_completed: false,
      onboarding_completed: false,
      created_at: now,
      updated_at: now,
    }

    // Fallback: append to local state (no mock mutator available).
    setCreated((prev) => [employee, ...prev])
    setForm(EMPTY_FORM)
    setErrors({})

    toast({
      title: 'Employee created',
      message: `${employee.display_name} has been added and onboarding has started.`,
      variant: 'success',
    })
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Onboard New Employee"
        subtitle="Create a new employee record and kick off onboarding"
      />
      <div className="px-10 py-8">
        <div className="max-w-[560px]">
          <Card>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <Input
                label="Full Name"
                name="name"
                placeholder="e.g. Thabo Mokoena"
                value={form.name}
                error={errors.name}
                onChange={(e) => update('name', e.target.value)}
              />
              <Input
                label="Job Title / Role"
                name="jobTitle"
                placeholder="e.g. Support Technician"
                value={form.jobTitle}
                error={errors.jobTitle}
                onChange={(e) => update('jobTitle', e.target.value)}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="e.g. thabo@jera.co.za"
                value={form.email}
                error={errors.email}
                onChange={(e) => update('email', e.target.value)}
              />
              <Select
                label="Department"
                name="department"
                placeholder="Select…"
                options={departmentOptions}
                value={form.department}
                error={errors.department}
                onChange={(e) => update('department', e.target.value)}
              />
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                value={form.startDate}
                error={errors.startDate}
                onChange={(e) => update('startDate', e.target.value)}
              />
              <Select
                label="Assign Manager"
                name="managerId"
                placeholder="Select…"
                options={managerOptions}
                value={form.managerId}
                error={errors.managerId}
                onChange={(e) => update('managerId', e.target.value)}
              />
              <Button type="submit" variant="primary" fullWidth>
                Create Employee &amp; Start Onboarding
              </Button>
            </form>
          </Card>

          {created.length > 0 ? (
            <Card title="Created this session" className="mt-4">
              <ul className="flex flex-col gap-3">
                {created.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <Avatar
                      initials={e.avatar_initials}
                      color={e.avatar_color}
                      label={e.display_name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text">
                        {e.display_name}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {e.job_title} · {e.department} · {e.email}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}
