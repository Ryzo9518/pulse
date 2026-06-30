'use client'

// ── Policies (CRITICAL GATE) screen — plan Unit 9 / W2 ────────────────────────
// Lists all HR policies with per-policy acknowledgement status, an overall X/N
// progress bar, and an expand-to-read + "I have read and understood" flow. The
// total is DYNAMIC (= number of active policies), so the gate can never lift
// early when a policy is added. Acknowledging the last policy lifts the
// onboarding gate (a DB trigger maintains policies_completed in live mode).
//
// Data comes through usePolicies(): live (PostgREST proxy, RLS-scoped to the
// signed-in employee) when NEXT_PUBLIC_PULSE_DATA=live, else the mock seam.
//
// Admin authoring (edit / publish / new policy) is not yet wired to live data,
// so it is available only in mock mode (canAuthor). In live mode an admin sees
// the read-only policy list. Non-admins always see the read + acknowledge flow.

import { useEffect, useRef, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  ProgressBar,
  useToast,
} from '@/components/ui'
import { createPolicy, publishPolicyVersion } from '@/lib/mock'
import { can } from '@/lib/capabilities'
import { useSession } from '@/lib/mock/session'
import { useCurrentEmployee } from '@/lib/data/useCurrentEmployee'
import { usePolicies } from '@/lib/data/usePolicies'
import type { HrPolicy, UserRole } from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

// Local editor form shape for the admin edit / create modals.
interface PolicyDraft {
  title: string
  summary: string
  full_text: string
  effective: string
}

function draftFromPolicy(policy: HrPolicy): PolicyDraft {
  return {
    title: policy.title,
    summary: policy.summary ?? '',
    full_text: policy.full_text ?? '',
    effective: policy.effective,
  }
}

const EMPTY_DRAFT: PolicyDraft = {
  title: '',
  summary: '',
  full_text: '',
  effective: 'April 2026',
}

