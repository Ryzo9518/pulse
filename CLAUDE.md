# CLAUDE.md

Context and working agreement for Claude when working in the **PULSE** repository — Jera Consulting's internal HR & onboarding portal.

## What PULSE Is

An internal HR & People Operations portal for Jera staff: role-based onboarding workflows, a 20-policy mandatory-acknowledgement gate, SOP walkthroughs, onboarding forms, expense claims with an approver flow, a document library, chat/announcements, and an admin portal.

**Stack:** Next.js 14 (App Router) + Supabase + Resend + Tailwind CSS.

## Current Phase: Frontend First

We are building the **frontend before the backend**. Until further notice:

- **Build every screen against mock/in-memory data**, not Supabase. The goal is to click through the entire app — login, dashboard, onboarding, policies, expenses, admin — with no Supabase project, no Resend account, and no env vars required.
- Mock data lives in `frontend/lib/mock/`. Keep it realistic (real Jera-style names, the 20 policies, the 4 SOPs, sample employees).
- The existing `frontend/lib/supabase-*.ts`, `frontend/hooks/useAuth.ts`, and `frontend/app/api/email/route.ts` are the *eventual* backend wiring. Leave them in place but do not require them to run the app. When a screen needs data, read from the mock layer.
- **Visual source of truth:** `docs/pulse_v4_prototype.html` (pixel reference) + `docs/DESIGN_SYSTEM.md` (colours, typography, components). Match them.
- Defer Supabase schema work, auth, email, and deployment to a later "backend" phase.

## Working Agreement

- **Never push to `main`.** All changes go through pull requests. (Exception: the very first scaffold commit that creates the repo.)
- **One feature branch per screen or bounded change.** Small, reviewable PRs beat one giant PR.
- **Open the PR as a draft early** so the Claude code-review GitHub Action runs while the work evolves. Push subsequent commits to the same branch; the action re-runs.
- **Wait for the review action's verdict** before asking the user to merge. If it flags real issues, address them in the same PR.
- **Ryan is the Ops Director, not a developer.** Explain changes in plain language. Flag any step that needs him to do something technical (create a secret, click a button in GitHub/Supabase) clearly and with the exact command or click path.

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
