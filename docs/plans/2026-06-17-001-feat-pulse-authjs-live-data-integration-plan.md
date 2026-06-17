# Pulse — Microsoft sign-in (Auth.js) + live-data integration plan

**Date:** 2026-06-17
**Phase:** B1 (app side) → B2 (mock→live data seam swap)
**Status:** PLANNED — execution gated on IT opening ports (see §8). The data API
half of B1 is already LIVE and verified (PR #48).

---

## 1. Context & decisions

- **Data API is live and RLS-enforced** on `jeraaiboss`: PostgREST v12.2.3 at
  `127.0.0.1:3001` over the `pulse` Postgres. Verified with real JWTs — anon is
  denied; an admin sees `employee_tax_banking`; a **manager gets `[]`** for it
  (the POPIA boundary holds at the API, not just the UI). See
  `deploy/jeraaiboss/README.md` §"API/auth layer (B1)".
- **Auth approach DECIDED: Auth.js (NextAuth) inside the Next.js app** — *not*
  GoTrue. Rationale: fewer moving parts to self-host, nothing extra to keep
  running, and our RLS model needs only a JWT carrying `sub` (the employee's
  `auth_user_id`) + `role=authenticated` — which Auth.js can mint directly.
  GoTrue would add a user store we don't need (we manage `employees` ourselves).
- **Public exposure DECIDED: open ports via IT (tomorrow).** The box has no root
  for the agent and inbound 80/443 are blocked at the provider edge. Ryan is
  raising the port request with IT (see §8). Cloudflare Tunnel remains the
  fallback if IT declines.

## 2. Target architecture (the token chain)

```
Browser ──"Sign in with Microsoft"──▶ Auth.js (Entra ID provider, server-side)
   │                                        │ OAuth code flow, client secret
   │                                        ▼
   │                              Entra returns id_token (oid, email, name)
   │                                        │
   │                          server-only: look up employees row by email/oid,
   │                          mint a SHORT-LIVED HS256 JWT signed with the
   │                          SHARED PostgREST secret:
   │                            { sub: employee.auth_user_id,
   │                              role: "authenticated", exp: now+~1h }
   │                                        │
   ▼                                        ▼
Data layer (browser/server) ──Bearer <that JWT>──▶ PostgREST ──SET ROLE authenticated──▶ Postgres RLS
```

**Security invariant (POPIA):** the **shared PostgREST secret never leaves the
server.** Minting happens only in a Next route handler / server action. The
browser only ever holds the short-lived *user* JWT — never the signing secret,
never a `service_role` token. RLS remains the real authorization boundary; the
app is not trusted to filter.

## 3. ID-space reconciliation (must-do, easy to get wrong)

- Mock data uses string ids (`emp-001` = Ryan). The live DB uses UUIDs
  (`00000000-…01` = Ryan) and every `employees` row carries `auth_user_id`
  (seeded for dev = the row id; **placeholder**, to be relinked at first real
  login).
- **First-login relink:** when an M365 user signs in, match them to an
  `employees` row by **email** (primary) — Entra `preferred_username`/`email` →
  `employees.email` (case-insensitive). On match, set
  `employees.auth_user_id = <Entra oid>` (server-side, service-role, once) so
  subsequent logins resolve by `auth_user_id`. No match → deny sign-in (we do not
  auto-provision employees from Entra).
- After relink, the minted JWT's `sub` MUST be the Entra `oid` (now stored in
  `auth_user_id`), so `auth.uid()` resolves correctly. (Until relink, dev tokens
  used `auth_user_id = row id`; the relink migrates each person exactly once.)

## 4. Work breakdown — app side (B1-app)

Grounded in the current files:

- `frontend/app/(auth)/login/page.tsx` — replace the mock login form with a
  single **"Sign in with Microsoft"** action (Auth.js `signIn("microsoft-entra-id")`).
  Keep `AuthCard` shell. Drop the OTP/forgot mock flows (Entra owns MFA).
- **Auth.js setup** — add `next-auth@5` (App-Router native), provider
  `microsoft-entra-id` with `AUTH_MICROSOFT_ENTRA_ID_{ID,SECRET,ISSUER}`
  (issuer = `https://login.microsoftonline.com/<tenant>/v2.0`, tenant
  `4f124a4c-a71e-463c-a004-f65515cff124`, client id
  `46282e6c-0200-498e-adaf-a9dbb52122b1`). `app/api/auth/[...nextauth]/route.ts`.
