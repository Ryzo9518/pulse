// ── Auth.js (NextAuth v5) — Microsoft Entra ID sign-in ───────────────────────
// Authenticates Jera staff via Microsoft 365, resolves them to a Pulse
// `employees` row, and mints the short-lived PostgREST token the data layer
// uses. RLS — not the app — is the real authorization boundary.
//
// SECURITY (POPIA): the PostgREST signing secret and the service-role JWT live
// in server env only and never reach the browser. Only the minted user token is
// exposed to the session (the browser may carry it to call PostgREST directly).

import NextAuth, { type Session } from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

import {
  resolveSignInEmployee,
  EmployeeNotFoundError,
  type ResolvedEmployee,
  type ResolutionDeps,
} from '@/lib/auth/employee-resolution'
import { mintPulseToken } from '@/lib/auth/pulse-token'

function resolutionDeps(): ResolutionDeps {
  const postgrestUrl = process.env.PULSE_POSTGREST_URL
  const serviceJwt = process.env.PULSE_SERVICE_JWT
  if (!postgrestUrl || !serviceJwt) {
    throw new Error('PULSE_POSTGREST_URL and PULSE_SERVICE_JWT must be set')
  }
  return { postgrestUrl, serviceJwt }
}

/** Pull the email + Entra object id out of the provider profile claims. */
function identityFromProfile(profile: Record<string, unknown> | undefined): {
  email?: string
  oid?: string
  name?: string
} {
  if (!profile) return {}
  const email = (profile.email ?? profile.preferred_username) as string | undefined
  const oid = (profile.oid ?? profile.sub) as string | undefined
  const name = profile.name as string | undefined
  return { email, oid, name }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: { params: { scope: 'openid profile email User.Read' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    // Deny sign-in for any Entra user who maps to no employee row.
    async signIn({ profile }) {
      const { email, oid } = identityFromProfile(profile)
      if (!email || !oid) return false
      try {
        await resolveSignInEmployee({ email, oid }, resolutionDeps())
        return true
      } catch (err) {
        if (err instanceof EmployeeNotFoundError) return false
        throw err
      }
    },
    // On first sign-in, persist the resolved employee onto the Auth.js token.
    async jwt({ token, profile }) {
      if (profile) {
        const { email, oid } = identityFromProfile(profile)
        if (email && oid) {
          const employee = await resolveSignInEmployee({ email, oid }, resolutionDeps())
          token.employee = publicEmployee(employee)
          token.authUserId = employee.auth_user_id ?? oid
        }
      }
      return token
    },
    // Expose the employee + a freshly-minted PostgREST token to the session.
    async session({ session, token }) {
      const employee = token.employee as Session['employee']
      const authUserId = token.authUserId as string | undefined
      if (employee) session.employee = employee
      if (authUserId) {
        const secret = process.env.PULSE_PG_JWT_SECRET
        if (secret) {
          session.pulseToken = await mintPulseToken({ authUserId, secret })
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

/** The employee fields safe to carry in the session (no internal-only data). */
function publicEmployee(emp: ResolvedEmployee) {
  return {
    id: emp.id,
    email: emp.email,
    firstName: emp.first_name,
    lastName: emp.last_name,
    displayName: emp.display_name,
    role: emp.role,
    isOwner: emp.is_owner,
  }
}
