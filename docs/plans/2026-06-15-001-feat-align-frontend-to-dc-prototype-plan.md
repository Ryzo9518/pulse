# Align the Pulse frontend to the new `Pulse.dc.html` prototype

**Date:** 2026-06-15
**Status:** Proposed — awaiting Ryan's go-ahead on sequencing + the open product decisions below
**Branch landing this plan + prototype:** `chore/adopt-dc-prototype`

## Why

A newer, richer interactive prototype (`docs/prototype/Pulse.dc.html`) is now the source of truth for the Pulse UI. The existing Next.js frontend (built over PRs #7–#16) was built against an earlier design and is behind the prototype on several modules. This plan brings the built screens in line with the prototype, **staying in the frontend-first / mock-data phase** (no Supabase/auth/email wiring yet — that is the later backend phase).

Two decisions are locked (Ryan, 2026-06-15):
1. **Frontend aligns to the new prototype** (prototype wins where they differ).
2. **Stack is Microsoft 365** — Graph for email/notifications, SharePoint/OneDrive for files, M365 SSO for auth. (Affects the backend phase + docs; no frontend wiring this phase.)

Good news from the gap analysis: **design tokens already match the prototype exactly** (burgundy `#911431`, dark sidebar, Outfit/JetBrains Mono, all status colours). No design-system restyle is needed — the work is missing screens, the missing Manager role, and missing business logic.

## The single biggest blocker: the Manager role doesn't exist

The build only has `employee | admin`. The prototype is a **three-role** system. A third of the brief (team dashboard, team training/cert oversight, expense approvals, schedule-onboarding-without-contract, the "My team" nav section) is currently unreachable. **Almost every other workstream depends on Manager existing**, so it goes first.

---

## Workstreams (each = one reviewable PR; ordered by dependency)

### W0 — Adopt prototype + docs (this branch, `chore/adopt-dc-prototype`)
- Land `docs/prototype/` bundle (`Pulse.dc.html`, `HANDOFF.md`, `SCHEMA.sql`, `policies-content.js`, `support.js`, `source-policies/*.docx`). ✅ done
- Update `CLAUDE.md`: M365 stack, three roles, 24 policies, new visual source of truth. ✅ done
- This plan. ✅ done
- TODO before merge: sync the older docs that now drift — `docs/FEATURE_SPEC.md`, `docs/SCHEMA_DOCS.md`, `docs/DESIGN_SYSTEM.md` (visual-source pointer), `frontend/README.md` / root `README.md` (Resend→M365, 20→24). Can be folded here or a fast follow.

### W1 — Manager role, end-to-end (PREREQUISITE for most others)
- Add `'manager'` to `UserRole` (`frontend/types/database.ts`), the `RoleSwitch`, and `lib/mock/session.tsx`.
- Add the prototype's **"My team"** sidebar section (My Team + Schedule Onboarding) for managers (`components/layout/Sidebar.tsx`).
- Stop hard-redirecting non-admins on `/admin/employees` and `/admin/onboard`; gate by capability instead.
- Establish the manager-visibility helper used downstream: hide the `hr` onboarding phase + the contract/NDA task; never expose payroll/POPIA/personal fields.

### W2 — Policies: 24-corpus + dynamic gate + admin authoring
- Import all **24** policies from `policies-content.js` into `lib/mock/policies.ts` (adds HR021 Service Delivery Framework, HR022 Document Management, HR023 Time Logging, HR024 Paternal Leave; add `version` + `effective` fields).
- **Compliance fix:** replace the hardcoded `TOTAL_POLICIES = 20` (`lib/constants.ts`) with a derived count (`listPolicies().length`) everywhere the gate uses it (`policyGate.ts`, `getPolicyAckState`, progress copy). Today the gate would lift early at 20/24.
- Add the admin authoring surface: role-branched policies page, edit/new-policy editor (HTML body field for Word→HTML), and a `publishPolicyVersion()` mutator that bumps the version and resets acknowledgements.
- Add reading-view fidelity: version/effective meta line + a "Download PDF" stub (wires to SharePoint later).
- Link the My Forms "Policy Acknowledgement" card to real ack state so it auto-completes.

### W3 — Certifications module (NEW — 100% absent today)
- New `/certifications` route + nav item under "Development".
- Cert library: **product** certs (vendor/product/expiry) + **qualification** certs (NQF level, no expiry); class taxonomy; 4 stat cards; All/Product/Qualifications/Expiring filter.
- Expiry logic: within 60 days → amber, past → red, sorted expired→soon→valid→none.
- Admin upload/edit modal (role-gated: only Admin uploads, incl. for others; Employee sees own; Manager reads team + tender export).
- Org→product cascading **tender filters** + download-all / download-selected packs (stubbed; wires to SharePoint ZIP later).

### W4 — Training: multi-product learning paths
- Replace the single-product "Cert Tracker" with the prototype's **Training** screen: product selector (Intacct, X3, 300 People, Payroll Advanced, +others) and per-product path datasets.
- Nested learning paths → grouped, typed modules (video/ilt/assessment/exam/link/job/stage), required/recommended tags, per-path + overall progress bars, module-completion checkboxes.
- Reconcile ILT entry to a consultant-entered **date field** (matches SCHEMA `training_status.ilt_date`); the build's session-dropdown is an extra — keep or drop (see decisions).
- Add the **Pre-supervised** stage so the 4-stage ladder is complete (Pre-supervised → Supervised-billable → ILT complete → Certified).
- Rename nav label "Cert Tracker" → "Training".

### W5 — Dashboard rebuild (employee + manager/admin)
- Employee: Focus/Journey hero toggle (progress ring + Next-step card; 6-step billable journey timeline), time-aware "This week" list (due dates from start date), curated "Your people" 3-contact card, Ask-HR nudge. Remove the build-only team-assignments/Ping + activity feed from the employee view.
- Manager/Admin: team-at-a-glance roster stat cards, cert-expiry/recertification alerts, **billable-readiness pipeline** (data already in `getBillableSummary`), and an approvals queue extended to include outstanding policy sign-offs. (Depends on W3/W4 data.)

### W6 — Workflow / onboarding
- Admin/manager view → **phase accordions** (Pre-Arrival → Day 1 → IT → HR Admin → Orientation), not grouped-by-person.
- Per-task **owner assignment dropdown** + assign/resend-email affordance (the prototype's defining interaction; absent today).
- Apply W1 manager visibility (hide `hr` phase + contract task `t7`; gate the contract drop-zone to admin).
- Reconcile the task seed to the 30-task template; decide keep/cut on build-only extras (priority dots, system badges, integration-preview modal, reminder button).

### W7 — Expenses: AA-rate / invoiced / advances model
- Rebuild the claim as three parts: **Expenses incurred + Travel + Advances**, grand total = incurred + travel − advances.
- Per-person **AA Rate Certificate** card + editor; saved rates drive travel math. Replace the flat `SARS_KM_RATE` with Full-AA (invoiced) vs Fixed-cost (non-invoiced) rates.
- Per travel line: `invoiced` toggle (drives rate + requires invoice no.), reason field, "Full AA"/"Fixed" badge.
- Enforce the **timesheet attach** on submit (currently banner-only copy).
- Rename approver "Decline" → "Return for correction" (returnable state). Keep the build's free-text review notes (an improvement).

### W8 — Admin: Notify All + New Employee
- **Notify All:** live audience counts, recipients avatar-chip card, live PULSE-branded email preview, Email/In-app channel toggles, dynamic "Send to N →" button, "Announcement sent" success state. Align audience to status-based segments (Everyone/Onboarding/Probation/+dept).
- **New Employee:** add Primary Sage product + Onboarding buddy fields, optional email with auto-derivation, "Will generate 30 tasks across 5 phases" preview, success hero + "View workflow →". Allow Manager to schedule (contract/HR-admin hidden).
- **All Employees:** add Total/Active/Onboarding stat cards + 2FA column; align columns to prototype (decide on Phone/Role/Notify-button extras); build the Manager "My Team" scoped roster.

### W9 — Smaller alignments
- **People directory:** make it searchable (client component, name/role/dept filter) — currently a static list.
- **Documents:** admin "Add documents" modal (multi-file upload + SharePoint link), per-doc replace, LINK document type/badge. Reconcile category taxonomy (prototype 4 vs build 7) — see decisions.

### W10 — Ask HR / Chat identity (do near last; Ask-HR LLM is deferred)
- The build's `/chat` is a **team-chat + announcements board**; the prototype's `/chat` is the **Ask-HR AI assistant**. They are different features, and the build's announcements overlap with Notify All. Resolve per the decision below.

---

## Product decisions — RESOLVED (Ryan, 2026-06-15)

| # | Decision | Affects | Resolution |
|---|---|---|---|
| D1 | Policy version publish — scope of re-acknowledgement. | W2 | **Only the changed policy** must be re-acknowledged (by all staff); the other policies stay signed. |
| D2 | Non-invoiced travel rule. | W7 | **Claimable at the fixed-cost rate** (~R4.59/km), not the full AA rate. Update the prototype's contradictory "may not be claimed" banner copy to match. |
| D3 | `/chat` identity. | W10 | **Rebuild as the Ask-HR assistant shell** (suggestion chips, bot bubbles, "Thinking…", HR disclaimer; LLM stubbed/deferred). **Remove the team-chat + announcements board** — Notify All already covers announcements. |
| D4 | Build-only extras. | W6/W8 | **KEEP:** notification-type picker (Notify All), workflow priority dots + Zoho/M365 system badges. **REMOVE:** admin Passwords screen, dashboard activity feed. (Owner-assignment must still be the primary workflow interaction; badges are secondary.) |
| D5 | Documents categories. | W9 | **Keep the build's richer 7 categories** (do not downgrade to the prototype's 4). |
| D6 | Forms richness. | — | **Keep the build's forms** (POPIA consent, SA-ID/account validation, 2nd emergency contact) — they exceed the prototype. No change. |

Knock-on cleanups implied by the above: D3 → remove `/chat` announcements board + reconcile nav ("Ask HR" label/icon); D4 → delete the `/admin/passwords` route + its nav entry and the dashboard activity-feed section.

## Execution notes
- **Per repo working agreement:** one feature branch per workstream, draft PR early, the Claude code-review Action + the CLAUDE.md specialist-dimension review must pass before merge. Stay on mock data.
- **Parallelism:** W2, W3, W7, W8, W9 are largely independent once **W1 (manager role)** merges. Ryan prefers maximum parallelism — run these in **isolated git worktrees** to avoid the concurrent-commit collision seen on 2026-06-13. W5 (dashboard) and W6 (workflow) should land after the data modules they read from (W3/W4).
- **Suggested order:** W0 → W1 → (parallel: W2, W3, W4, W7, W9) → W5, W6, W8 → W10.
