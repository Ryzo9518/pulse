'use client'

// Client-side providers. SessionProvider exposes the Auth.js session to client
// components (useSession / useCurrentEmployee) so screens can read the real
// signed-in employee as they migrate off the mock session.
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
