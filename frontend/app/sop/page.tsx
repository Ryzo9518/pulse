'use client'

import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, ProgressBar, Tabs, useToast } from '@/components/ui'
import { listSops, listSopSteps } from '@/lib/mock'
import { useSession } from '@/lib/mock/session'
import type { SopKey } from '@/types/database'

export default function SopPage() {
  const { toast } = useToast()
  const { currentEmployee } = useSession()

  const sops = useMemo(() => listSops(), [])

  // Active SOP + current step (0-based). Step resets when the SOP changes.
  const [activeSop, setActiveSop] = useState<SopKey>(sops[0]?.key ?? 'projects')
  const [stepIndex, setStepIndex] = useState(0)

  // Locally-tracked completion: no SOP-completion mutator exists in the mock
  // accessor layer yet, so we record completions in component state. Resets on
  // a full page reload, consistent with the rest of the mock phase.
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const steps = useMemo(() => listSopSteps(activeSop), [activeSop])
  const totalSteps = steps.length
  const step = steps[stepIndex]
  const activeSopMeta = sops.find((s) => s.key === activeSop)

  const isLastStep = stepIndex >= totalSteps - 1
  const isFirstStep = stepIndex <= 0
  const sopDone = Boolean(completed[activeSop])

  const completedCount = sops.filter((s) => completed[s.key]).length

  function selectSop(key: SopKey) {
    setActiveSop(key)
    setStepIndex(0)
  }

  function goPrev() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function goNext() {
    setStepIndex((i) => Math.min(totalSteps - 1, i + 1))
  }

  function completeSop() {
    setCompleted((prev) => ({ ...prev, [activeSop]: true }))
    const who = currentEmployee?.display_name ?? 'You'
    toast({
      variant: 'success',
      title: `${activeSopMeta?.name ?? 'SOP'} complete`,
      message: `${who} finished the ${activeSopMeta?.name ?? 'SOP'} walkthrough.`,
    })
  }

  const tabs = sops.map((s) => ({
    value: s.key,
    label: (
      <span className="inline-flex items-center gap-[6px]">
        <span aria-hidden>{s.icon}</span>
        <span>{s.name}</span>
        {completed[s.key] ? (
          <span className="text-jera-green" aria-label="completed">
            ✓
          </span>
        ) : null}
      </span>
    ),
  }))

  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="SOP Walkthroughs"
        subtitle="Step-by-step guides to the systems you'll use every day at Jera."
        actions={
          <Badge color={completedCount === sops.length ? 'green' : 'amber'}>
            {completedCount}/{sops.length} SOPs complete
          </Badge>
        }
      />

      <div className="mx-auto w-full max-w-3xl px-10 py-8">
        {/* Overall progress across all SOPs */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-text-secondary">
              Overall progress
            </span>
            <span className="text-[13px] font-semibold text-jera-red">
              {completedCount} of {sops.length}
            </span>
          </div>
          <ProgressBar
            value={completedCount}
            max={sops.length}
            ariaLabel="SOPs completed"
          />
        </div>

        {/* SOP switcher */}
        <Tabs
          tabs={tabs}
          value={activeSop}
          onChange={(v) => selectSop(v as SopKey)}
          renderPanel={false}
          className="mb-6"
        />

        {step ? (
          <>
            {/* Numbered, colour-coded step navigator */}
            <div className="mb-6 flex flex-wrap gap-[6px]" role="group" aria-label="Steps">
              {steps.map((s, i) => {
                const state =
                  i < stepIndex ? 'past' : i === stepIndex ? 'current' : 'future'
                const tone =
                  state === 'past'
                    ? 'bg-jera-green text-white'
                    : state === 'current'
                      ? 'bg-jera-red text-white shadow-red-glow'
                      : 'bg-surface-border-light text-text-muted hover:text-text-secondary'
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStepIndex(i)}
                    aria-current={i === stepIndex ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    className={`h-9 w-9 rounded-btn font-mono text-[13px] font-bold transition-all duration-200 ${tone}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            {/* SOP card */}
            <Card padded={false} className="mb-5 overflow-hidden">
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] px-8 py-7">
                <div className="flex items-center gap-4">
                  <span className="text-[44px] leading-none" aria-hidden>
                    {step.icon ?? activeSopMeta?.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[2px] text-jera-red">
                      Step {stepIndex + 1} of {totalSteps}
                    </div>
                    <h2 className="font-display text-[22px] font-extrabold text-white">
                      {step.title}
                    </h2>
                  </div>
                </div>
                {step.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-white/60">
                    {step.description}
                  </p>
                ) : null}
              </div>

              <div className="px-8 py-7">
                {step.detail ? (
                  <p className="mb-5 text-sm leading-[1.7] text-text-secondary">
                    {step.detail}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {step.action_text ? (
                    <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-btn border border-jera-red/15 bg-jera-red-light px-4 py-[10px]">
                      <span aria-hidden>👉</span>
                      <span className="text-[13px] font-semibold text-jera-red">
                        {step.action_text}
                      </span>
                    </div>
                  ) : null}
                  {step.tip_text ? (
                    <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-btn border border-jera-amber/20 bg-jera-amber/10 px-4 py-[10px]">
                      <span aria-hidden>💡</span>
                      <span className="text-[13px] text-jera-amber">
                        {step.tip_text}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            {/* Step navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={goPrev} disabled={isFirstStep}>
                ← Previous
              </Button>
              {isLastStep ? (
                <Button
                  onClick={completeSop}
                  disabled={sopDone}
                  leftIcon={sopDone ? <span aria-hidden>✓</span> : undefined}
                >
                  {sopDone ? 'SOP Complete' : 'Complete SOP'}
                </Button>
              ) : (
                <Button onClick={goNext}>Next Step →</Button>
              )}
            </div>
          </>
        ) : (
          <Card>
            <p className="text-sm text-text-muted">
              No steps are available for this SOP yet.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
