'use client'

// ── Chat & Announcements (Unit 13) ───────────────────────────────────────────
// Two tabs: Announcements (admin-only composer) and General Chat (everyone).
// Mock phase: messages live in the in-memory accessor layer; posting appends via
// postMessage() and we bump a local tick to re-read listMessages() so the new
// message renders. All data goes through @/lib/mock — never the raw seed files.

import { useMemo, useState, type KeyboardEvent } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Button, Card, Input, Tabs, useToast } from '@/components/ui'
import { listMessages, postMessage, getEmployee } from '@/lib/mock'
import { useSession } from '@/lib/mock/session'
import type { Message } from '@/types/database'

const ANNOUNCEMENTS_CHANNEL = 'announcements'
const GENERAL_CHANNEL = 'general'

type ChatTab = typeof ANNOUNCEMENTS_CHANNEL | typeof GENERAL_CHANNEL

/** Relative "x ago" timestamp from an ISO string. */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  })
}

function resolveAuthor(authorId: string): { name: string; initials?: string; color?: string } {
  const emp = getEmployee(authorId)
  if (!emp) return { name: 'Unknown' }
  return {
    name: emp.display_name,
    initials: emp.avatar_initials,
    color: emp.avatar_color,
  }
}

interface MessageRowProps {
  message: Message
}

function MessageRow({ message }: MessageRowProps) {
  const author = resolveAuthor(message.author_id)
  const isAnnouncement = message.message_type === 'announcement'
  return (
    <div
      className={`flex gap-3 rounded-card border border-surface-border bg-surface-card p-[14px] ${
        isAnnouncement ? 'border-l-[3px] border-l-jera-red bg-jera-red-light' : ''
      }`}
    >
      <Avatar
        name={author.name}
        initials={author.initials}
        color={author.color}
        size="sm"
        label={author.name}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[13px] font-bold text-text">{author.name}</span>
          {isAnnouncement ? (
            <span className="text-[10px] font-bold uppercase tracking-[1px] text-jera-red">
              Announcement
            </span>
          ) : null}
          <span className="text-[11px] text-text-muted">
            {timeAgo(message.created_at)}
          </span>
        </div>
        <div className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.5] text-text-secondary">
          {message.body}
        </div>
      </div>
    </div>
  )
}

interface MessageFeedProps {
  messages: Message[]
}

function MessageFeed({ messages }: MessageFeedProps) {
  if (messages.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-text-muted">
        No messages yet. Start the conversation!
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <MessageRow key={m.id} message={m} />
      ))}
    </div>
  )
}

interface ComposeBarProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  disabled?: boolean
  sendLabel: string
}

function ComposeBar({
  value,
  onChange,
  onSend,
  placeholder,
  disabled = false,
  sendLabel,
}: ComposeBarProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled) onSend()
    }
  }
  return (
    <div className="mt-4 flex items-end gap-2">
      <div className="flex-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={placeholder}
        />
      </div>
      <Button onClick={onSend} disabled={disabled || value.trim().length === 0}>
        {sendLabel}
      </Button>
    </div>
  )
}

export default function ChatPage() {
  const { currentEmployee, role } = useSession()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<ChatTab>(ANNOUNCEMENTS_CHANNEL)
  const [announcementDraft, setAnnouncementDraft] = useState('')
  const [chatDraft, setChatDraft] = useState('')
  // Bumped after each postMessage so the feed re-reads the accessor layer.
  const [tick, setTick] = useState(0)

  const isAdmin = role === 'admin'

  // Re-read on every tick (and tab change) so newly posted messages appear.
  const announcements = useMemo(
    () => listMessages(ANNOUNCEMENTS_CHANNEL).slice().reverse(),
    [tick],
  )
  const generalMessages = useMemo(
    () => listMessages(GENERAL_CHANNEL).slice().reverse(),
    [tick],
  )

  const sendAnnouncement = () => {
    const body = announcementDraft.trim()
    if (!body || !isAdmin) return
    postMessage(
      ANNOUNCEMENTS_CHANNEL,
      body,
      'announcement',
      currentEmployee?.id,
    )
    setAnnouncementDraft('')
    setTick((t) => t + 1)
    toast({ title: 'Announcement posted', variant: 'success' })
  }

  const sendChat = () => {
    const body = chatDraft.trim()
    if (!body) return
    postMessage(GENERAL_CHANNEL, body, 'chat', currentEmployee?.id)
    setChatDraft('')
    setTick((t) => t + 1)
  }

  const announcementsPanel = (
    <Card>
      <MessageFeed messages={announcements} />
      {isAdmin ? (
        <ComposeBar
          value={announcementDraft}
          onChange={setAnnouncementDraft}
          onSend={sendAnnouncement}
          placeholder="Post an announcement…"
          sendLabel="Post"
        />
      ) : (
        <div className="mt-4 rounded-btn border border-surface-border bg-surface px-[14px] py-[11px] text-[13px] text-text-muted">
          Only admins can post announcements.
        </div>
      )}
    </Card>
  )

  const generalPanel = (
    <Card>
      <MessageFeed messages={generalMessages} />
      <ComposeBar
        value={chatDraft}
        onChange={setChatDraft}
        onSend={sendChat}
        placeholder="Type a message…"
        sendLabel="Send"
      />
    </Card>
  )

  return (
    <AppShell>
      <PageHeader
        eyebrow="Communication"
        title="Chat & Announcements"
        subtitle="Company-wide announcements and team chat."
      />
      <div className="px-10 py-8">
        <Tabs
          tabs={[
            { value: ANNOUNCEMENTS_CHANNEL, label: 'Announcements' },
            { value: GENERAL_CHANNEL, label: 'General Chat' },
          ]}
          value={activeTab}
          onChange={(next) => setActiveTab(next as ChatTab)}
          renderPanel={false}
        />
        <div className="mt-5">
          {activeTab === ANNOUNCEMENTS_CHANNEL ? announcementsPanel : generalPanel}
        </div>
      </div>
    </AppShell>
  )
}