export default function PoliciesPage() {
  const { toast } = useToast()

  // Identity: real signed-in employee (live) or the mock persona (mock mode).
  const mockSession = useSession()
  const liveEmployee = useCurrentEmployee()
  const role = LIVE ? liveEmployee.role : mockSession.role
  const employeeId = LIVE ? liveEmployee.id : mockSession.currentEmployee?.id
  const isAdmin = role ? can(role as UserRole, 'publishPolicies') : false
  // Policy authoring (create / publish) is not yet wired to live data.
  const canAuthor = isAdmin && !LIVE

  const {
    policies,
    ackById,
    acknowledgedCount,
    total,
    allAcknowledged,
    loading,
    error,
    acknowledge,
    startReading,
    reload,
  } = usePolicies(employeeId)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Admin authoring modal state. `editing` holds the policy being versioned;
  // `creating` is true for "+ New policy". Only one is ever active.
  const [editing, setEditing] = useState<HrPolicy | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<PolicyDraft>(EMPTY_DRAFT)

  // Celebrate once when the gate lifts (all policies acknowledged).
  const wasAllAcked = useRef(allAcknowledged)
  useEffect(() => {
    if (allAcknowledged && !wasAllAcked.current) {
      toast({
        variant: 'success',
        title: 'All policies acknowledged',
        message:
          'The onboarding gate is now lifted — you can access the rest of your onboarding.',
        duration: 8000,
      })
    }
    wasAllAcked.current = allAcknowledged
  }, [allAcknowledged, toast])

  function toggleExpand(policy: HrPolicy) {
    setExpandedId((current) => {
      const next = current === policy.id ? null : policy.id
      // Opening a policy starts its read-audit clock.
      if (next === policy.id) startReading(policy.id)
      return next
    })
  }

  async function handleAcknowledge(policy: HrPolicy) {
    if (ackById.get(policy.id)) return // already acked — idempotent
    try {
      await acknowledge(policy.id)
      toast({
        variant: 'success',
        title: 'Policy acknowledged',
        message: `${policy.title} saved.`,
      })
    } catch (e) {
      toast({
        variant: 'error',
        title: 'Couldn’t save acknowledgement',
        message: e instanceof Error ? e.message : 'Please try again.',
      })
    }
  }

  // ── Admin authoring handlers (mock mode only) ───────────────────────────────

  function openEdit(policy: HrPolicy) {
    setCreating(false)
    setEditing(policy)
    setDraft(draftFromPolicy(policy))
  }

  function openCreate() {
    setEditing(null)
    setCreating(true)
    setDraft(EMPTY_DRAFT)
  }

  function closeModal() {
    setEditing(null)
    setCreating(false)
  }

  function handlePublishEdit() {
    if (!editing) return
    if (!draft.title.trim()) return
    const updated = publishPolicyVersion(editing.id, {
      title: draft.title.trim(),
      summary: draft.summary.trim() || null,
      full_text: draft.full_text.trim() || null,
      effective: draft.effective.trim() || editing.effective,
    })
    toast({
      variant: 'success',
      title: `${updated.code} published as ${updated.version}`,
      message: 'Employees must re-acknowledge.',
      duration: 8000,
    })
    closeModal()
    reload()
  }

  function handleCreate() {
    if (!draft.title.trim()) return
    const created = createPolicy({
      title: draft.title.trim(),
      summary: draft.summary.trim() || null,
      full_text: draft.full_text.trim() || null,
      effective: draft.effective.trim() || 'April 2026',
    })
    toast({
      variant: 'success',
      title: `New policy ${created.code} published (${created.version})`,
      message: 'Employees must acknowledge the new policy.',
      duration: 8000,
    })
    closeModal()
    reload()
  }

  function handleDownloadPdf(policy: HrPolicy) {
    toast({
      title: 'PDF download',
      message: `${policy.code} ${policy.version} — PDF download wires to SharePoint in a later phase.`,
    })
  }

  const modalOpen = editing !== null || creating
  const modalTitle = creating ? 'New policy' : `Edit ${editing?.code ?? ''}`

  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="HR Policies"
        subtitle={
          canAuthor
            ? 'Publish and version company HR policies. Publishing a new version requires employees to re-acknowledge that policy.'
            : isAdmin
              ? 'Company HR policies (read-only).'
              : `Read and acknowledge all ${total} policies to unlock the rest of your onboarding.`
        }
        actions={
          canAuthor ? (
            <Button onClick={openCreate} leftIcon={<span aria-hidden>+</span>}>
              New policy
            </Button>
          ) : !isAdmin ? (
            <Badge color={allAcknowledged ? 'green' : 'amber'}>
              {allAcknowledged ? 'Complete' : `${acknowledgedCount}/${total}`}
            </Badge>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-3xl px-10 py-8">
        {loading ? (
          <ul
            className="flex flex-col gap-3"
            aria-busy="true"
            aria-label="Loading policies"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="h-[68px] animate-pulse rounded-card border border-surface-border bg-surface-card"
              />
            ))}
          </ul>
        ) : error ? (
          <div
            role="alert"
            className="rounded-card border border-jera-red/30 bg-jera-red/10 px-5 py-4 text-[13px] text-jera-red"
          >
            Couldn’t load policies ({error}). Please refresh, or contact IT if it
            keeps happening.
          </div>
        ) : (
          <>
            {/* Overall progress + gate status — read + acknowledge flow only */}
            {!isAdmin ? (
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
                    ✓ All {total} policies acknowledged — the onboarding gate is
                    lifted.
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-text-muted">
                    {total - acknowledgedCount}{' '}
                    {total - acknowledgedCount === 1 ? 'policy' : 'policies'}{' '}
                    remaining. You must acknowledge every policy before accessing
                    other onboarding sections.
                  </p>
                )}
              </Card>
            ) : null}

            {/* Policy list */}
            <ul className="flex flex-col gap-3" aria-label="HR policies">
              {policies.map((policy) => {
                const acknowledged = ackById.get(policy.id) ?? false
                const isOpen = expandedId === policy.id

                return (
                  <li key={policy.id}>
                    <div
                      className="overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card"
                      style={{
                        borderLeft: '3px solid var(--policy-accent, #2b72b9)',
                      }}
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
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-text">
                              {policy.title}
                            </span>
                            <Badge color="grey">{policy.version}</Badge>
                            {isAdmin ? null : acknowledged ? (
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

                      {/* Expanded body — meta line, full text, actions */}
                      {isOpen ? (
                        <div
                          id={`policy-body-${policy.id}`}
                          className="border-t border-surface-border-light px-5 pb-5 pt-4"
                        >
                          {/* Version + effective-date meta line + Download PDF */}
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-surface-border-light pb-3">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                              <span>
                                <span className="font-semibold text-text-secondary">
                                  {policy.code}
                                </span>
                              </span>
                              <span>
                                Version{' '}
                                <span className="font-mono font-semibold text-text-secondary">
                                  {policy.version}
                                </span>
                              </span>
                              <span>
                                Effective{' '}
                                <span className="font-semibold text-text-secondary">
                                  {policy.effective}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {canAuthor ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openEdit(policy)}
                                >
                                  Edit / publish
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadPdf(policy)}
                              >
                                ⬇ Download PDF
                              </Button>
                            </div>
                          </div>

                          <p className="whitespace-pre-line text-[13px] leading-7 text-text-secondary">
                            {policy.full_text ?? policy.summary}
                          </p>

                          {/* Acknowledge control — read + acknowledge flow only */}
                          {!isAdmin ? (
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
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Footer CTA once the gate lifts — read + acknowledge flow only */}
            {!isAdmin && allAcknowledged ? (
              <div className="mt-6 flex justify-end">
                <Button onClick={() => window.location.assign('/dashboard')}>
                  Continue onboarding →
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Admin authoring modal (mock mode only — edit existing or create new) */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        eyebrow={creating ? 'Authoring' : `Publish · ${editing?.version ?? ''}`}
        title={modalTitle}
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            {creating ? (
              <Button onClick={handleCreate} disabled={!draft.title.trim()}>
                Create &amp; publish v1.0
              </Button>
            ) : (
              <Button
                onClick={handlePublishEdit}
                disabled={!draft.title.trim()}
              >
                Publish new version
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {!creating && editing ? (
            <p className="rounded-btn border border-jera-amber/30 bg-jera-amber/10 px-4 py-3 text-xs font-semibold text-jera-amber">
              Publishing bumps {editing.code} from {editing.version} and resets
              acknowledgements for this policy only — employees must
              re-acknowledge it.
            </p>
          ) : null}

          <Input
            label="Title"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="e.g. Remote Work Policy"
          />

          <Input
            label="Effective date"
            value={draft.effective}
            onChange={(e) =>
              setDraft((d) => ({ ...d, effective: e.target.value }))
            }
            placeholder="e.g. April 2026"
          />

          <Input
            label="Summary"
            value={draft.summary}
            onChange={(e) =>
              setDraft((d) => ({ ...d, summary: e.target.value }))
            }
            placeholder="One-line summary shown in the list"
          />

          <div className="flex flex-col">
            <label
              htmlFor="policy-body"
              className="mb-[5px] block text-[13px] font-semibold text-text-secondary"
            >
              Policy body
            </label>
            <textarea
              id="policy-body"
              value={draft.full_text}
              onChange={(e) =>
                setDraft((d) => ({ ...d, full_text: e.target.value }))
              }
              rows={12}
              placeholder="Paste the Word document body here (rich text / HTML supported)…"
              className="w-full rounded-btn border-[1.5px] border-surface-border bg-white px-[14px] py-[11px] font-display text-sm leading-7 text-text outline-none transition-all duration-200 focus:border-jera-red focus:ring-2 focus:ring-jera-red/20"
            />
            <span className="mt-[5px] text-xs text-text-muted">
              On the real build this is converted from the uploaded .docx
              (HANDOFF §5.3). For now, paste the body text.
            </span>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
