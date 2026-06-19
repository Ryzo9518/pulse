'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

import { Button, Input } from '@/components/ui'
import { AuthCard } from '../_components/AuthCard'

// Forgot-password screen (mock). Two-step visual flow: enter a @jera.co.za
// email, then show a confirmation message. No real reset happens.
// Mirrors the prototype's forgot-password flow (docs/pulse_v4_prototype.html).
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed.toLowerCase().endsWith('@jera.co.za')) {
      setError('Email not found. Please use your @jera.co.za address.')
      return
    }
    setError(null)
    setSubmitting(true)
    // Mock async send.
    setTimeout(() => {
      setSubmitting(false)
      setSent(true)
    }, 700)
  }

  return (
    <AuthCard
      glyph="✉"
      title="Reset Password"
      subtitle="Enter your email and we'll send a reset link"
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <div
            role="status"
            className="rounded-btn border border-jera-green/30 bg-jera-green/10 px-[14px] py-[10px] text-[13px] text-jera-green"
          >
            Reset link sent. Check your inbox at <strong>{email.trim()}</strong> for instructions.
          </div>
          <p className="text-center text-xs leading-relaxed text-text-muted">
            Follow the link in the email to choose a new password. The link expires in 30 minutes.
          </p>
          <Link
            href="/login"
            className="text-center text-[13px] font-medium text-jera-blue hover:underline"
          >
            ← Back to Sign In
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {error ? (
            <div
              role="alert"
              className="animate-shake rounded-btn border border-jera-red/30 bg-jera-red/10 px-[14px] py-[10px] text-[13px] text-jera-red"
            >
              {error}
            </div>
          ) : null}

          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="yourname@jera.co.za"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" variant="primary" fullWidth isLoading={submitting} rightIcon={<span aria-hidden>→</span>}>
            Send Reset Link
          </Button>

          <Link
            href="/login"
            className="text-center text-[13px] font-medium text-jera-blue hover:underline"
          >
            ← Back to Sign In
          </Link>
        </form>
      )}
    </AuthCard>
  )
}
