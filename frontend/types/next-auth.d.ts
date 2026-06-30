import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      /** Pulse employees.id (UUID). */
      employeeId?: string
      /** Pulse role: employee | manager | admin. */
      role?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    employeeId?: string
    /** The PostgREST JWT `sub` (employees.auth_user_id). */
    authUserId?: string
    role?: string
    displayName?: string
  }
}
