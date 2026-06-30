// Edge-safe Auth.js config. Contains ONLY what middleware needs (providers +
// the `authorized` gate). No database access here — the DB-touching callbacks
// (signIn/jwt/session) live in `auth.ts`, which runs in the Node runtime.
//
// Env (auto-read by Auth.js): AUTH_MICROSOFT_ENTRA_ID_{ID,SECRET,ISSUER},
// AUTH_SECRET, AUTH_URL, AUTH_TRUST_HOST.
import type { NextAuthConfig } from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

export const authConfig = {
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: { params: { scope: 'openid profile email User.Read' } },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    // Runs in middleware on every matched request. Protects the whole app and
    // bounces an already-signed-in user away from /login.
    authorized({ auth, request }) {
      const loggedIn = !!auth?.user
      const { pathname } = request.nextUrl
      if (pathname.startsWith('/login')) {
        if (loggedIn) {
          return Response.redirect(new URL('/dashboard', request.nextUrl))
        }
        return true
      }
      return loggedIn
    },
  },
} satisfies NextAuthConfig

export default authConfig
