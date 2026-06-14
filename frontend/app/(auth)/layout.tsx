import type { ReactNode } from 'react'

// Full-screen auth layout — pre-login screens (login, 2FA, forgot password).
// Intentionally does NOT render the AppShell/sidebar: these screens are shown
// before the user is "logged in" to the mock session. The dark gradient and
// decorative radial circles match the prototype's `.auth-screen` styling
// (docs/pulse_v4_prototype.html) and DESIGN_SYSTEM.md "Auth Screens".
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#1a1a1a_0%,#2d1520_50%,#1a1a1a_100%)] px-4 py-10">
      {/* Decorative radial circles — subtle red (top-right) + blue (bottom-left). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[100px] -top-[200px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,#91143115_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[150px] -left-[100px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,#2b72b910_0%,transparent_70%)]"
      />
      {children}
    </div>
  )
}
