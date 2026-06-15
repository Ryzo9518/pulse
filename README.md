# PULSE — Developer Handoff Package
## The heartbeat of your team | Jera Consulting (Pty) Ltd

**Date:** 2026 | **Stack:** Next.js 14 (App Router) + Supabase (Postgres + RLS) + Microsoft 365 + Tailwind CSS

- **Auth:** Microsoft 365 SSO, mapped to three roles (Employee, Manager, Admin), driving Supabase RLS.
- **Email / notifications:** Microsoft 365 / Outlook via the Graph API. (The repo's `frontend/lib/resend.ts` is legacy.)
- **File storage:** SharePoint / OneDrive (Microsoft 365).

## Current phase: frontend-first (mock data)

The app currently runs on **built-in mock data** — no Supabase project, no Microsoft 365 connection, no email, no file storage, and no environment variables are needed to click through it. Supabase, M365 SSO/email, and SharePoint storage are the upcoming **backend phase**, not yet wired.

```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

## What is PULSE?
Internal HR & onboarding portal for Jera Consulting. Features:
- Role-based onboarding workflows — three roles (Employee, Manager, Admin). Managers get work-related team oversight only (no payroll, POPIA, or contract).
- **24** HR policy walkthroughs with a mandatory acknowledgement gate
- 4 SOP walkthroughs (Zoho Projects, Zoho Desk, Timekeeping, Client Access)
- 5 onboarding forms (personal, emergency, tax/banking, policies, 30-60-90 goals)
- **Training** — multi-product Sage U learning paths with a 4-stage billable ladder
- **Certifications** — product + NQF qualification certs with expiry tracking and tender packs (employees/managers upload their own; admins upload for others)
- **Expenses** — claims with AA-rate travel (invoiced full rate vs non-invoiced fixed) + advances, timesheet & receipt-slip attachments, approver workflow
- Staff directory, company document library (admin upload/delete), Notify All announcements
- **Ask HR — Pulse Assistant** (AI helper grounded on the policy corpus; team messaging is done in Microsoft Teams)

## Source of truth
- **Visual / UI:** the interactive prototype `docs/prototype/Pulse.dc.html` + `docs/prototype/HANDOFF.md` (supersedes the older `docs/pulse_v4_prototype.html`)
- `docs/prototype/HANDOFF.md` — implementation brief
- `docs/SCHEMA_DOCS.md` — database documentation
- `docs/FEATURE_SPEC.md` — detailed feature specifications
- `docs/DESIGN_SYSTEM.md` — colours, typography, components
- `frontend/` — Next.js application source code

## Contact
Ryan de Kock | ryan@jera.co.za | +27 11 913 3320
