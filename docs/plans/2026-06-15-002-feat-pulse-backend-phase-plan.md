# Pulse — Backend Phase Plan (make it real)

**Date:** 2026-06-15
**Status:** Proposed — for review. Not started.
**Predecessor:** the prototype-alignment phase is complete (see `2026-06-15-001-...`); the full UI runs on mock data on `main`.

## Goal

Turn the finished, mock-data frontend into a real, multi-user application: persistent data, Microsoft 365 sign-in, real email and file storage, a working Ask-HR assistant, and a live deployment. No new screens — this phase makes the existing ones work against real services.

## The architectural advantage we bank on

Every screen reads and writes through **one seam**: `frontend/lib/mock/index.ts`. Screens never talk to a database directly. So the core of this phase is **swapping the bodies of those accessor functions** from in-memory mock data to real Supabase queries — the screens stay untouched. This is the payoff of how the frontend was built and it keeps the backend phase low-risk.

Existing scaffolding to build on (already in the repo, currently dormant): `frontend/lib/supabase-client.ts`, `frontend/lib/supabase-server.ts`, `frontend/hooks/useAuth.ts`, `frontend/app/api/email/route.ts`, `database/pulse_v5_schema.sql`, and the proposed schema at `docs/prototype/SCHEMA.sql`.

## Decisions needed before/early (Ryan + IT — these gate the work)

| # | Decision | Why it matters | Who |
|---|---|---|---|
| Q1 | **Hosting target** — the shared Hetzner box (behind Caddy, like the other Jera apps), Vercel, or Azure? | Determines deploy/CI setup and DNS for pulse.jera.co.za. | Ryan/IT |
| Q2 | **Supabase**: hosted Supabase cloud vs self-hosted on the Hetzner box. | Cloud is faster to stand up; self-host keeps data on infra you control. | Ryan/IT |
| Q3 | **Microsoft 365 app registration** — who creates the Entra ID (Azure AD) app registration + grants Graph permissions (Mail.Send, Files/Sites.ReadWrite, User.Read, openid/profile)? | Required for SSO, email, and SharePoint. Needs a tenant admin. | IT / M365 admin |
| Q4 | **Role mapping** — how does an M365 user become Employee/Manager/Admin? (Entra group membership? a column in the `employees` table maintained by HR?) | Drives auth + RLS. | Ryan |
| Q5 | **SharePoint location** — which site/library holds certificates, AA certs, documents, policy files? | Storage target for all uploads. | Ryan/IT |
| Q6 | **Ask-HR model** — which provider/model and budget for the assistant? | Sizing the LLM integration. | Ryan |

These are flagged because several require an **M365/Entra tenant admin** or account creation — work Claude cannot do; Ryan or IT must perform them and hand over the resulting IDs/secrets.

## Workstreams (sequenced)

### B0 — Supabase foundation + types (prerequisite)
- Stand up the Supabase project (per Q2). Apply the schema (reconcile `database/pulse_v5_schema.sql` with the modules added this year — certifications, training_paths/modules/progress, aa_rate_certificates, the 24 policies + version/effective, expense advances/AA fields, documents).
- Regenerate `frontend/types/database.ts` from the live schema (`npx supabase gen types`). **This resolves the known `app/api/email/route.ts` type error** that currently blocks `next build`.
- Seed reference data (the 24 policies, SOPs, onboarding task template, products) so the app isn't empty on day one.
- **Ryan action:** create the Supabase project + provide the project URL + keys as repo/host secrets.

### B1 — Microsoft 365 SSO (real auth)
- Replace the dev "View as" RoleSwitch + mock `useSession` with real M365 sign-in (NextAuth/Auth.js Entra provider or Supabase Auth Azure provider).
- Resolve the signed-in user → an `employees` row → their role (per Q4). Keep `useSession()`'s shape so screens don't change.
- **Ryan/IT action:** the Entra app registration (Q3) + redirect URIs + secrets.

### B2 — Swap the mock seam to Supabase (the bulk, low-risk)
- Replace each accessor body in `frontend/lib/mock/index.ts` (and the per-entity files) with Supabase queries/mutations: employees, onboarding tasks/phases/status, policies + acknowledgements, training, certifications, expenses (+ AA certs + advances), documents, directory. Screens unchanged.
- Do it module-by-module so each can be verified independently. Keep the mock layer available behind a flag for local dev without Supabase.

### B3 — Row-Level Security enforcing the capability matrix (security-critical)
- Translate `frontend/lib/capabilities.ts` into Supabase RLS so the rules are enforced server-side, not just in the UI:
  - Manager sees only their team; **never** payroll/POPIA/personal data or the contract task.
  - Employees see only their own forms, expenses, certificates; can upload their own certs only.
  - Admin-only: cert upload-for-others, policy publish, document upload/delete, Notify All, task-owner assignment.
- This is the highest-risk item — the UI already assumes these boundaries; RLS must mirror them exactly. Test with each role.

### B4 — Email via Microsoft 365 Graph
- Replace `frontend/lib/resend.ts` / `app/api/email/route.ts` with a Graph `sendMail` helper. Wire the real triggers: task-assignment emails, Notify All sends, and certification-expiry reminders (a scheduled job).
- **Ryan/IT action:** Graph Mail.Send permission + a sender mailbox.

### B5 — File storage via SharePoint / OneDrive
- Replace the stubbed uploads (certificate PDFs, expense receipt slips, AA rate certificate, company documents, policy source files) with real uploads to SharePoint (per Q5); store the SharePoint item reference against each record. Wire downloads (incl. the certifications "tender pack" download).

### B6 — Word → HTML policy conversion
- On policy upload, convert the `.docx` body to sanitised HTML for the in-app reader; keep the original for PDF download. (The 24 source `.docx` files are already in `docs/prototype/source-policies/`.)

### B7 — Ask-HR assistant (real model)
- Replace the stubbed `frontend/lib/askHr.ts` answers with a real model endpoint (per Q6) grounded on the 24-policy corpus + payroll/leave/expense rules (retrieval over the policy text). Keep the existing assistant UI. Guardrails: never invent figures; defer binding questions to HR.

### B8 — Deployment
- Stand up hosting (per Q1): build pipeline, env/secrets, DNS for **pulse.jera.co.za**, the existing Claude review GitHub Action already gates PRs. Add a backend smoke-test checklist.

## Suggested order
B0 → B1 → (B2 + B3 together, module by module) → B4, B5, B6 in parallel → B7 → B8. B2/B3 are the heart; B4–B7 are independent integrations once data + auth exist.

## Review standard
The repo's `CLAUDE.md` "Mandatory Specialist Review" backend dimensions (architecture, data integrity, API contracts, operations) **activate automatically** once backend code appears — they were dormant during the frontend phase. Expect security + data-integrity review on every B2/B3/B4/B5 PR.

## What stays the same
All screens, components, design tokens, and the role/capability model. If the seam swap is done well, users won't see the frontend change — it will just start remembering things, emailing, and logging people in for real.
