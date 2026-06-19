# PULSE — Production Auth Architecture (single source of truth)

**Verified against the running box (jeraaiboss) and the deployed `feat/m365-auth` build.**

## TL;DR — clearing up the "Supabase" confusion

- There is **no Supabase cloud, no GoTrue, no Supabase Auth** in this deployment.
- "Supabase" here means only **self-hosted Postgres + PostgREST** (the data API). PostgREST is the same REST interface Supabase exposes — that's why the `@supabase/*` libs *can* speak to it — but they are **not on the live path today** (screens still render mock data).
- **Authentication is done entirely by Auth.js (NextAuth v5) running inside the Next.js app.** Microsoft Entra is the identity provider.
- `database/migrations/000_prod_auth.sql` is **not an auth service** — it's a 10-line SQL helper that defines `auth.uid()` to read the `sub` claim of whatever JWT PostgREST has verified. That's all.

## 1. End-to-end production login flow (every hop)

```
1. Browser → https://pulse.jera.co.za            (Caddy: TLS termination)
2. Caddy   → http://127.0.0.1:3000               (reverse proxy to Next.js)
3. Next middleware: no session → redirect to /login
4. User clicks "Sign in with Microsoft"
     → POST /api/auth/signin/microsoft-entra-id   (Auth.js, server-side)
5. Auth.js → redirects browser to login.microsoftonline.com/<tenant>
6. User authenticates with Microsoft (password + MFA, all on Microsoft)
7. Microsoft → browser → https://pulse.jera.co.za/api/auth/callback/microsoft-entra-id?code=...
8. Auth.js (server, on the box) exchanges the code for an id_token using the
   CLIENT SECRET  (box → login.microsoftonline.com, outbound)
9. signIn callback: resolve Entra identity (email) → employees row via PostgREST
   using the SERVICE token. No employee match → access denied (no auto-provision).
10. jwt callback: relink employees.auth_user_id = Entra oid (first login only),
    persist the employee on the session token.
11. session callback: MINT a short-lived HS256 JWT signed with the SHARED
    PostgREST secret →  { role: "authenticated", sub: <employee.auth_user_id> }
12. Auth.js sets an encrypted session cookie. Browser → /welcome (then the app).
13. Any live data read: app → PostgREST (Bearer <minted user JWT>)
      → PostgREST verifies HS256, SET ROLE authenticated, injects request.jwt.claims
      → Postgres: auth.uid() = sub → employees row → RLS decides what is visible.
```

**The signing secret and the service token never leave the server.** The browser only ever holds the encrypted session cookie (and, when B2 wires direct data calls, the short-lived user JWT). RLS — not the app — is the authorization boundary.

## 2. Auth service & the Supabase libs

| Question | Answer |
|---|---|
| GoTrue running? | **No.** Only `pulse-postgres` + `pulse-postgrest`. |
| Auth = custom SQL? | **No.** Auth is Auth.js (Entra OIDC). `000_prod_auth.sql` only defines `auth.uid()`. |
| `NEXT_PUBLIC_SUPABASE_URL` in prod | **Unset / not used.** It's stale scaffold from `.env.example`. The auth path doesn't touch it; screens are mock today. |
| What do `@supabase/*` libs talk to? | **Nothing on the live path right now.** `frontend/lib/supabase-client.ts` is legacy/dead code in this build. When B2 wires live data, supabase-js gets pointed at the **PostgREST base URL** with the **minted user JWT as the access token** (NOT a Supabase anon key). |

## 3. Entra → a JWT PostgREST accepts

