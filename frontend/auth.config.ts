// ── Edge-safe Auth.js config (middleware only) ───────────────────────────────
// Used by middleware.ts to gate routes. Intentionally minimal: no providers,
// no jose minting, no PostgREST calls — those live in auth.ts (Node runtime).
// This only decrypts the session cookie and decides public-vs-protected.

import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: { signIn: '/login', error: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user)
      const path = nextUrl.pathname
      // Public surfaces: the login page and the Auth.js endpoints.
      if (path === '/login' || path.startsWith('/api/auth')) return true
      // Everything else requires a real session (redirects to /login).
      return isLoggedIn
    },
  },
} satisfies NextAuthConfig
