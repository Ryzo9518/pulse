'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui'
import { AuthCard } from '../_components/AuthCard'
import { OtpInput, OTP_LENGTH } from '../_components/OtpInput'

// 2FA screen (mock). Any 6-digit code "succeeds" and routes to the dashboard.
// Mirrors the prototype's `verify2FA` flow (docs/pulse_v4_prototype.html).
export default function TwoFactorPage() {
  const router = useRouter()
  const [code, setCode] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ''))
  const [submitting, setSubmitting] = useState(false)

  const complete = code.every((c) => c !== '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!complete) return
    setSubmitting(true)
    router.push('/dashboard')
  }

  return (
    <AuthCard
      glyph="🔐"
      title="Two-Factor Authentication"
      subtitle="Enter the 6-digit code from your authenticator app"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <OtpInput value={code} onChange={setCode} />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!complete}
          isLoading={submitting}
          rightIcon={<span aria-hidden>→</span>}
        >
          Verify Code
        </Button>

        <p className="text-center text-xs leading-relaxed text-text-muted">
          Open Google Authenticator or Microsoft Authenticator and enter the code for PULSE.
        </p>
        <p className="text-center text-xs text-text-muted">
          <strong>Demo:</strong> enter any 6 digits to continue.
        </p>

        <Link
          href="/login"
          className="text-center text-[13px] font-medium text-jera-blue hover:underline"
        >
          ← Back to Sign In
        </Link>
      </form>
    </AuthCard>
  )
}
