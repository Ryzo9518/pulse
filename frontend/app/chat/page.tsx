'use client'

// ── Ask HR — Pulse Assistant ──────────────────────────────────────────────────
// Mirrors the prototype's "Pulse Assistant": an HR/payroll Q&A assistant grounded
// on the company handbook. Replaces the former team-chat + announcements board
// (Jera uses Teams for messaging; Notify All covers announcements). The real LLM
// is wired in the backend phase; for now answers come from lib/askHr.

import { useEffect, useRef, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui'
import { ASK_HR_SUGGESTIONS, HR_EMAIL, answerHrQuestion } from '@/lib/askHr'

interface ChatMessage {
  id: number
  role: 'user' | 'bot'
  text: string
}

export default function AskHrPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const seq = useRef(0)
  const endRef = useRef<HTMLDivElement | null>(null)

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  function ask(text: string) {
    const q = text.trim()
    if (!q || thinking) return
    setMessages((m) => [...m, { id: ++seq.current, role: 'user', text: q }])
    setInput('')
    setThinking(true)
    const answer = answerHrQuestion(q)
    // Brief delay so the "Thinking…" state is visible (the real assistant is async).
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: ++seq.current, role: 'bot', text: answer }])
      setThinking(false)
    }, 600)
  }

  const empty = messages.length === 0

  return (
    <AppShell>
      <PageHeader
        eyebrow="Comms"
        title="Pulse Assistant"
        subtitle="Ask anything about Jera HR & payroll — leave, expenses, policies, certification"
      />

      <div className="mx-auto flex h-[calc(100vh-150px)] w-full max-w-[760px] flex-col px-6 py-6">
        {/* Conversation / empty state */}
        <div className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="flex flex-col items-center gap-5 px-4 pt-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-jera-red text-3xl shadow-red-glow">
                🤖
              </div>
              <div className="max-w-[460px]">
                <h2 className="font-display text-lg font-extrabold text-text">
                  Hi, I&rsquo;m the Pulse Assistant
                </h2>
                <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">
                  Ask me anything about Jera HR &amp; payroll — leave, expense
                  claims, travel rates, policies, pay dates, certification. I
                  answer from the company handbook.
                </p>
              </div>
              <div className="grid w-full max-w-[520px] grid-cols-1 gap-2 sm:grid-cols-2">
                {ASK_HR_SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="rounded-btn border border-surface-border bg-surface-card px-4 py-3 text-left text-[12.5px] font-medium text-text-secondary transition-colors hover:border-jera-red/40 hover:text-text"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-[14px] rounded-br-[4px] bg-jera-red px-[18px] py-[11px] text-[13.5px] text-white">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex items-start gap-2">
                    <div className="mt-[2px] flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] bg-jera-red/10 text-[15px]">
                      🤖
                    </div>
                    <div className="max-w-[80%] rounded-[14px] rounded-tl-[4px] border border-surface-border bg-surface-card px-[18px] py-[13px] text-[13.5px] leading-relaxed text-text-secondary shadow-card">
                      {m.text}
                    </div>
                  </div>
                ),
              )}
              {thinking ? (
                <div className="flex items-start gap-2">
                  <div className="mt-[2px] flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] bg-jera-red/10 text-[15px]">
                    🤖
                  </div>
                  <div className="rounded-[14px] rounded-tl-[4px] border border-surface-border bg-surface-card px-[18px] py-[13px] text-[13px] text-text-muted shadow-card">
                    <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-jera-red align-middle" />
                    Thinking&hellip;
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  ask(input)
                }
              }}
              rows={1}
              placeholder="Ask about leave, expenses, pay dates, policies…"
              aria-label="Ask the Pulse Assistant"
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-btn border border-surface-border bg-surface-card px-4 py-3 text-[13.5px] text-text outline-none transition-colors focus:border-jera-red/50"
            />
            <Button type="submit" disabled={!input.trim() || thinking}>
              Send
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Pulse Assistant uses Jera&rsquo;s HR handbook &amp; payroll rules. For
            anything binding, confirm with HR ({HR_EMAIL}).
          </p>
        </div>
      </div>
    </AppShell>
  )
}
