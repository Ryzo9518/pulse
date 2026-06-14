'use client'

// ── Admin · Notify All ────────────────────────────────────────────────────────
// Admin-only screen (Unit 15). A broadcast composer: pick a notification type,
// write a subject + message, choose a target (everyone or a department), and
// "send". Sending appends a mock AdminNotification and shows a success toast; a
// "sent history" list renders below.
//
// Mirrors renderAdminNotify() in docs/pulse_v4_prototype.html. There is no
// post-notification mutator in @/lib/mock (only listAdminNotifications), so the
// sent history is held in local React state seeded from listAdminNotifications()
// and new sends are prepended locally. The backend phase would swap this for a
// real mutator.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, Input, Select, useToast } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { listAdminNotifications, listEmployees } from '@/lib/mock'
import type { AdminNotification, NotificationType } from '@/types/database'

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'info', label: 'ℹ️ Info' },
  { value: 'urgent', label: '🚨 Urgent' },
  { value: 'celebration', label: '🎉 Celebration' },
  { value: 'reminder', label: '🔔 Reminder' },
]

const TYPE_ICON: Record<NotificationType, string> = {
  info: 'ℹ️',
  urgent: '🚨',
  celebration: '🎉',
  reminder: '🔔',
}

const TYPE_COLOR: Record<NotificationType, 'blue' | 'red' | 'pink' | 'amber'> = {
  info: 'blue',
  urgent: 'red',
  celebration: 'pink',
  reminder: 'amber',
}

function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminNotifyPage() {
  const { role, currentEmployee } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Admin-only guard: bounce non-admins to the dashboard and render nothing.
  useEffect(() => {
    if (role !== 'admin') router.replace('/dashboard')
  }, [role, router])

  // Target options: "everyone" plus each distinct department from the roster.
  const targetOptions = useMemo<SelectOption[]>(() => {
    const departments = Array.from(
      new Set(
        listEmployees()
          .map((e) => e.department)
          .filter((d): d is string => Boolean(d)),
      ),
    ).sort()
    return [
      { value: 'all', label: 'Everyone' },
      ...departments.map((d) => ({ value: d, label: `${d} Department` })),
    ]
  }, [])

  // Sent history — seeded from the mock accessor, newest-first, prepended on send.
  const [history, setHistory] = useState<AdminNotification[]>(() =>
    [...listAdminNotifications()].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
  )

  const [type, setType] = useState<NotificationType>('info')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('all')

  if (role !== 'admin') return null

  const canSend = subject.trim().length > 0 && message.trim().length > 0

  const handleSend = () => {
    if (!canSend) return
    const targetLabel =
      targetOptions.find((o) => o.value === target)?.label ?? target
    const notification: AdminNotification = {
      id: `notif-${Date.now()}`,
      sent_by: currentEmployee?.id ?? 'emp-001',
      notification_type: type,
      subject: subject.trim(),
      body: message.trim(),
      target,
      created_at: new Date().toISOString(),
    }
    setHistory((prev) => [notification, ...prev])
    toast({
      variant: 'success',
      title: 'Notification sent',
      message: `"${notification.subject}" sent to ${targetLabel}.`,
    })
    setSubject('')
    setMessage('')
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Notify All"
        subtitle="Broadcast an announcement to everyone or a specific department."
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
            <Select
              label="Send to"
              options={targetOptions}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <Button fullWidth onClick={handleSend} disabled={!canSend}>
              📣 Send notification
            </Button>
          </div>
        </Card>

        {/* Sent history */}
        <Card title="Sent history">
          {history.length === 0 ? (
            <p className="text-[13px] text-text-muted">
              No notifications sent yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {history.map((n) => (
                <li
                  key={n.id}
                  className="border-b border-surface-border-light py-[10px] last:border-b-0"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span aria-hidden>{TYPE_ICON[n.notification_type]}</span>
                    <span className="text-[13px] font-bold text-text">
                      {n.subject}
                    </span>
                    <Badge color={TYPE_COLOR[n.notification_type]}>
                      {n.notification_type}
                    </Badge>
                    <span className="text-[11px] text-text-muted">
                      → {n.target === 'all' ? 'Everyone' : n.target}
                    </span>
                    <span className="ml-auto text-[11px] text-text-muted">
                      {formatSentAt(n.created_at)}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
