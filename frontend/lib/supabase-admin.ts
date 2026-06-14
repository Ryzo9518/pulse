import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ── Service-role Supabase client (SERVER-ONLY) ────────────────────────────────
// Plan Unit 1. The certification daily sweep (renewal reminders) and the
// admin-verify writes cannot run under the anon-key clients because RLS gates
// those writes (origin prerequisite P2). This client uses the Supabase
// SERVICE-ROLE key, which BYPASSES Row Level Security.
//
// SECURITY — do not break these rules:
//   • NEVER import this module into a client component or anything bundled to the
//     browser. It is for server routes / scheduled jobs only.
//   • The key is read from SUPABASE_SERVICE_ROLE_KEY (NOT prefixed NEXT_PUBLIC_,
//     so Next.js never ships it to the client). Ryan must populate this env var
//     on the host; it is intentionally absent from the repo.
//
// Throws clearly if the env vars are missing rather than failing silently at
// query time.

export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('createAdminSupabase: NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!serviceRoleKey) {
    throw new Error(
      'createAdminSupabase: SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'This server-only key must be configured on the host before the ' +
        'certification sweep or admin-verify writes can run.',
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
