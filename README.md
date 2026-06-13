# PULSE — Developer Handoff Package
## The heartbeat of your team | Jera Consulting (Pty) Ltd

**Version:** 5.0 | **Date:** April 2026 | **Stack:** Next.js 14 + Supabase + Resend + Tailwind CSS
**Live URL:** https://pulse.jera.co.za

## Quick Start
```bash
# 1. Database: create Supabase project, then run schema
#    SQL Editor → paste database/pulse_v5_schema.sql → Run

# 2. Frontend
cd frontend && npm install && cp .env.example .env.local
# Fill in Supabase URL, anon key, Resend API key
npm run dev

# 3. Create admin: Supabase Auth → Add User → ryan@jera.co.za
#    Copy UUID → run database/seed_admin.sql with that UUID
```

## What is PULSE?
Internal HR & onboarding portal for Jera Consulting. Features:
- Role-based onboarding workflows (admin vs employee views)
- 20 HR policy walkthroughs with mandatory acknowledgement gate
- 4 SOP walkthroughs (Zoho Projects, Zoho Desk, Timekeeping, Client Access)
- 5 onboarding forms (personal, emergency, tax/banking, policies, 30-60-90 goals)
- Expense claims with approver workflow (R1.50/km SARS 2026 rate)
- Document library, chat & announcements, admin portal
- Email notifications via Resend

## Key Files
- `docs/LAUNCH_GUIDE.md` — Full deployment instructions
- `docs/SCHEMA_DOCS.md` — Database documentation
- `docs/FEATURE_SPEC.md` — Detailed feature specifications
- `docs/DESIGN_SYSTEM.md` — Colours, typography, components
- `docs/pulse_v4_prototype.html` — Working HTML prototype (pixel reference)
- `database/pulse_v5_schema.sql` — Complete Supabase migration
- `frontend/` — Next.js application source code

## Contact
Ryan de Kock | ryan@jera.co.za | +27 11 913 3320
