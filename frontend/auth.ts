// Full Auth.js instance (Node runtime). Extends the edge-safe config with the
// DB-touching callbacks that gate sign-in to real Pulse employees and carry the
// employee identity into the session.
import NextAuth from 'next-auth'
import authConfig from './auth.config'
import { resolveEmployeeByEmail } from '@/lib/auth/employee-directory'

function emailFromProfile(profile: unknown): string {
  const p = (profile ?? {}) as Record<string, unknown>
  return (
    ((p.email as string) || (p.preferred_username as string) || '') as string
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    // Gate: only Microsoft users who own a Pulse employee record may sign in.
    async signIn({ profile }) {
      const employee = await resolveEmployeeByEmail(emailFromProfile(profile))
      return employee !== null
    },
    // Stamp the employee identity onto the session token at sign-in.
    async jwt({ token, profile }) {
      if (profile) {
        const employee = await resolveEmployeeByEmail(emailFromProfile(profile))
        if (employee) {
          token.employeeId = employee.id
          token.authUserId = employee.auth_user_id ?? employee.id
          token.role = employee.role
          token.displayName = employee.display_name
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.employeeId = token.employeeId as string | undefined
        session.user.role = token.role as string | undefined
        if (token.displayName) session.user.name = token.displayName as string
      }
      return session
    },
  },
})
