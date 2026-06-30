// Route protection: every page requires a Microsoft sign-in except /login and
// the Auth.js endpoints. Unauthenticated requests redirect to /login.
import NextAuth from 'next-auth'

import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Run on everything except Next internals, the auth API, and static files.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
