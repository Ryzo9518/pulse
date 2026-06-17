# Pulse — Backend Phase Plan (make it real)

**Date:** 2026-06-15
**Status:** Proposed — **governance-reviewed by all 11 specialist dimensions** (findings + resolutions in §Governance review). Not started.
**Predecessor:** the prototype-alignment phase is complete (`2026-06-15-001-...`); the full UI runs on mock data on `main`.

## Goal

Turn the finished, mock-data frontend into a real, multi-user application, **self-hosted on Jera infrastructure**: persistent data, Microsoft 365 sign-in, real email and file storage, an on-prem Ask-HR assistant, and a live deployment at pulse.jera.co.za — with POPIA-grade controls on payroll/banking/medical/ID data.

## Honest framing of the central bet (revised after review)

Every screen reads/writes through **one seam**: `frontend/lib/mock/index.ts`. Swapping those accessor bodies to real queries keeps the screens' *markup* stable. **But the review corrected an over-claim in the first draft:** the mock accessors are **synchronous and never fail**; real queries are **async and can fail**. So the data-access *call sites* in all ~15 screens **will change** (loading states, error states, `await`), and the ~219 existing unit tests must be migrated. "Screens untouched" is true for JSX, **false for data access** — this is now an explicit workstream (B2a), not a hidden cost.

Existing scaffolding (dormant): `frontend/lib/supabase-client.ts`, `frontend/lib/supabase-server.ts`, `frontend/hooks/useAuth.ts`, `frontend/app/api/email/route.ts`, `database/pulse_v5_schema.sql`, `docs/prototype/SCHEMA.sql`.

## Decisions — RESOLVED (Ryan, 2026-06-15) + review adjustments

| # | Decision | Resolution |
|---|---|---|
| Q1 | Hosting | **Self-hosted on `jeraaiboss` — 154.70.249.26** (SSH `ssh jeraaiboss` port 33556, Cockpit :9090, CentOS Stream 10). Live at pulse.jera.co.za behind a reverse proxy. |
| Q2 | Database | **Dedicated Postgres instance for Pulse on `jeraaiboss`** (Ryan, confirmed 2026-06-15). The Intacct toolkit stays on its own Hetzner box (159.69.216.113) — no shared cluster, no cross-server DB link. Clean isolation, contained POPIA blast radius, independent backups. |
| Q3 | Microsoft 365 | Ryan creates the Entra app registration from §Microsoft 365 setup and hands over IDs/secret. **Authentication only.** |
| Q4 | Role mapping | **Roles managed inside Pulse** (`employees.role`, admin-edited). M365 = authN only; Pulse = authZ. Source of truth for the permission matrix is `docs/prototype/HANDOFF.md` §2; `capabilities.ts` and RLS must both agree with it. **Confirmed (Ryan):** he will provide the organogram; Claude seeds the `employees.manager_id` hierarchy + initial Employee/Manager/Admin roles from it. |
| Q5 | File storage | **SharePoint** — site `jeracoza.sharepoint.com/sites/jera.co.za`, library `Shared Documents`, folder `20_Finance/HR`. Store a **stable Graph driveItem id** (not just a URL). |
| Q6 | Ask-HR model | **Self-hosted LLM on the deployment box** (on-prem; POPIA win). ⚠️ Review flags resource contention (see §Performance) — isolate or offload the LLM so it can't starve Postgres. |

## §Database — answering "shouldn't all products share one Postgres?"

**Supabase *is* Postgres** (Postgres + GoTrue auth + PostgREST API + Storage + RLS tooling) — it isn't Supabase *vs* Postgres.

**The host conflict — RESOLVED (Ryan, 2026-06-15):** the Intacct toolkit's Postgres stays on **Hetzner (159.69.216.113)**; Pulse gets its **own dedicated Postgres instance on `jeraaiboss` (154.70.249.26)**. No shared cluster, no cross-server DB link. (This was the review's recommended option: simplest, cleanest isolation, contained POPIA blast radius, independent backups.) Any future cross-product data sharing goes through a defined interface, never a shared DB.