- **Issuer of the PostgREST JWT:** the Next.js app (Auth.js `session` callback), via `frontend/lib/auth/pulse-token.ts` (jose, HS256).
- **Signing secret:** the SAME secret PostgREST verifies with — `PGRST_JWT_SECRET` == contents of `~/pulse-db/.jwt_secret` (set in the app as `PULSE_PG_JWT_SECRET`). Symmetric HS256, not JWKS.
- **Claims:** `role: "authenticated"` (PostgREST `SET ROLE`), `sub: <employees.auth_user_id>` (a UUID — `auth.uid()` casts it), `exp` ~1h.
- **Role mapping:** the JWT does **not** carry the app role. Every user token uses the DB role `authenticated`. The person's real level (employee / manager / admin / owner) lives in `employees.role` + `employees.is_owner` and is enforced by **RLS** keyed on `auth.uid()`. Entra identity → employee row is by **email** at login; thereafter by `auth_user_id` (= Entra `oid`).
- **Service path:** login resolution + the one-time relink use a `service_role` JWT (BYPASSRLS, granted only `SELECT` on `employees` and `UPDATE` on `employees.auth_user_id`). Server-side only.

## 4. Exact Entra app settings (Azure portal)

App registration **`46282e6c-0200-498e-adaf-a9dbb52122b1`**, tenant **`4f124a4c-a71e-463c-a004-f65515cff124`**:

- **Authentication → Platform: Web → Redirect URIs:**
  - `https://pulse.jera.co.za/api/auth/callback/microsoft-entra-id`   ← production
  - `http://localhost:3000/api/auth/callback/microsoft-entra-id`      ← dev / SSH-tunnel testing
- **Supported account types:** **Single tenant** ("Accounts in this organizational directory only"). The issuer pins the tenant.
- **API permissions (delegated, Microsoft Graph):** `openid`, `profile`, `email`, `User.Read`. Grant admin consent.
- **Certificates & secrets:** one client secret (value already stored on the box at `~/pulse-db/.m365_secret`, `0600`). Note its expiry and diarise renewal.
- Front-channel logout / implicit grant: not required (this is the OIDC auth-code flow).

## 5. Exact production env vars (`.env.local` on the box, `0600`, never in git)

```dotenv
# --- Microsoft Entra sign-in (Auth.js naming — NOT AZURE_* / ENTRA_*) ---
AUTH_MICROSOFT_ENTRA_ID_ID=46282e6c-0200-498e-adaf-a9dbb52122b1
AUTH_MICROSOFT_ENTRA_ID_SECRET=<client secret value — from ~/pulse-db/.m365_secret>
AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/4f124a4c-a71e-463c-a004-f65515cff124/v2.0

# --- Auth.js session ---
AUTH_SECRET=<openssl rand -base64 32>          # session-cookie encryption
AUTH_URL=https://pulse.jera.co.za              # production public origin
AUTH_TRUST_HOST=true                            # behind Caddy reverse proxy

# --- Pulse data layer (server-side only) ---
PULSE_POSTGREST_URL=http://127.0.0.1:3001       # internal; Caddy need not expose it
PULSE_PG_JWT_SECRET=<contents of ~/pulse-db/.jwt_secret, whitespace-stripped>
PULSE_SERVICE_JWT=<role=service_role HS256 token; mint with ~/pulse-db/mint_jwt.py service_role>

# --- NOT NEEDED in this self-hosted setup (leave unset) ---
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (Supabase cloud — not used)
# RESEND_API_KEY  (email is Microsoft Graph in a later phase)
```

The only difference between the dev (SSH-tunnel) and prod configs is `AUTH_URL`
(`http://localhost:3000` vs `https://pulse.jera.co.za`) and the matching Entra
redirect URI. Everything else is identical.

## 6. Caddy note

Caddy terminates TLS for `pulse.jera.co.za` and reverse-proxies to
`127.0.0.1:3000`. With `AUTH_URL` set explicitly and `AUTH_TRUST_HOST=true`,
Auth.js builds correct `https://pulse.jera.co.za/...` callback URLs regardless
of the proxy. Ensure Caddy forwards the standard `X-Forwarded-Proto/Host`
headers (its default `reverse_proxy` does).

## 7. Status / scope (honesty)

Production-ready **now**: Entra sign-in, employee resolution + deny, RLS-enforced
data API, the minted-token chain. **Not yet**: the per-screen swap from mock data
to live PostgREST reads (phase B2) — today only `/welcome` reads live data as the
end-to-end proof. "Live login" works; "every screen on live data" is the next step.