- **Employee resolution + JWT mint** — a server-only module
  (`frontend/lib/auth/pulse-token.ts`): in the Auth.js `jwt`/`session` callback,
  resolve the employee (relink per §3) and mint the PostgREST JWT (HS256, `jose`)
  using `PULSE_PG_JWT_SECRET` (server env only). Attach to the session as an
  opaque accessor — never expose the secret.
- **Replace the placeholders** — rewrite `frontend/hooks/useAuth.ts` and retire
  the dev `MockSessionProvider` role-switch (`frontend/lib/mock/session.tsx`)
  behind a build flag so dev can still preview roles, but production reads
  identity + role from the authenticated session only.
- `frontend/lib/supabase-client.ts` — point `createClient` at the PostgREST base
  URL with the **per-request user JWT** (supabase-js speaks PostgREST; set the
  `Authorization` header / `accessToken`). Remove reliance on
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` for authenticated calls.
- `frontend/types/database.ts` — add `auth_user_id` to the `Employee` type if
  absent; align the row id type to UUID strings.

## 5. Work breakdown — data seam (B2)

- Swap the bodies in `frontend/lib/mock/index.ts` accessors to call PostgREST
  (the screens import only from here, by design — they stay unchanged).
- Do it **entity by entity** behind a flag (`PULSE_DATA=live|mock`) so each
  screen can be cut over and verified against the live RLS one at a time.
- Add async loading/error states where accessors become network calls (the mock
  ones were synchronous). This is the bulk of B2a.
- Every write path must rely on RLS to reject — never pre-filter in the client
  as the security control. Re-verify the governed statecharts (ack gate, expense,
  onboarding_task_status) against live behavior.

## 6. Env contract (new)

Server-only (never `NEXT_PUBLIC_`):
- `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`,
  `AUTH_MICROSOFT_ENTRA_ID_ISSUER`
- `AUTH_SECRET` (Auth.js session encryption)
- `PULSE_PG_JWT_SECRET` (the **same** HS256 secret as PostgREST — from
  `~/pulse-db/.jwt_secret` on the box)
- `PULSE_POSTGREST_URL` (internal/edge URL of the data API)
- `PULSE_SERVICE_JWT` (service-role token for the one-time relink writes only;
  server-only)

Public:
- `NEXT_PUBLIC_PULSE_POSTGREST_URL` (only if the browser calls PostgREST
  directly; otherwise proxy through Next route handlers and keep it server-side).

## 7. Test plan

- **Local (tonight/before ports):** unit-test the JWT mint + employee-resolution
  logic with a fixture secret; `bun test` / `next build` must stay green. Full
  OAuth round-trip needs a registered redirect URI (see §8) — testable on Ryan's
  Mac against `http://localhost:3000/api/auth/callback/microsoft-entra-id` once
  that URI is added in Entra.
- **Prod (after ports):** real Microsoft login → lands on the dashboard →
  network calls carry the user JWT → manager cannot see payroll (POPIA) → admin
  can → sign-out clears the session.

## 8. Blocking actions for tomorrow (Ryan + IT)

1. **Open inbound TCP 80 and 443** to `154.70.249.26` (jeraaiboss). 80 is needed
   for the Let's Encrypt HTTP-01 challenge + the HTTP→HTTPS redirect; 443 for
   HTTPS. (If IT will only open one, 443 + DNS-01 TLS is possible but more setup.)
2. **A root/sudo path on the box, once** — to install the web front door (Caddy)
   and allow binding 443 (rootless needs `net.ipv4.ip_unprivileged_port_start`
   lowered or a `setcap` — both need root one time). Without any root, fall back
   to **Cloudflare Tunnel** (no ports, no root).
3. **Entra app — add redirect URIs** (App registration `46282e6c-…`):
   - `https://pulse.jera.co.za/api/auth/callback/microsoft-entra-id` (prod)
   - `http://localhost:3000/api/auth/callback/microsoft-entra-id` (local dev test)
4. Confirm the app registration grants delegated `openid profile email User.Read`
   and that the tenant allows the relevant users to sign in.

## 9. Out of scope here (later B-phases)

B4 Graph email, B5 SharePoint storage, B6 Word→HTML policies, B7 on-prem Ask-HR
LLM, B8 production deploy + TLS for `pulse.jera.co.za`.
