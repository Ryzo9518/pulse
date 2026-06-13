'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button, Input } from '@/components/ui'
import { AuthCard } from '../_components/AuthCard'

// Login screen (mock). Validates a @jera.co.za email client-side; any password
// is accepted. On submit, routes to the 2FA step. Mirrors the prototype's
// `doLogin` flow (docs/pulse_v4_prototype.html).
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed.toLowerCase().endsWith('@jera.co.za')) {
      setError('Please use your @jera.co.za email address.')
      return
    }
    if (password.length < 1) {
      setError('Please enter your password.')
      return
    }
    setError(null)
    setSubmitting(true)
    router.push('/twofactor')
  }

  return (
    <AuthCard glyph="P" title="Welcome to PULSE" subtitle="Sign in with your Jera account">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div
            role="alert"
            className="animate-shake rounded-btn border border-[#DB443730] bg-[#DB443710] px-[14px] py-[10px] text-[13px] text-[#DB4437]"
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
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={submitting} rightIcon={<span aria-hidden>→</span>}>
          Sign In
        </Button>

        <Link
          href="/forgot"
          className="text-center text-[13px] font-medium text-jera-blue hover:underline"
        >
          Forgot your password?
        </Link>

        <div className="my-1 flex items-center gap-3">
          <span className="h-px flex-1 bg-surface-border" />
          <span className="text-[11px] font-semibold tracking-[1px] text-text-muted">DEMO</span>
          <span className="h-px flex-1 bg-surface-border" />
        </div>
        <p className="text-center text-xs leading-relaxed text-text-muted">
          Use any <strong>@jera.co.za</strong> email and any password to continue.
        </p>
      </form>
    </AuthCard>
  )
}
