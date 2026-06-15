'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, ProgressBar, useToast } from '@/components/ui'
import { TOTAL_FORMS } from '@/lib/constants'
import { getPolicyAckState } from '@/lib/mock'
import type { FormKey } from '@/types/database'

import { EmergencyForm } from './EmergencyForm'
import { FORMS_META, getFormMeta } from './forms-config'
import { GoalsForm } from './GoalsForm'
import { PersonalForm } from './PersonalForm'
import { TaxForm } from './TaxForm'

// Policies is not a fillable form here (it redirects to /policies), so the
// sub-view state can only ever be one of the four fillable forms.
type FillableFormKey = Exclude<FormKey, 'policies'>
type ActiveView = 'overview' | FillableFormKey

/** Components keyed by form key for the fillable (non-policies) forms. */
const FORM_COMPONENTS: Record<
  FillableFormKey,
  typeof PersonalForm
> = {
  personal: PersonalForm,
  emergency: EmergencyForm,
  tax: TaxForm,
  goals: GoalsForm,
}

export default function FormsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // The fillable forms track completion in local component state for this mock
  // phase. The Policy Acknowledgement card is NOT local state — it is derived
  // from the policy gate (getPolicyAckState().allAcknowledged) so it auto-
  // completes once every policy is acknowledged on the Policies screen and can
  // never drift from the gate.
  const [localCompleted, setLocalCompleted] = useState<Record<FormKey, boolean>>(
    {
      personal: false,
      emergency: false,
      tax: false,
      policies: false, // overlaid by the ack state below — never set directly
      goals: false,
    },
  )
  const [active, setActive] = useState<ActiveView>('overview')

  const policiesComplete = getPolicyAckState().allAcknowledged

  // Effective completion: policies always reflects the gate, everything else is
  // local state.
  const completed = useMemo<Record<FormKey, boolean>>(
    () => ({ ...localCompleted, policies: policiesComplete }),
    [localCompleted, policiesComplete],
  )

  const doneCount = useMemo(
    () => Object.values(completed).filter(Boolean).length,
    [completed],
  )
  const pct = Math.round((doneCount / TOTAL_FORMS) * 100)

  const goOverview = useCallback(() => setActive('overview'), [])

  const completeForm = useCallback(
    (key: FormKey) => {
      setLocalCompleted((prev) => {
        const next = { ...prev, [key]: true }
        // Policies completion comes from the gate, not local state — overlay it
        // when deciding whether every form is now done.
        const effective = { ...next, policies: policiesComplete }
        const doneNow = Object.values(effective).filter(Boolean).length
        const allDone = doneNow === TOTAL_FORMS
        toast({
          title: allDone
            ? '🎉 All onboarding forms complete!'
            : `${getFormMeta(key).title} saved`,
          message: allDone
            ? 'Nice work — every form is done.'
            : `${doneNow} of ${TOTAL_FORMS} forms completed`,
          variant: 'success',
        })
        return next
      })
      setActive('overview')
    },
    [toast, policiesComplete],
  )

  const openForm = useCallback(
    (key: FormKey) => {
      if (key === 'policies') {
        // Policies isn't rebuilt here — it lives on the dedicated Policies screen.
        router.push('/policies')
        return
      }
      // key is narrowed to FillableFormKey here.
      setActive(key)
    },
    [router],
  )

  // ── Sub-view (a single form) ────────────────────────────────────────────────
  if (active !== 'overview') {
    const meta = getFormMeta(active)
    const FormComponent = FORM_COMPONENTS[active]
    return (
      <AppShell>
        <PageHeader
          eyebrow={`Form ${meta.index} of ${TOTAL_FORMS}`}
          title={`${meta.icon} ${meta.title}`}
          subtitle={meta.description}
        />
        <div className="mx-auto max-w-[640px] px-10 py-8">
          <FormComponent
            onComplete={() => completeForm(active)}
            onBack={goOverview}
          />
        </div>
      </AppShell>
    )
  }

  // ── Overview ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="My Onboarding Forms"
        subtitle="Complete all required forms to finish your onboarding process"
      />
      <div className="mx-auto max-w-[720px] px-10 py-8">
        <Card className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-text">Forms Completion</span>
            <span className="text-2xl font-extrabold text-jera-red">{pct}%</span>
          </div>
          <ProgressBar
            value={doneCount}
            max={TOTAL_FORMS}
            ariaLabel="Forms completion progress"
          />
          <p className="mt-2 text-xs text-text-muted">
            {doneCount} of {TOTAL_FORMS} forms completed
          </p>
        </Card>

        <div className="flex flex-col gap-3">
          {FORMS_META.map((form) => {
            const isDone = completed[form.key]
            return (
              <button
                key={form.key}
                type="button"
                onClick={() => openForm(form.key)}
                className={`block w-full rounded-card border border-surface-border bg-surface-card p-6 text-left shadow-card transition-colors hover:border-jera-red/40 ${
                  isDone ? 'border-l-[3px] border-l-jera-green' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[32px]" aria-hidden>
                    {form.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text">
                        {form.title}
                      </span>
                      {isDone ? (
                        <Badge color="green">✓ Complete</Badge>
                      ) : (
                        <Badge color="amber">Pending</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {form.description}
                    </p>
                  </div>
                  <span className="text-lg text-text-muted" aria-hidden>
                    →
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {doneCount === TOTAL_FORMS ? (
          <div className="mt-6 flex justify-center">
            <Button variant="primary" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
