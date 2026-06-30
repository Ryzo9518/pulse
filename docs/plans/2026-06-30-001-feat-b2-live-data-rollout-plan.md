# B2 — live-data rollout plan (mock seam → PostgREST)

**Date:** 2026-06-30
**Status:** IN PROGRESS — pattern established + People migrated (proof slice).

## The pattern (established this slice)

1. **Authenticated proxy** `app/api/rest/[...path]/route.ts` — reads the Auth.js
   session server-side, injects the signed-in user's freshly-minted PostgREST
   token, forwards to the internal data API. PostgREST stays on `127.0.0.1`
   (no public exposure, no Caddy/root change); the token never reaches the
   browser. **RLS is the boundary** — the proxy is a thin authenticated
   passthrough. GET only for now; single table/view name per request
   (`parseTable` rejects `/rpc/*`, nested paths, traversal — unit-tested).
2. **Per-domain hook** (e.g. `lib/data/useDirectory.ts`) — behind
   `NEXT_PUBLIC_PULSE_DATA=live`, fetches from the proxy with `{loading, error}`;
   otherwise returns the mock synchronously. So nothing changes until the flag
   flips, and screens migrate one at a time.
3. **Screen** renders loading / error / empty / data. People is the reference.

> `NEXT_PUBLIC_*` is build-time — flipping the flag needs a rebuild on the box.

## Migration order (read-only first, then writes)

Each screen: add a hook (or extend one), wire loading/error, verify live under a
real login, then tick off. Writes (mutations) come after reads, per feature,
each with its own validated proxy method (POST/PATCH/DELETE) — not enabled yet.

- [x] **People** — `listEmployees` → `/api/rest/employees` (proof slice)
- [ ] **Dashboard** — employees + onboarding + policy/expense summaries (read)
- [ ] **Policies** — `listPolicies` + ack state (read); ack write later
- [ ] **People/Org** secondary reads (team, products)
- [ ] **Onboarding/Workflow** — phases/tasks/status (read); status write later
- [ ] **Training** — products/paths/enrolments (read)
- [ ] **Certifications** — list (read); upload write later
- [ ] **Expenses** — claims/lines (read); submit/approve write later
- [ ] **Documents** — list (read); add/delete write later
- [ ] **Admin** (notify, onboard, employees) — reads; writes later
- [ ] Identity: replace mock `useSession()` with the real Auth.js session
      (`next-auth/react` or server-passed props) screen-by-screen.

## Verification

- Proxy: returns 401 unauthenticated; with a session, rows are RLS-scoped
  (admin sees all; manager/employee see less) — proven by the `/welcome` probe
  and re-checked per screen.
- Each screen verified under a real Microsoft login before marking done.

## Notes / risks

- Full end-to-end verification of any live screen needs a working login, which
  depends on the Entra redirect URI being registered.
- Mutations must rely on RLS to reject (never pre-filter in the client as the
  control), and must re-honor the ratified statecharts (ack gate, expense,
  onboarding_task_status).
