# CLAUDE.md

Context and working agreement for Claude when working in the **PULSE** repository — Jera Consulting's internal HR & onboarding portal.

## What PULSE Is

An internal HR & People Operations portal for Jera staff: role-based onboarding workflows, a 24-policy mandatory-acknowledgement gate, SOP walkthroughs, onboarding forms, product training paths + certification tracking, expense claims with an approver flow, a staff directory, a company document library, announcements, and an admin portal.

**Roles (three):** Employee, Manager, Admin. Managers get *work-related* team oversight only — never payroll, never POPIA/personal data, never the employment contract. A manager can start an onboarding and track its work tasks, but the HR-admin phase (tax, banking, payroll, medical) and the contract/NDA task are hidden from them. Enforce in RLS, not just the UI. See `docs/prototype/HANDOFF.md` §2 for the full permission matrix.

**Stack:** Next.js 14 (App Router) + Supabase (Postgres + RLS) + Microsoft 365 + Tailwind CSS.

- **Email / notifications:** Microsoft 365 / Outlook via the Graph API. (Earlier docs named Resend; email is now Microsoft 365. The repo's `frontend/lib/resend.ts` is legacy and will be replaced by a Graph helper in the backend phase.)
- **File storage:** SharePoint / OneDrive (Microsoft 365) — certificate PDFs, AA rate certificates, company documents, and policy source files.
- **Auth:** Microsoft 365 SSO, mapped to the three roles, driving Supabase RLS.

**Source of truth for UI:** `docs/prototype/Pulse.dc.html` (current interactive prototype) + `docs/prototype/HANDOFF.md` (implementation brief) + `docs/DESIGN_SYSTEM.md`. This supersedes the older `docs/pulse_v4_prototype.html`.

## Current Phase: Frontend First

We are building the **frontend before the backend**. Until further notice:

- **Build every screen against mock/in-memory data**, not Supabase. The goal is to click through the entire app — login, dashboard, onboarding, policies, expenses, admin — with no Supabase project, no Resend account, and no env vars required.
- Mock data lives in `frontend/lib/mock/`. Keep it realistic (real Jera-style names, the 20 policies, the 4 SOPs, sample employees).
- The existing `frontend/lib/supabase-*.ts`, `frontend/hooks/useAuth.ts`, and `frontend/app/api/email/route.ts` are the *eventual* backend wiring. Leave them in place but do not require them to run the app. When a screen needs data, read from the mock layer.
- **Visual source of truth:** `docs/prototype/Pulse.dc.html` (current interactive prototype, supersedes `docs/pulse_v4_prototype.html`) + `docs/DESIGN_SYSTEM.md` (colours, typography, components). Match them.
- Defer Supabase schema work, auth, email, and deployment to a later "backend" phase.

## Working Agreement

- **Never push to `main`.** All changes go through pull requests. (Exception: the very first scaffold commit that creates the repo.)
- **One feature branch per screen or bounded change.** Small, reviewable PRs beat one giant PR.
- **Open the PR as a draft early** so the Claude code-review GitHub Action runs while the work evolves. Push subsequent commits to the same branch; the action re-runs.
- **Wait for the review action's verdict** before asking the user to merge. If it flags real issues, address them in the same PR.
- **Ryan is the Ops Director, not a developer.** Explain changes in plain language. Flag any step that needs him to do something technical (create a secret, click a button in GitHub/Supabase) clearly and with the exact command or click path.

## Mandatory Specialist Review Before Merge

Every PR is reviewed against the relevant dimensions below before it is marked ready-to-merge. This is the team's review standard (ported from the intacct-toolkit codebase audit, where a multi-agent dimension pass surfaced cross-cutting HIGH-severity findings that single-pass, per-task review had missed — e.g. "any authenticated user can read every client's data," which only showed up when looking at the whole auth → routers chain, not any single file). Per-task review catches most issues but is scoped to one task at a time; the dimension pass closes the gap on issues that only appear across files, and it is cheap relative to the cost of shipping a HIGH-severity bug.

**PULSE is in its frontend-first phase.** Only the frontend-relevant dimensions fire today. The backend / data / API / operations dimensions stay dormant until the backend phase creates `backend/` (or equivalent) — they are listed here so the standard is documented once and activates automatically when those paths appear. PULSE has no inherited deferred findings; it never ran the intacct-toolkit audit, that audit is only the origin of this policy.

### Active now (frontend phase)

| # | Dimension | Specialist agent | When to invoke |
|---|-----------|------------------|----------------|
| 1 | Security | `compound-engineering:review:ce-security-sentinel` | Always |
| 7 | Testing | `compound-engineering:review:ce-testing-reviewer` | Always |
| 9 | Project-standards drift | `compound-engineering:review:ce-project-standards-reviewer` | Always — catches drift from this CLAUDE.md |
| 3 | Frontend / UX | `general-purpose` with a detailed prompt | When `frontend/` is touched (i.e. nearly every PR this phase) |
| 8 | Documentation accuracy | `general-purpose` | When `docs/` is touched, or a feature ships that supersedes an existing doc |
| 10 | Dependencies | `general-purpose` | When `frontend/package.json` or its lockfile is touched |
| 6 | Performance | `compound-engineering:review:ce-performance-oracle` | When hot paths, loops, or expensive client rendering are touched |

### Dormant until the backend phase

| # | Dimension | Specialist agent | Trigger (once a backend exists) |
|---|-----------|------------------|---------------------------------|
| 2 | Backend architecture | `compound-engineering:review:ce-architecture-strategist` | When the backend service code is touched |
| 4 | Data integrity | `compound-engineering:review:ce-data-integrity-guardian` | When DB models or migrations are touched |
| 5 | API contracts | `compound-engineering:review:ce-api-contract-reviewer` | When API routes or any response shape is touched |
| 11 | Operations | `general-purpose` | When deploy notes, systemd units, nginx/Caddy config, or env handling is touched |

Always-tier dimensions (Security, Testing, Project-standards drift) run on every PR regardless of what the diff touches. Conditional dimensions run when the diff trips their trigger. A typical frontend screen PR lands at ~3–4 dimensions.

**Invocation.** For a per-PR review, dispatch each applicable dimension via the Agent tool with `subagent_type` set to the specialist (e.g. `compound-engineering:review:ce-security-sentinel`). Each reviewer reads the diff and returns findings. Adversarially verify any HIGH or MEDIUM finding via `compound-engineering:review:ce-adversarial-reviewer` before deciding to fix or defer. For a full-codebase audit (quarterly, after a major refactor, or when entering unfamiliar territory), use the Workflow tool to fan the dimensions out across the codebase rather than reviewing a single diff.

**Ready-to-merge gate.** A PR is ready to merge only when (1) all Always-tier dimensions have been reviewed, (2) all conditional dimensions whose triggers fire have been reviewed, (3) every finding has been fixed in this PR, refuted by the adversarial reviewer, or explicitly deferred with a tracked follow-up reference in the PR body, and (4) the Claude code-review GitHub Action has passed.

## Repository Layout

- `frontend/` — Next.js 14 App Router + Tailwind. Screens live under `frontend/app/`, shared UI under `frontend/components/`.
- `frontend/lib/` — Supabase clients, Resend helper, constants, and (to be added) `mock/` data.
- `database/` — Supabase SQL schema + seed data (backend phase).
- `config/` — nginx + pm2 deploy config (backend/deploy phase).
- `docs/` — feature spec, design system, launch guide, schema docs, and the `pulse_v4_prototype.html` visual reference.

## Local Development

```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

No `.env.local` is required during the frontend-first phase (mock data only).

## Commit Conventions

- Conventional prefixes: `fix:`, `feat:`, `refactor:`, `chore:`, `docs:`, `test:`, `style:`.
- Include a narrow scope when it helps: `feat(dashboard): employee stat cards`, `fix(policies): gate blocks nav until all 20 acked`.
- Default to `fix:` when remedying broken behaviour, even if the change adds code. Reserve `feat:` for new capabilities.
- Never use `!` (breaking-change marker) or `BREAKING CHANGE:` without Ryan's explicit confirmation.

## Don'ts

- Don't refactor surrounding code while doing scope-defined work. Out-of-scope cleanup goes in a separate PR.
- Don't commit secrets, credentials, or `.env*` files.
- Don't use `--no-verify` or skip hooks without explicit go-ahead.
- Don't wire screens to a live Supabase/Resend during the frontend-first phase — use the mock layer.
- Don't extend scope on your own — surface ideas to Ryan instead.
