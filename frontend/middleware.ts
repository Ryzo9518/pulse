// Route protection. Uses the edge-safe config (no DB) so it runs in the Next
// middleware runtime. The `authorized` callback in auth.config.ts decides
// access; unauthenticated users are sent to /login.
import NextAuth from 'next-auth'
import authConfig from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Run on everything except Auth.js routes, Next internals, and static files.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
