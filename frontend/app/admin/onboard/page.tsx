'use client'

// ── Admin · New Employee / Schedule Onboarding ────────────────────────────────
// Managers and admins (can(role,'scheduleOnboarding')) capture a new starter and
// kick off their onboarding workflow. Rebuilt to the prototype's newEmployeeData():
//   - a Primary Sage product select + an Onboarding buddy select
//   - email is OPTIONAL and auto-derives to {first}@jera.co.za when left blank
//   - a "Will generate N tasks across M phases" preview panel (per-phase chips
//     with counts), driven by the mock seam's generation plan
//   - on submit, a success hero ("{name} is onboarding") + "View workflow →" CTA
//
// A manager may schedule a starter but never sees the employment contract / HR
// tasks — that boundary is enforced in the workflow view (listTasks), so nothing
// contract-related is surfaced here.
//
// The mock seam exposes no add-employee mutator yet, so the created record is held
// in local component state for the success hero. Swap setCreated for a mutator in
// the backend phase; the rest of the screen stays.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  Input,
  Select,
  useToast,
  type SelectOption,
} from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { can } from '@/lib/capabilities'
import {
  getOnboardingGenerationPlan,
  getOnboardingGenerationTaskTotal,
  listEmployees,
  listProducts,
} from '@/lib/mock'
import { deriveWorkEmail } from '@/lib/onboardGenerate'
import type { ProductId } from '@/types/database'

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
  department: string
  product: ProductId
  startDate: string
  email: string
  buddy: string
}

interface FormErrors {
  name?: string
  jobTitle?: string
  department?: string
  startDate?: string
}

interface CreatedHire {
  name: string
  email: string
  detail: string
}

const EMPTY_FORM: FormState = {
  name: '',
  jobTitle: '',
  department: 'Consulting',
  product: 'intacct',
  startDate: '',
  email: '',
  buddy: '',
}

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? ''
}

export default function AdminOnboardPage() {
  const { role } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // ── Capability guard ──
  // Managers and admins may schedule onboarding; everyone else is redirected and
  // sees nothing while the redirect resolves.
  const canSchedule = can(role, 'scheduleOnboarding')
  useEffect(() => {
    if (!canSchedule) {
      router.replace('/dashboard')
    }
  }, [canSchedule, router])

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [created, setCreated] = useState<CreatedHire | null>(null)

  const departmentOptions: SelectOption[] = useMemo(
    () => DEPARTMENTS.map((d) => ({ value: d, label: d })),
    [],
  )

  const productOptions: SelectOption[] = useMemo(
    () => listProducts().map((p) => ({ value: p.id, label: p.name })),
    [],
  )

  // Buddy = an existing active employee (or "Assign later").
  const buddyOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'Assign later' },
      ...listEmployees()
        .filter((e) => e.status === 'active')
        .map((e) => ({ value: e.id, label: e.display_name })),
    ],
    [],
  )

  // Generation preview — what the workflow WILL create (per-phase counts + total).
  const generationPlan = useMemo(() => getOnboardingGenerationPlan(), [])
  const taskTotal = useMemo(() => getOnboardingGenerationTaskTotal(), [])
  const phaseTotal = generationPlan.length

  if (!canSchedule) {
    return null
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(values: FormState): FormErrors {
    const next: FormErrors = {}
    if (!values.name.trim()) next.name = 'Full name is required.'
    if (!values.jobTitle.trim()) next.jobTitle = 'Job title is required.'
    if (!values.department) next.department = 'Select a department.'
    if (!values.startDate) next.startDate = 'Start date is required.'
    return next
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast({
        title: 'Missing details',
        message: 'Enter at least a name, role and start date.',
        variant: 'error',
      })
      return
    }

    const name = form.name.trim()
    // Email is optional: auto-derive {first}@jera.co.za when blank.
    const email = deriveWorkEmail(form.email, name)
    const product = listProducts().find((p) => p.id === form.product)
    const productName = product?.name ?? form.product

    setCreated({
      name,
      email,
      detail: `${form.jobTitle.trim()} · ${productName} · ${taskTotal} onboarding tasks generated · welcome email to ${email}`,
    })
    setForm(EMPTY_FORM)
    setErrors({})

    toast({
      title: 'Onboarding started',
      message: `${name} added to the roster. ${taskTotal} tasks generated.`,
      variant: 'success',
    })
  }

  const eyebrow = role === 'admin' ? 'Admin' : 'My team'
  const title = role === 'admin' ? 'New Employee' : 'Schedule Onboarding'

  // ── Success hero ──
  if (created) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          subtitle="Create a new employee record and kick off onboarding"
        />
        <div className="px-10 py-8">
          <Card className="mx-auto max-w-[560px] text-center">
            <div className="mb-3 text-[44px] leading-none" aria-hidden>
              🎉
            </div>
            <h2 className="text-[20px] font-extrabold text-text">
              {created.name} is onboarding
            </h2>
            <p className="mx-auto mt-2 max-w-[440px] text-[13px] text-text-secondary">
              {created.detail}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={() => router.push('/workflow')}>
                View workflow →
              </Button>
              <Button variant="ghost" onClick={() => setCreated(null)}>
                Onboard another
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle="Create a new employee record and kick off onboarding"
      />
      <div className="grid gap-6 px-10 py-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
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
            <Select
              label="Department"
              name="department"
              placeholder="Select…"
              options={departmentOptions}
              value={form.department}
              error={errors.department}
              onChange={(e) => update('department', e.target.value)}
            />
            <Select
              label="Primary Sage product"
              name="product"
              options={productOptions}
              value={form.product}
              onChange={(e) => update('product', e.target.value as ProductId)}
            />
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={form.startDate}
              error={errors.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
            <Input
              label="Email (optional)"
              name="email"
              type="email"
              placeholder={
                form.name.trim()
                  ? `${firstNameOf(form.name).toLowerCase()}@jera.co.za`
                  : 'Auto: {first}@jera.co.za'
              }
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
            <Select
              label="Onboarding buddy"
              name="buddy"
              options={buddyOptions}
              value={form.buddy}
              onChange={(e) => update('buddy', e.target.value)}
            />
            <Button type="submit" variant="primary" fullWidth>
              Create Employee &amp; Start Onboarding
            </Button>
          </form>
        </Card>

        {/* Generation preview */}
        <Card title={`Will generate ${taskTotal} tasks across ${phaseTotal} phases`}>
          <div className="flex flex-col gap-3">
            {generationPlan.map((phase) => (
              <div
                key={phase.id}
                className="flex items-center gap-3 rounded-btn border border-surface-border-light bg-surface px-3 py-[10px]"
              >
                <span className="text-base" aria-hidden>
                  {phase.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-text">
                    {phase.name}
                  </div>
                  {phase.days_label ? (
                    <div className="text-[11px] text-text-muted">
                      {phase.days_label}
                    </div>
                  ) : null}
                </div>
                <span className="inline-flex flex-shrink-0 items-center rounded-badge bg-jera-red-light px-[10px] py-1 text-[12px] font-bold text-jera-red">
                  {phase.task_count} {phase.task_count === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            ))}
            <p className="text-[11px] text-text-muted">
              Tasks are auto-assigned to the right owners and scheduled relative to
              the start date.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
