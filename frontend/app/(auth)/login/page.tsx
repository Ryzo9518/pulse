import { redirect } from 'next/navigation'

import { auth, signIn } from '@/auth'
import { Button } from '@/components/ui'
import { AuthCard } from '../_components/AuthCard'

// Real sign-in: Microsoft (Entra ID) only. MFA and password policy are owned by
// Microsoft 365, so there is no password field here. Access is gated in the
// Auth.js signIn callback to Jera staff who own a Pulse employee record.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const deniedAccess = searchParams?.error === 'AccessDenied'
  const otherError = Boolean(searchParams?.error) && !deniedAccess

  return (
    <AuthCard
      glyph="P"
      title="Welcome to PULSE"
      subtitle="Sign in with your Jera Microsoft account"
    >
      <div className="flex flex-col gap-4">
        {deniedAccess ? (
          <div
            role="alert"
            className="rounded-btn border border-[#DB443730] bg-[#DB443710] px-[14px] py-[10px] text-[13px] text-[#DB4437]"
          >
            That Microsoft account isn&apos;t registered in Pulse yet. Please
            contact HR to be added.
          </div>
        ) : null}
        {otherError ? (
          <div
            role="alert"
            className="rounded-btn border border-[#DB443730] bg-[#DB443710] px-[14px] py-[10px] text-[13px] text-[#DB4437]"
          >
            Sign-in didn&apos;t complete. Please try again.
          </div>
        ) : null}

        <form
          action={async () => {
            'use server'
            await signIn('microsoft-entra-id', { redirectTo: '/dashboard' })
          }}
        >
          <Button
            type="submit"
            variant="primary"
            fullWidth
            rightIcon={<span aria-hidden>→</span>}
          >
            Sign in with Microsoft
          </Button>
        </form>

        <p className="text-center text-xs leading-relaxed text-text-muted">
          Use your <strong>@jera.co.za</strong> Microsoft account. Access is
          limited to current Jera staff.
        </p>
      </div>
    </AuthCard>
  )
}
