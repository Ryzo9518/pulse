# PULSE — Build Approach

**Date:** 2026-06-13
**Owner:** Ryan de Kock (ryan@jera.co.za)
**Status:** Frontend-first phase, kicking off

This note captures the decisions made when we picked the project back up. The product itself is specified in `FEATURE_SPEC.md`, `DESIGN_SYSTEM.md`, and `pulse_v4_prototype.html`.

## Decisions

1. **Frontend before backend.** Build all screens first, wired to mock/in-memory data. No Supabase, Resend, accounts, or env vars needed to run and click through the whole app. Backend (Supabase + Resend + deploy) is a later phase.
2. **Extend the existing scaffold.** The Next.js 14 scaffold (`frontend/`) already has config, Supabase/Resend libs, an auth hook, DB types, and the root layout — but **no screens yet**. We build the screens on top of it, using `pulse_v4_prototype.html` + `DESIGN_SYSTEM.md` as the visual target. We do not rebuild from scratch.
3. **Repo.** Lives at `~/Documents/GitHub/pulse`, pushed to private GitHub repo `Ryzo9518/pulse`. Copied out of OneDrive (OneDrive sync corrupts git).
4. **Team & rules** ported from intacct-toolkit: `CLAUDE.md` working agreement + `.github/workflows/claude-review.yml` PR review bot. See `CLAUDE.md`.

## What "done" looks like for the frontend phase

Every screen in `FEATURE_SPEC.md` is reachable and visually matches the prototype, driven by mock data:

- Auth: login, 2FA, forgot-password (UI only, no real auth)
- Dashboard (employee + admin views)
- Workflow, SOPs, My Forms, Policies (the 20-policy gate), Expenses
- People directory, Documents, Chat/Announcements
- Admin: employees, new employee, passwords, notify-all

## Backend phase (deferred)

- Stand up Supabase project, run `database/pulse_v5_schema.sql` + seeds
- Replace the mock layer with real Supabase queries
- Wire Resend for email (`app/api/email/route.ts`)
- Deploy (`config/nginx.conf`, `config/pm2.config.js`) per `LAUNCH_GUIDE.md`
