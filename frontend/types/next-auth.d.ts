// Type augmentation for Auth.js — adds the resolved Pulse employee + the minted
// PostgREST token to the session and the internal JWT.
import type { EmployeeRole } from '@/lib/auth/employee-resolution'

/** The employee identity carried in the authenticated session. */
export interface SessionEmployee {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  role: EmployeeRole
  isOwner: boolean
}

declare module 'next-auth' {
  interface Session {
    /** The signed-in Pulse employee (resolved from Microsoft Entra). */
    employee?: SessionEmployee
    /** Short-lived PostgREST token for live data calls (server-minted). */
    pulseToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    employee?: SessionEmployee
    /** The employee's auth_user_id (Entra oid after relink) — JWT `sub`. */
    authUserId?: string
  }
}
