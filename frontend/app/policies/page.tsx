'use client'

// ── Policies (CRITICAL GATE) screen — plan Unit 9 ─────────────────────────────
// Lists all 20 HR policies with per-policy acknowledgement status, an overall
// X/20 progress bar, and an expand-to-read + "I have read and understood"
// acknowledgement flow. Acknowledging the 20th policy lifts the onboarding gate
// (the acknowledgePolicy mutator flips currentEmployee.policies_completed to
// true); we surface that with a success banner + toast.
//
// The pure gate decision lives in '@/lib/policyGate' and is wired into the
// gated screens / Sidebar by the orchestrator in a separate integration step;
// this screen only drives the acknowledgement state the gate reads.

import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, ProgressBar, useToast } from '@/components/ui'
import {
  acknowledgePolicy,
  getPolicyAckState,
  listPolicies,
  listPolicyAcknowledgements,
  startReadingPolicy,
} from '@/lib/mock'
import { useSession } from '@/lib/mock/session'
import type { HrPolicy } from '@/types/database'

export default function PoliciesPage() {
  const { toast } = useToast()
  const policies = useMemo<HrPolicy[]>(() => listPolicies(), [])

  // A monotonically increasing tick forces a re-render after each mutation so
  // the (module-level, mutable) mock state is re-read. The mock layer is the
  // single source of truth — we never shadow ack state in React.
  const [, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const ackState = getPolicyAckState()
  const ackById = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const a of listPolicyAcknowledgements()) {
      map.set(a.policy_id, a.acknowledged)
    }
    return map
  }, [ackState.acknowledgedCount, ackState.allAcknowledged])

  const { acknowledgedCount, total, allAcknowledged } = ackState

  function toggleExpand(policy: HrPolicy) {
    setExpandedId((current) => {
      const next = current === policy.id ? null : policy.id
      // Opening a policy starts its read-audit clock (idempotent in the mutator).
      if (next === policy.id) {
        startReadingPolicy(policy.id)
        refresh()
      }
      return next
    })
  }

  function handleAcknowledge(policy: HrPolicy) {
    if (ackById.get(policy.id)) return // already acked — idempotent, nothing to do

    acknowledgePolicy(policy.id)

    const after = getPolicyAckState()
    if (after.allAcknowledged) {
      toast({
        variant: 'success',
        title: 'All policies acknowledged',
        message:
          'The onboarding gate is now lifted — you can access the rest of your onboarding.',
        duration: 8000,
      })
    } else {
      toast({
        variant: 'success',
        title: 'Policy acknowledged',
        message: `${after.acknowledgedCount} of ${after.total} complete.`,
      })
    }
    refresh()
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="HR Policies"
        subtitle="Read and acknowledge all 20 policies to unlock the rest of your onboarding."
        actions={
          <Badge color={allAcknowledged ? 'green' : 'amber'}>
            {allAcknowledged ? 'Complete' : `${acknowledgedCount}/${total}`}
          </Badge>
        }
      />

      <div className="mx-auto w-full max-w-3xl px-10 py-8">
        {/* Overall progress + gate status */}
        <Card title="Acknowledgement progress" className="mb-6">
          <div className="flex items-center gap-4">
            <ProgressBar
              value={acknowledgedCount}
              max={total}
              label={`${acknowledgedCount}/${total}`}
              ariaLabel="Policies acknowledged"
              className="flex-1"
            />
          </div>
          {allAcknowledged ? (
            <div
              className="mt-4 rounded-btn border border-jera-green/30 bg-jera-green/10 px-4 py-3 text-[13px] font-semibold text-jera-green"
              role="status"
            >
              ✓ All 20 policies acknowledged — the onboarding gate is lifted.
            </div>
          ) : (
            <p className="mt-3 text-xs text-text-muted">
              {total - acknowledgedCount}{' '}
              {total - acknowledgedCount === 1 ? 'policy' : 'policies'} remaining.
              You must acknowledge every policy before accessing other onboarding
              sections.
            </p>
          )}
        </Card>

        {/* Policy list */}
        <ul className="flex flex-col gap-3" aria-label="HR policies">
          {policies.map((policy) => {
            const acknowledged = ackById.get(policy.id) ?? false
            const isOpen = expandedId === policy.id

            return (
              <li key={policy.id}>
                <div
                  className="overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card"
                  style={{ borderLeft: '3px solid var(--policy-accent, #2b72b9)' }}
                >
                  {/* Header row — click to expand */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(policy)}
                    aria-expanded={isOpen}
                    aria-controls={`policy-body-${policy.id}`}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-border-light"
                  >
                    <span className="text-[26px] leading-none" aria-hidden>
                      {policy.icon ?? '📄'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-text">
                          {policy.title}
                        </span>
                        {acknowledged ? (
                          <Badge color="green">✓ Acknowledged</Badge>
                        ) : isOpen ? (
                          <Badge color="amber">Reading</Badge>
                        ) : (
                          <Badge color="grey">Not started</Badge>
                        )}
                      </span>
                      {policy.summary ? (
                        <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                          {policy.summary}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex-shrink-0 text-xs font-semibold text-jera-blue">
                      {isOpen ? 'Hide ▲' : 'View ▼'}
                    </span>
                  </button>

                  {/* Expanded body — full text + acknowledgement */}
                  {isOpen ? (
                    <div
                      id={`policy-body-${policy.id}`}
                      className="border-t border-surface-border-light px-5 pb-5 pt-4"
                    >
                      <p className="text-[13px] leading-7 text-text-secondary">
                        {policy.full_text ?? policy.summary}
                      </p>

                      <label
                        className={`mt-4 flex items-start gap-3 rounded-btn border px-4 py-3 ${
                          acknowledged
                            ? 'border-jera-green/30 bg-jera-green/10'
                            : 'cursor-pointer border-surface-border bg-surface hover:border-jera-red/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={acknowledged}
                          disabled={acknowledged}
                          onChange={() => handleAcknowledge(policy)}
                          className="mt-[2px] h-4 w-4 flex-shrink-0 accent-jera-red"
                          aria-label={`I have read and understood ${policy.title}`}
                        />
                        <span className="text-[13px] font-semibold text-text">
                          I have read and understood this policy
                          {acknowledged ? (
                            <span className="ml-2 font-normal text-jera-green">
                              ✓ acknowledged
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>

        {/* Footer CTA once the gate lifts */}
        {allAcknowledged ? (
          <div className="mt-6 flex justify-end">
            <Button onClick={() => window.location.assign('/dashboard')}>
              Continue onboarding →
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
