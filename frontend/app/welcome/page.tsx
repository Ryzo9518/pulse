import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth, signOut } from '@/auth'

// Authenticated landing shown after a real Microsoft sign-in. Confirms the full
// chain end-to-end: Entra identity -> resolved Pulse employee -> a live
// PostgREST read performed with the server-minted user token (so the row count
// reflects what RLS lets THIS person see). The rest of the app still runs on
// mock data for now (the live-data swap is the next phase).
export default async function WelcomePage() {
  const session = await auth()
  const employee = session?.employee
  if (!employee) redirect('/login')

  const proof = await probeLiveData(session?.pulseToken)

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <div className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-jera-red">
          Signed in with Microsoft 365
        </p>
        <h1 className="mt-2 font-display text-[28px] font-extrabold text-text">
          Welcome, {employee.firstName}.
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          {employee.displayName} &middot; {employee.email}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-[13px]">
          <Field label="Role" value={roleLabel(employee.role)} />
          <Field label="Owner / Super-admin" value={employee.isOwner ? 'Yes' : 'No'} />
        </dl>

        <div className="mt-6 rounded-btn border border-surface-border bg-surface p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-text-muted">
            Live data check (Row-Level Security)
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">{proof}</p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-btn bg-jera-red px-5 py-3 text-[14px] font-semibold text-white shadow-red-glow transition-colors hover:bg-[#7a1029]"
          >
            Enter Pulse &rarr;
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button
              type="submit"
              className="rounded-btn border border-surface-border px-5 py-3 text-[14px] font-medium text-text-secondary transition-colors hover:bg-surface"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[1px] text-text-muted">{label}</dt>
      <dd className="mt-1 font-display text-[15px] font-bold text-text">{value}</dd>
    </div>
  )
}

function roleLabel(role: string): string {
  return role === 'admin' ? 'Administrator' : role === 'manager' ? 'Manager' : 'Employee'
}

// Hit PostgREST with the signed-in user's minted token. The visible row count
// is enforced by Postgres RLS, not the app — so it differs by role (an admin
// sees everyone; an employee sees far fewer). Failures are reported, not thrown,
// so the landing still renders.
async function probeLiveData(pulseToken: string | undefined): Promise<string> {
  const base = process.env.PULSE_POSTGREST_URL
  if (!base) return 'Data API URL not configured on the server.'
  if (!pulseToken) return 'No user token was minted for this session.'
  try {
    const res = await fetch(`${base}/employees?select=id`, {
      headers: { Authorization: `Bearer ${pulseToken}`, Prefer: 'count=exact' },
      cache: 'no-store',
    })
    if (!res.ok) {
      return `Data API responded ${res.status} — RLS or token issue to investigate.`
    }
    const rows = (await res.json()) as unknown[]
    return `Authenticated to the live database. You can see ${rows.length} employee record(s) under your role's Row-Level Security policy.`
  } catch {
    return 'Could not reach the live data API from the server.'
  }
}