**Recommendation (architecture review): a DEDICATED Postgres instance for Pulse on `jeraaiboss`** — not a shared cluster — because self-hosted Supabase installs **cluster-global roles** (`anon`, `authenticated`, `service_role`, `supabase_admin`) and expects to own `pg_hba`, several schemas, and extensions; bolting it onto a cluster another production system relies on is high-risk for marginal backup-consolidation benefit. You still get "one box, one backup regime." If true co-tenancy is ever required, prove no role/extension collision against a copy first, and isolate DB login roles per product (revoke `PUBLIC` grants; each product's role can touch only its own DB).
**Cross-product data sharing** (e.g. one employee list) goes through a defined interface (view/API/sync), never shared tables. **Bonus:** the same Postgres hosts `pgvector` for on-prem Ask-HR retrieval.

## §Identity & access architecture (NEW — resolve before B1; HIGH from architecture + dependencies review)

The plan's auth choice must reconcile with the existing GoTrue scaffolding, or RLS cannot work (`auth.uid()` would be null). Three options; **pick one in B0.5:**

1. **Supabase GoTrue with its native Azure/Entra provider** *(recommended)* — keeps `auth.uid()`-based RLS and the existing `supabase-*` clients intact, removes the need for a separate auth library, and still satisfies Q4 (role read from `employees.role`, not from the M365 token). Smallest dependency surface.
2. **Auth.js (next-auth v5) owning sessions, minting a Supabase-compatible JWT** (signed with the Supabase JWT secret, `sub` = employee id, role claim from `employees.role`) so RLS still works. More control, more moving parts.
3. **Auth.js + a server-only data layer** where authorization is enforced in code (RLS as defense-in-depth). Most work.

Whatever is chosen: **rewrite `useAuth` and the client wiring** (B1 does NOT "preserve" them — only the screen-facing `useSession()` *shape* is preserved); resolve the M365 identity → `employees` row → role **server-side per request** (so a role change or offboarding takes effect on the next request); **fail closed** when no `employees` row matches (deny + "contact HR", never default to a role); secure session cookies (HttpOnly/Secure/SameSite); manage the auth secret.

## §Schema reconciliation (NEW workstream B0a — HIGH from data-integrity + architecture + docs review)

There are **three conflicting schema artifacts** and "apply the schema" hides the largest data risk in the phase:
- `database/pulse_v5_schema.sql` — has RLS/triggers/indexes/seeds **but is stale**: 2-role enum (no `manager`), 20 policies, `expense_status` `declined` (now `returned`), no certifications/training/aa_rate tables, flat acks (no version model).
- `docs/prototype/SCHEMA.sql` — has the **new** tables + 3-role enum + manager-safe view sketch **but no RLS/precision/audit**.
- `frontend/types/database.ts` — the **de-facto contract the screens compile against**; matches *neither* SQL file.

**Resolution:** B0a produces **one canonical migration**, using `types/database.ts` as the contract and `docs/prototype/SCHEMA.sql` (3-role, versioned) as the structural base; **archive `pulse_v5_schema.sql`**. Then regenerate `database.ts` from the live DB and confirm round-trip parity (`tsc --noEmit` clean). Mandate within it: `NUMERIC(12,2)` money / `NUMERIC(6,2)` rates (no floats); derived totals (`grand_total`, `policies_completed`) as generated columns or trigger-maintained, never client-set; `CHECK` constraints (non-negative amounts/km, `rate_basis='full_aa' ⇒ invoiced`); **append-only acknowledgement history** so a policy republish never erases prior-version ack evidence (reconciles decision D1 with audit defensibility); FK `ON DELETE RESTRICT`/soft-delete for financial + audit records (termination is a status change, never a row delete); idempotent, transactional, ordered migration with `ON CONFLICT DO NOTHING` seeds.

## §Data protection — POPIA (NEW — HIGH from security + data-integrity review)

Database separation is perimeter, not data protection. Add: a **data-classification map** (Ordinary / Personal / Special-Personal: banking, ID, medical); **full-disk encryption at rest** on `jeraaiboss`; **column-level encryption** (`pgcrypto`, key in the secret store, not the DB) for `id_number`, bank account, medical fields so a dump or service_role read doesn't trivially expose them; **data minimisation** (store the least needed); a documented **retention + right-to-erasure** procedure for terminated staff; and an **append-only audit log of sensitive reads/writes** (who viewed/changed payroll/banking/medical, plus role changes, policy publish, document delete, Notify All) — written in the same transaction as the action.

## §Security model (NEW — HIGH from security + testing review)

- **Owner / super-admin (Ryan).** The role model gains an **Owner** designation above Admin for the system owner (Ryan de Kock): unrestricted access to everything (functionally identical to Admin's full access, but explicitly un-scopeable), AND the protected top authority — **only an Owner can grant/revoke Admin or Owner**, and an Owner **cannot be demoted, disabled, or locked out by any other user**. Enforce in both the role-management UI and RLS (an `is_owner` flag on the employee record; deletions/role-changes targeting an owner are rejected unless performed by an owner). This guarantees Ryan can never be locked out of his own product.
- **RLS is the authorization boundary; default-deny.** A CI test enumerates every table holding payroll/POPIA/contract data and **fails the build** if RLS isn't enabled. For each of the 12 capabilities, a **positive test (authorized role passes) AND a negative test (every other role is denied at the DB layer)** — driven from the capability matrix so a new capability forces a new test. These are a **required merge gate** for B3. Manager-denied data (payroll/POPIA/contract) gets explicit zero-rows tests.
- **`service_role` containment:** the bypass-RLS key lives only in server-only modules (`import 'server-only'`, never `NEXT_PUBLIC_*`, never in a `'use client'` import); used only for a documented allow-list (scheduled jobs, system writes), each re-checking the caller's identity/role in code. A CI grep fails if the key or `service_role` appears in any client bundle.
- **Server-side validation + business rules** live in a server layer (Route Handlers / Server Actions / RPC), not only in the client seam — once the browser can write, RLS handles *row access* but not *invariants*. Derived values (expense totals, the compliance gate) are computed server-side/in triggers.
- **Secret management:** inventory (name, holder, location, expiry) for the M365 client secret, DB creds, Supabase `anon`+`service_role`+JWT secret, LLM creds. Stored as root-owned `600` env via systemd `LoadCredential`/`EnvironmentFile`; never in git; rotation runbook + calendar (the **M365 client-secret expiry is the most likely silent outage** — monitor it). Prefer a certificate credential over a secret if feasible.
- **`Mail.Send` (app-only) is tenant-wide** → constrain with an Exchange **Application Access Policy** scoped to one shared mailbox. **`Sites.Selected` is mandatory** for SharePoint (scope to the `jera.co.za` site); `Sites.ReadWrite.All` is **not** an acceptable production fallback.
- The legacy **`/api/email` route is unauthenticated/unvalidated** — it must be removed/disabled (not merely left dormant) before any deploy, until B4's authenticated, role-checked, input-validated, sender-constrained Graph replacement ships.
- **Word→HTML (B6)** is a stored-XSS vector: sanitise with a strict server-side allow-list (no `<script>`/handlers/`javascript:`), serve under a restrictive CSP; add a malicious-`.docx` test. Plus a security-header baseline (HSTS/CSP/X-Content-Type-Options/frame-ancestors) and CSRF protection on state-changing routes.

## §Performance budget (NEW — HIGH from performance review)

- **Resource budget on the single box** (B8 gate): reserved cores/RAM per process (Postgres, LLM, Supabase, Next.js). **Isolate the LLM** under cgroup/systemd `MemoryMax`/`CPUQuota`, or offload it to its own host, + a concurrency cap/queue — it must never OOM Postgres. A load test must show Ask-HR generations don't regress DB p95.
- **No per-row queries:** B2's acceptance criterion is "a screen's data is satisfied by a bounded number of queries independent of row count." Resolve names via JOIN/batched `ANY($1)` (denormalise `display_name`/avatar onto row DTOs — a deliberate, allowed seam-shape change); compute `getBillableSummary`/`getOnboardingSummary`/roster stats as set-based SQL, not JS row-mapping.
- **Pagination** (keyset) required on every list (directory, certs, documents, training); move People search server-side (`pg_trgm`).
- **Indexing** deliverable in B0a: every FK/scoping column (`manager_id`, `employee_id`, `claim_id`, etc.) + partial indexes for hot predicates; index columns RLS predicates reference; keep RLS helpers `STABLE` and sargable; `EXPLAIN ANALYZE` evidence (no seq-scans on hot paths) as a B2 gate.
- **PgBouncer** (transaction pooling) in front of Postgres; connection budget per service.
- Ask-HR: **HNSW** pgvector index, capped `top_k`, **async embedding** on policy publish. SharePoint/email: stream (don't buffer) large files, resumable upload sessions >4MB, 429 backoff, run via the job runner — never block an interactive request. Target: p95 ≤ 200ms per screen.

## §Testing strategy (NEW — HIGH from testing review)

- **RLS tests against an ephemeral Postgres**, per role, positive + negative, driven from the capability matrix — required merge gate for B3.
- **CI must actually run tests** (today `claude-review.yml` is an LLM gate only, runs no vitest). Add a vitest job + a Postgres service container for the integration/RLS tier; fast mock-tier unit tests gate every PR, DB-backed tier gates B2/B3+.
- **Seam contract tests** run against BOTH the mock and the real implementation (parameterised) so they can't drift; port the ~219 sync tests to async rather than delete them; keep the mock layer behind a build-time dev-only flag (never engages in prod).
- **Migration test** (applies clean from scratch; seed = 24 policies/HR001–HR024/products; generated types compile). **Auth-mapping test** (object-id→role; fail-closed on no row; role change/offboard). **Graph + Ask-HR** tests with mocked endpoints incl. sad paths (401 expired secret, 429, >4MB, send-failure-doesn't-mark-sent); assistant tests assert **grounding + deferral**, not exact prose.

## Microsoft 365 setup — what to create (Ryan / M365 admin)

In **Azure Portal → Microsoft Entra ID → App registrations → New registration**:
1. **Name:** `Pulse HR Portal`  2. **Account types:** *Single tenant* (Jera only).
3. **Redirect URIs (Web):** `https://pulse.jera.co.za/api/auth/callback/azure-ad` and `http://localhost:3000/api/auth/callback/azure-ad` (dev). *(Exact path confirmed once §Identity option is chosen — confirm before you register it.)*
4. **Directory (tenant) ID** + **Application (client) ID** — ✅ provided by Ryan 2026-06-17 (Tenant `4f124a4c-…`, Client `46282e6c-…`; these are config, not secrets, fine to store in the plan/server config).
5. **Client secret** — see **Client secret — create + secure handoff** below (timing matters: create it at **B0**, not now).
6. **API permissions → Microsoft Graph** — ✅ added in Entra 2026-06-17:
   - *Delegated* (sign-in): `openid`, `profile`, `email`, `User.Read`.
   - *Application* (server-side): `Mail.Send` (then constrain via Exchange Application Access Policy to one mailbox), `Sites.Selected` (then grant the app write to just the `jera.co.za` site). **Grant admin consent.**

### Client secret — create + secure handoff (B0/B1)
The client secret is the credential the Pulse server uses to act *as the app* against M365 (the SSO token exchange + app-only Graph for `Mail.Send` and `Sites.Selected`). Whoever holds it can act as Pulse against the tenant — treat it as a master key.

**Create (Azure portal — Ryan):** App registration **Pulse HR Portal** → **Certificates & secrets** → **Client secrets** → **+ New client secret** → Description `Pulse server (jeraaiboss)`, **Expires: 24 months** → **Add** → **copy the *Value* immediately** (shown once; copy the *Value*, not the *Secret ID*) → record the expiry date.

**Timing — create it AT B0, not before.** The 24-month clock starts at creation; making it before the server exists just burns expiry on an unused key. Create it during server stand-up (B0). If it must exist earlier, paste the Value into a password manager (1Password / Bitwarden / the M365 admin vault) — **never** chat, email, Teams, or git.

**Handoff destination (B0/B1):** the Value goes ONLY into the server's secret store on `jeraaiboss` as an env var (e.g. `AZURE_AD_CLIENT_SECRET`) in a root-owned `600` file via systemd `EnvironmentFile` / `LoadCredential` — never committed to git, never echoed to logs (see §Security → Secret management). Prefer a **certificate credential** over a secret if the team is comfortable (more secure, more setup); a secret is acceptable to start.

**Rotation:** set a calendar reminder ~1 month before the expiry date. An expired secret silently breaks **all** SSO + email + SharePoint at once — §Security flags this as the top outage risk, and the B8 monitor set watches secret-expiry.

## Workstreams (sequenced)

- **B0 — Server & DB foundation:** Postgres on `jeraaiboss` (dedicated instance per §Database), self-hosted Supabase pointed at it, `pgvector`; firewall (only 80/443 public; 5432/Supabase/LLM/Cockpit private/VPN-only); secrets scheme.
- **B0a — Canonical schema + types** (see §Schema reconciliation). Resolves the `route.ts` build error via regenerated types.
- **B0.5 — Identity & access decision + operational baseline** (see §Identity, §Security): pick the auth option; land **CLAUDE.md phase update** (frontend→backend, M365 not Resend, activate the dormant review dimensions) BEFORE other backend PRs; encrypted off-box backups + tested restore + TLS in place before real data flows.
- **B1 — M365 SSO** (auth only; rewrite `useAuth`/clients; server-side role resolution; fail-closed; full auth-flow UX — sign-in/expiry/no-row/unauthorised; retire mock `forgot`/`twofactor` routes).
- **B2 — Swap the seam to real queries**, module-by-module, one PR per module, bounded query counts. **B2a — async data-access contract + loading/error UI** (skeletons, `error.tsx`, distinguish empty vs forbidden, pessimistic mutations for the policy gate + expense submit).
- **B3 — RLS** enforcing the capability matrix (default-deny, service_role containment, adversarial per-role test gate; source of truth = HANDOFF §2).
- **B4 — Email via Graph** (`sendMail`; constrained sender; remove `resend` + retire `RESEND_API_KEY`; rename `email_log.resend_id`→`provider_message_id`; idempotent sends; job-runner + backoff).
- **B5 — SharePoint storage** (store driveItem id; streamed/resumable uploads; reconciliation/orphan job; upload/download UX — progress, size/type limits, retry).
- **B6 — Word→HTML** (sanitised; async; embeddings reindex async).
- **B7 — Ask-HR on-prem LLM** (retrieval scoped to non-personal policy corpus only; treat retrieved/user text as untrusted; latency/streaming/timeout/error UX; reuse HR-deferral copy on errors).
- **B8 — Operations & hardening:** stated RTO/RPO + accepted-SPOF sign-off + realistic uptime; quarterly tested restore; per-service memory limits; monitor set (host/disk/RAM/Postgres/Supabase/app/TLS-expiry/**M365-secret-expiry**) + Teams alert channel + **dead-man's-switch on the scheduled cert-expiry job**; one-command deploy + rollback; `logrotate` + POPIA-safe logs; OS patch cadence + SSH/Cockpit hardening; reconcile the committed `config/nginx.conf`+`pm2.config.js` (pick one stack); named-owner rebuild runbook.

**Suggested order:** B0 → B0a → B0.5 → B1 → (B2+B2a+B3, module by module) → B4, B5, B6 → B7 → B8 (ops baseline items from B0.5 land before real data).

## How we ship (CLAUDE.md conformance)
One feature branch per bounded change/module; draft PR opened early; the applicable specialist dimensions (below) reviewed and HIGH/MED findings fixed/refuted/deferred-with-reference; the Claude review Action green before asking Ryan to merge. CLAUDE.md must be updated in B0.5 (phase, M365, activated dimensions, deploy/secrets/server conventions) so backend PRs don't trip the standards dimension.

## Governance / review standard (all 11 active this phase)

| # | Dimension | Specialist (subagent_type) |
|---|---|---|
| 1 | Security | `compound-engineering:review:ce-security-sentinel` |
| 2 | Backend architecture | `compound-engineering:review:ce-architecture-strategist` |
| 3 | Frontend / UX | `general-purpose` |
| 4 | Data integrity | `compound-engineering:review:ce-data-integrity-guardian` |
| 5 | API contracts | `compound-engineering:review:ce-api-contract-reviewer` |
| 6 | Performance | `compound-engineering:review:ce-performance-oracle` |
| 7 | Testing | `compound-engineering:review:ce-testing-reviewer` |
| 8 | Documentation accuracy | `general-purpose` |
| 9 | Project-standards / CLAUDE.md drift | `compound-engineering:review:ce-project-standards-reviewer` |
| 10 | Dependencies | `general-purpose` |
| 11 | Operations | `general-purpose` |

Dependencies to pin (avoid parallel-workstream drift): resolve §Identity, then either Supabase native Entra (no new auth lib) or `next-auth@^5`; `@azure/identity` + raw Graph `fetch` (only 2 Graph ops) or `@microsoft/microsoft-graph-client`; the `openai` SDK pointed at the on-prem base URL for both embeddings + chat; `pgvector` extension. All candidates are MIT/Apache/PostgreSQL-licensed (no copyleft). Server-only deps + secrets never reach the client bundle.

## §Governance review (2026-06-15) — findings register

A full eleven-dimension review was run against this plan. Highlights and resolutions (all folded into the sections above):

| # | Dimension | Top findings | Resolution |
|---|---|---|---|
| 1 | Security | service_role bypass; no default-deny/negative-test gate; POPIA columns unencrypted; tenant-wide `Mail.Send`/`Sites.ReadWrite.All`; unauth `/api/email` live pre-B4; secret rotation; LLM prompt-injection/retrieval scoping; unencrypted backups; Word→HTML XSS; headers/CSRF | §Security, §Data protection, §Performance(B7), B4/B6/B8 |
| 2 | Architecture | auth model contradicts GoTrue scaffolding (`auth.uid()` null); no home for write-path validation; browser-as-DB-client risk; 3 conflicting schemas; prefer dedicated PG instance; idempotent stateful scheduled job; cross-product sharing via interface | §Identity, §Schema, §Database, §Security, B8 |
| 3 | Frontend/UX | "screens untouched" false; missing loading/error/empty states; auth-flow UX; role-change propagation; real upload + assistant latency UX; pessimistic mutations | B2a, B1, §Honest framing |
| 4 | Data integrity | 3 schemas conflict; version/ack-reset audit model; money precision/generated totals; POPIA encryption/retention/erasure; cascade-delete destroys financial records; SharePoint↔DB reconciliation; idempotent migration | §Schema, §Data protection, B5/B8 |
| 5 | API contracts | sync→async signature break; undefined error shape (empty vs forbidden); route envelope; Graph contract (no message id, 4MB sessions, 429); idempotency; type-regen clobbering hand types | B2a, §Schema, B4/B5, §Security |
| 6 | Performance | single-box LLM contention; N+1 from naive swap; no pagination/indexing; RLS cost; pgvector index; streamed Graph; PgBouncer; no perf budget | §Performance |
| 7 | Testing | no test strategy; RLS needs real-PG per-role tests as gate; sync→async breaks 219 tests; CI runs no tests/no DB; auth-mapping/migration/Graph/Ask-HR tests; contract tests | §Testing strategy |
| 8 | Docs accuracy | plan substantially accurate; v5 schema stale (manager/returned); SCHEMA.sql is the newer authority; route-error cause is type-shape not stale content | §Schema; verified |
| 9 | Standards/CLAUDE.md | phase still says "frontend-first/no Supabase/Resend"; dormant dimensions never trip (no `backend/`); deploy/secrets/server undocumented; plan's agent names were unqualified; HANDOFF §2 is matrix source of truth | B0.5 CLAUDE.md update; qualified agent names above; §Security |
| 10 | Dependencies | unresolved auth-lib/RLS interaction; nothing pinned; server-only/no-`NEXT_PUBLIC_` rule; Graph SDK vs fetch; remove `resend`; licenses clean | §Identity, "Dependencies to pin", §Security |
| 11 | Operations | B8 was a stub; SPOF/RTO/RPO; backup *restore* untested; secret rotation (M365 expiry); firewall (don't expose 5432/Supabase/LLM/Cockpit); job heartbeat; deploy/rollback; logrotate; LLM sizing/GPU; reconcile committed config | B8, §Security, §Performance |

## What stays the same
Screen markup, components, design tokens, and the role/capability model. Reads go async and writes become fallible (B2a handles the UX), but visually the app is unchanged — it starts remembering, emailing, storing files, and logging people in for real, on Jera's own infrastructure.
