import { AuthCard } from '../_components/AuthCard'
import { signIn } from '@/auth'

// Login screen. Real Microsoft 365 sign-in via Auth.js (Entra ID). Entra owns
// the password + MFA; we only resolve the signed-in user to a Pulse employee
// (server-side) and deny anyone without a matching record.
export default function LoginPage() {
  async function signInWithMicrosoft() {
    'use server'
    await signIn('microsoft-entra-id', { redirectTo: '/welcome' })
  }

  return (
    <AuthCard glyph="P" title="Welcome to PULSE" subtitle="Sign in with your Jera account">
      <form action={signInWithMicrosoft} className="flex flex-col gap-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-btn bg-jera-red px-4 py-3 text-[14px] font-semibold text-white shadow-red-glow transition-colors hover:bg-[#7a1029]"
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </button>
      </form>

      <div className="my-1 flex items-center gap-3">
        <span className="h-px flex-1 bg-surface-border" />
        <span className="text-[11px] font-semibold tracking-[1px] text-text-muted">JERA STAFF</span>
        <span className="h-px flex-1 bg-surface-border" />
      </div>
      <p className="text-center text-xs leading-relaxed text-text-muted">
        Use your <strong>@jera.co.za</strong> Microsoft 365 account. Access is limited to
        registered Jera employees.
      </p>
    </AuthCard>
  )
}

// Microsoft four-square logo mark.
function MicrosoftLogo() {
  return (
    <span aria-hidden className="grid h-[18px] w-[18px] grid-cols-2 gap-[2px]">
      <span className="bg-[#F25022]" />
      <span className="bg-[#7FBA00]" />
      <span className="bg-[#00A4EF]" />
      <span className="bg-[#FFB900]" />
    </span>
  )
}
