'use client'

// ── Admin · Notify All ────────────────────────────────────────────────────────
// Admin-only broadcast composer (decision D4 keeps the notification-type picker).
// Rebuilt to the prototype's renderAdminNotify(): an audience select with LIVE
// recipient counts, subject + message, "Deliver via" channel checkboxes (>=1
// required), a Recipients card with avatar chips, a PULSE-branded live email
// preview, a dynamic "Send to N →" button, and an "Announcement sent" success
// state.
//
// Audience resolution + live counts live in lib/notifyAudience.ts (pure +
// unit-tested). Recipients are computed from listEmployees() via the mock seam,
// so the counts reflect the real roster and update as the segment changes.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Button, Card, Input, Select } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { can } from '@/lib/capabilities'
import { listEmployees } from '@/lib/mock'
import {
  audienceCount,
  buildAudienceSegments,
  findSegment,
  recipientsFor,
} from '@/lib/notifyAudience'
import type { NotificationType } from '@/types/database'

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'info', label: 'ℹ️ Info' },
  { value: 'urgent', label: '🚨 Urgent' },
  { value: 'celebration', label: '🎉 Celebration' },
  { value: 'reminder', label: '🔔 Reminder' },
]

function peopleWord(n: number): string {
  return n === 1 ? 'person' : 'people'
}

export default function AdminNotifyPage() {
  const { role } = useSession()
  const router = useRouter()

  // Admin-only guard (can(role,'notifyAll')): bounce others and render nothing.
  const canNotify = can(role, 'notifyAll')
  useEffect(() => {
    if (!canNotify) router.replace('/dashboard')
  }, [canNotify, router])

  // LIVE audience segments + their counts, derived from the roster.
  const roster = useMemo(() => listEmployees(), [])
  const segments = useMemo(() => buildAudienceSegments(roster), [roster])
  const audienceOptions = useMemo<SelectOption[]>(
    () =>
      segments.map((s) => ({
        value: s.value,
        label: `${s.label} (${audienceCount(s, roster)})`,
      })),
    [segments, roster],
  )

  const [type, setType] = useState<NotificationType>('info')
  const [audience, setAudience] = useState('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [channelEmail, setChannelEmail] = useState(true)
  const [channelInApp, setChannelInApp] = useState(true)
  const [sentDetail, setSentDetail] = useState<string | null>(null)

  if (!canNotify) return null

  const segment = findSegment(segments, audience)
  const recipients = recipientsFor(segment, roster)
  const recipientCount = recipients.length
  const chips = recipients.slice(0, 8)
  const more = recipientCount > 8 ? recipientCount - 8 : 0

  const channels = [
    channelEmail && 'email',
    channelInApp && 'in-app notification',
  ].filter(Boolean) as string[]
  const hasChannel = channels.length > 0

  const canSend =
    subject.trim().length > 0 && message.trim().length > 0 && hasChannel

  const previewSubject = subject.trim() || 'Your subject line'
  const previewBody =
    message.trim() || 'Your message to the team will appear here as you type.'

  const handleSend = () => {
    if (!canSend) return
    const chList = channels.join(' + ')
    setSentDetail(
      `“${subject.trim()}” sent to ${recipientCount} ${peopleWord(
        recipientCount,
      )} (${segment.label}) via ${chList}.`,
    )
  }

  const handleReset = () => {
    setSentDetail(null)
    setType('info')
    setAudience('all')
    setSubject('')
    setMessage('')
    setChannelEmail(true)
    setChannelInApp(true)
  }

  // ── Success state ──
  if (sentDetail) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Admin"
          title="Notify All"
          subtitle="Broadcast an announcement to everyone or a specific segment."
        />
        <div className="px-10 py-8">
          <Card className="mx-auto max-w-[560px] text-center">
            <div className="mb-3 text-[44px] leading-none" aria-hidden>
              📣
            </div>
            <h2 className="text-[20px] font-extrabold text-text">
              Announcement sent
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] text-text-secondary">
              {sentDetail}
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" onClick={handleReset}>
                Compose another
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
        eyebrow="Admin"
        title="Notify All"
        subtitle="Broadcast an announcement to everyone or a specific segment."
      />
      <div className="grid gap-6 px-10 py-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        {/* Composer */}
        <Card title="Compose">
          <div className="flex flex-col gap-4">
            <Select
              label="Notification type"
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            />
            <Select
              label="Audience"
              options={audienceOptions}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
            <Input
              label="Subject"
              placeholder="e.g. Office closed on Friday"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <div className="flex flex-col">
              <label
                htmlFor="notify-message"
                className="mb-[5px] block text-[13px] font-semibold text-text-secondary"
              >
                Message
              </label>
              <textarea
                id="notify-message"
                placeholder="Write your message here…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] w-full resize-y rounded-btn border-[1.5px] border-surface-border bg-white px-[14px] py-[11px] font-display text-sm text-text outline-none transition-all duration-200 focus:border-jera-red focus:ring-2 focus:ring-jera-red/20"
              />
            </div>

            {/* Deliver via — at least one channel required */}
            <div className="flex flex-col gap-2">
              <span className="block text-[13px] font-semibold text-text-secondary">
                Deliver via
              </span>
              <label className="flex cursor-pointer items-center gap-[10px] text-[13px] text-text">
                <input
                  type="checkbox"
                  checked={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.checked)}
                  className="h-[18px] w-[18px] rounded-[5px] accent-jera-red"
                />
                Email
              </label>
              <label className="flex cursor-pointer items-center gap-[10px] text-[13px] text-text">
                <input
                  type="checkbox"
                  checked={channelInApp}
                  onChange={(e) => setChannelInApp(e.target.checked)}
                  className="h-[18px] w-[18px] rounded-[5px] accent-jera-red"
                />
                In-app notification
              </label>
              {!hasChannel ? (
                <span className="text-xs text-jera-red">
                  Pick at least one delivery channel.
                </span>
              ) : null}
            </div>

            <Button fullWidth onClick={handleSend} disabled={!canSend}>
              Send to {recipientCount} {peopleWord(recipientCount)} →
            </Button>
          </div>
        </Card>

        {/* Right column: recipients + live email preview */}
        <div className="flex flex-col gap-6">
          <Card title={`Recipients · ${recipientCount}`}>
            {recipientCount === 0 ? (
              <p className="text-[13px] text-text-muted">
                No one matches this audience.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {chips.map((p) => (
                  <Avatar
                    key={p.id}
                    initials={p.avatar_initials}
                    color={p.avatar_color}
                    label={p.display_name}
                    size="sm"
                  />
                ))}
                {more > 0 ? (
                  <span className="inline-flex h-9 items-center rounded-full bg-surface-border-light px-3 text-[12px] font-semibold text-text-secondary">
                    +{more} more
                  </span>
                ) : null}
              </div>
            )}
          </Card>

          {/* PULSE-branded live email preview */}
          <Card title="Email preview">
            <div className="overflow-hidden rounded-card border border-surface-border">
              <div className="flex items-center gap-[10px] bg-surface-sidebar px-5 py-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-jera-red font-display text-sm font-black text-white">
                  P
                </span>
                <span className="font-display text-[15px] font-extrabold tracking-[2px] text-white">
                  PULSE
                </span>
              </div>
              <div className="bg-white px-5 py-5">
                <div className="text-[15px] font-bold text-text">
                  {previewSubject}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-text-secondary">
                  {previewBody}
                </p>
                <div className="mt-5 border-t border-surface-border-light pt-3 text-[11px] text-text-muted">
                  Sent via PULSE · The heartbeat of your team
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
