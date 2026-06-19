---
title: "feat: PULSE frontend build (mock-data, all screens)"
type: feat
status: complete
date: 2026-06-13
completed: 2026-06-14
---

# feat: PULSE frontend build (mock-data, all screens)

> **Status: complete.** All 15 units shipped to `main` (foundation PR #1 + screen PRs #4–#16); the policy gate is enforced and the full mock-data app is reachable. Prototype-alignment work continued in `2026-06-15-001-feat-align-frontend-to-dc-prototype-plan.md`.

## Overview

Build the entire PULSE frontend — every screen in the feature spec — as a clickable Next.js 14 app driven by **mock/in-memory data only**. No Supabase, no Resend, no auth, no environment variables required to run it. The goal is a complete, visually faithful, navigable product that Ryan can click through end-to-end (employee *and* admin views) before any backend work begins.

The existing scaffold (`frontend/`) already provides the plumbing: Next.js 14 App Router config, fully wired design tokens (`frontend/app/globals.css` + `frontend/tailwind.config.ts`), TypeScript interfaces for every entity (`frontend/types/database.ts`), domain constants (`frontend/lib/constants.ts`), and a root layout. **No screens exist yet** — `frontend/app/*` feature folders are empty. This plan builds the screens on top of that scaffold.

## Problem Frame

PULSE is Jera's internal HR & onboarding portal (see `docs/FEATURE_SPEC.md`). It is currently a pixel-complete HTML prototype (`docs/pulse_v4_prototype.html`) plus an empty Next.js shell. Ryan wants to "really work on the frontend" before getting stuck into the backend. Because PULSE's backend (Supabase) is also its data + auth layer, "frontend first" specifically means: rebuild the prototype's screens as real React components, fed by a mock data layer that stands in for Supabase, so the whole experience can be perfected without standing up any backend.

(See origin: `docs/BUILD_APPROACH.md` for the decisions behind this phase.)

## Requirements Trace

- **R1.** Every screen in `docs/FEATURE_SPEC.md` is reachable and visually matches `docs/pulse_v4_prototype.html` + `docs/DESIGN_SYSTEM.md`.
- **R2.** The app runs with `npm run dev` and zero configuration — no `.env.local`, no Supabase project, no accounts.
- **R3.** Both employee and admin experiences are viewable (a mock role switch lets Ryan flip between them without "logging in" as different people).
- **R4.** The 20-policy mandatory-acknowledgement **gate** behaves correctly: an onboarding employee cannot reach other onboarding sections until all 20 are acknowledged.
- **R5.** Expense math is correct: travel lines compute km × R1.50 (SARS 2026 rate), and the grand total sums travel + other lines.
- **R6.** Mock data is realistic and uses the existing `frontend/types/database.ts` interfaces, so swapping to real Supabase queries later is a drop-in replacement, not a rewrite.
- **R7.** Each screen lands as a small, reviewable **draft PR** per `CLAUDE.md` (review bot runs on each).

## Scope Boundaries

- **No backend wiring.** Supabase queries, Resend email, real auth/2FA, file uploads, and realtime are all out of scope. The existing `frontend/lib/supabase-*.ts`, `frontend/hooks/useAuth.ts`, and `frontend/app/api/email/route.ts` stay in place untouched but are not required to run the app.
- **No deployment.** `config/nginx.conf`, `config/pm2.config.js`, and `docs/LAUNCH_GUIDE.md` belong to a later phase.
- **No pixel-perfect responsive polish below the prototype's breakpoints** beyond what the design system specifies (sidebar collapse < 700px, stat cards 2-col < 900px). Desktop-first.

### Deferred to Separate Tasks

- **Backend phase** (separate plan): stand up Supabase, run `database/pulse_v5_schema.sql`, regenerate `frontend/types/database.ts` via `npx supabase gen types`, replace the mock layer with real queries, wire Resend, fix the known type error in `frontend/app/api/email/route.ts` (the hand-written `Database` generic resolves `email_log` to `never`; auto-generated types fix it).
- **Leave & Meeting screens**: present in the prototype (`renderLeave`, `renderMeeting`) but **not** in `docs/FEATURE_SPEC.md`. See Open Questions — defer unless Ryan confirms otherwise.

## Context & Research

### Relevant Code and Patterns

- **Design tokens (ready to use):** `frontend/app/globals.css` (CSS vars: `--red #911431`, `--bg #FAF9F7`, etc. + fade/slide/shake animations) and `frontend/tailwind.config.ts` (Tailwind theme: `jera.*` colors, `surface.*`, `text.*`, `font-display`/`font-mono`, `rounded-card/btn/badge`, `shadow-card/card-lg/red-glow`). Build screens with these classes — do not hardcode hex values.
- **Data shapes (ready to use):** `frontend/types/database.ts` defines `Employee`, `OnboardingTask`, `HrPolicy`, `Sop`, `SopStep`, `ExpenseClaim`, `ExpenseTravelLine`, `Message`, `Document`, etc., plus view types `AdminOnboardingSummary`, `AdminActivityFeed`, `PendingExpenseApproval`. Mock data must conform to these.
- **Domain constants (ready to use):** `frontend/lib/constants.ts` — `SARS_KM_RATE` (1.50), `TOTAL_POLICIES` (20), `SA_PROVINCES`, `SA_BANKS`, `AVATAR_COLOURS`, `SOP_KEYS`, `FORM_KEYS`, company details.
- **Visual source of truth:** `docs/pulse_v4_prototype.html` — single-file SPA. Each screen maps to a `renderX()` function / `id="view-X"` container. Mine it per-screen for exact markup, copy, and layout.
- **Feature behavior spec:** `docs/FEATURE_SPEC.md` — authoritative for what each screen does.

### Prototype → screen map

| Prototype view / function | Plan unit |
|---|---|
| `showAuthScreen` | U4 Auth |
| `renderDashboard` | U5 Dashboard |
| `renderWorkflow`, `renderTaskRow` | U6 Workflow |
| `renderSOP` | U7 SOPs |
| `renderForms` + `view-form-*` | U8 My Forms |
| `renderPolicies` | U9 Policies gate |
| `view-expenses` | U10 Expenses |
| `renderPeople` | U11 People |
| `renderDocLibrary` | U12 Documents |
| `renderChat` | U13 Chat |
| `renderAdminEmployees`, `view-admin-onboard` | U14 Admin: people |
| `renderAdminPasswords`, `renderAdminNotify` | U15 Admin: passwords + notify |
| `renderLeave`, `renderMeeting` | Deferred (not in spec) |

### External References

None required. Next.js 14 App Router + Tailwind + mock-data frontend is well-established; the repo already pins the stack and design tokens.

## Key Technical Decisions

- **Mock data lives in `frontend/lib/mock/` and is consumed through a thin accessor layer**, not imported directly by screens. Screens call functions like `getCurrentEmployee()`, `listPolicies()`, `listTasks(role)` — mirroring the *shape* of eventual Supabase calls — so the backend phase swaps the accessor body, not every screen. Decision rationale: makes R6 (drop-in backend swap) achievable.
- **Mock session + role switch via React Context** (`MockSessionProvider` + `useSession`). Holds the "logged-in" mock employee and exposes `setRole('admin' | 'employee')`. The real `frontend/hooks/useAuth.ts` is left untouched for the backend phase; screens use `useSession` during this phase. Rationale: satisfies R3 without faking real auth, and keeps the eventual auth hook clean.
- **Client components for interactivity.** Screens with state (workflow toggles, the policy gate, expense calc, forms) are `'use client'`. Static screens (people, documents) can stay server components reading mock data at module scope. Rationale: App Router idiom; keeps it simple.
- **Add a lightweight test runner (Vitest + React Testing Library) in Phase 1, used only for logic-bearing units** — the policy gate, expense math, form validation, and the session/role switch. Presentational screens are verified visually (screenshot vs prototype), not unit-tested. Rationale: the gate (R4, a compliance control) and money math (R5) are correctness-critical and cheap to guard; pixel-matching is not a unit-test job.
- **Navigation is real Next.js routing** (`app/<screen>/page.tsx`), not the prototype's JS view-switching. The sidebar uses `next/link` + `usePathname` for active state. Rationale: this is the actual app, not a prototype port.

## Open Questions

### Resolved During Planning

- *How to show both admin and employee views without real auth?* → Mock role switch in `useSession` (decision above).
- *Where does mock data live and how do screens read it?* → `frontend/lib/mock/` behind an accessor layer (decision above).
- *Do we need a test framework?* → Yes, but scoped to logic-bearing units only (decision above).

### Deferred to Implementation

- Exact component prop signatures and file-level helper names — decided while building each unit.
- Whether a few large screens (e.g. Admin) split into more than one PR — decided when the unit is opened, if the diff grows too large to review comfortably.

### Needs Ryan's Decision (non-blocking — defaulting to "defer")

- **Leave & Meeting screens** exist in the prototype but not the feature spec. Default: build them last (or skip) after the spec'd screens are done. Confirm priority when we reach Phase 4.

## Output Structure

    frontend/
      lib/
        mock/
          index.ts            # accessor layer: getCurrentEmployee(), listPolicies(), etc.
          employees.ts        # ~8 realistic Jera employees + 1 onboarding employee
          onboarding.ts       # phases, tasks (with visibility), task status, goals
          policies.ts         # 20 HR policies + acknowledgement state
          sops.ts             # 4 SOPs + their steps
          expenses.ts         # sample claims, travel + other lines
          comms.ts            # chat messages, announcements, admin notifications
          documents.ts        # document library entries
        session.tsx           # MockSessionProvider + useSession (current user + role switch)
      components/
        layout/
          AppShell.tsx        # sidebar + main content frame
          Sidebar.tsx         # role-based nav, active highlight, user card, sign-out
          PageHeader.tsx
          RoleSwitch.tsx      # dev-only employee/admin toggle
        ui/
          StatCard.tsx  ActionCard.tsx  Badge.tsx  Card.tsx  Button.tsx
          Input.tsx  Select.tsx  ProgressBar.tsx  Avatar.tsx  Modal.tsx
          Toast.tsx  DataTable.tsx  EmptyState.tsx  Tabs.tsx
      app/
        (auth)/login, twofactor, forgot/page.tsx
        dashboard/page.tsx
        workflow/page.tsx
        sop/page.tsx
        forms/page.tsx  (+ personal, emergency, tax, policies, goals)
        policies/page.tsx
        expenses/page.tsx
        people/page.tsx
        documents/page.tsx
        chat/page.tsx
        admin/employees, onboard, passwords, notify/page.tsx
        page.tsx              # root: redirect to /login (or /dashboard if mock-session active)

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

Data + session flow (mock phase). The accessor layer is the seam that the backend phase later swaps:

```
Screen (page.tsx / component)
        │  calls
        ▼
useSession() ─────────┐         lib/mock/index.ts (accessor)
  • currentEmployee   │              • getCurrentEmployee()
  • role  • setRole() │              • listTasks(role) / listPolicies() / ...
        │             └──────────────────────┬─────────────
        ▼                                     ▼
  RoleSwitch (dev)                  lib/mock/*.ts (in-memory seed data, typed by types/database.ts)

   ── backend phase later ──> accessor bodies call Supabase instead; screens unchanged
```

Policy gate (R4):

```
employee role + policies_completed=false
        │
        ▼
Sidebar: onboarding sections (Workflow, SOPs, Forms) render but route-guard redirects → /policies
/policies: tick all 20 → on 20th ack, set mock employee.policies_completed = true → guard lifts
admin role: no gate (sees everything)
```

## Implementation Units

### Phase 1 — Foundation

- [x] **Unit 1: Mock data layer + test runner**

**Goal:** Realistic in-memory data for every entity, behind an accessor layer; add Vitest + RTL.

**Requirements:** R2, R6

**Dependencies:** None (types + constants already exist)

**Files:**
- Create: `frontend/lib/mock/employees.ts`, `onboarding.ts`, `policies.ts`, `sops.ts`, `expenses.ts`, `comms.ts`, `documents.ts`, `index.ts`
- Modify: `frontend/package.json` (add `test` script + vitest, @testing-library/react, jsdom devDeps), create `frontend/vitest.config.ts`
- Test: `frontend/lib/mock/__tests__/accessors.test.ts`

**Approach:**
- Seed ~8 employees (mix of roles/departments using `AVATAR_COLOURS`) + 1 "onboarding" employee whose journey drives the onboarding screens. Pull the 20 policies, 4 SOPs (+steps), ~30 tasks, sample expense claim, chat/announcements, and documents from `docs/pulse_v4_prototype.html` and `docs/FEATURE_SPEC.md`.
- All objects conform to `frontend/types/database.ts`.
- `index.ts` exposes read accessors (`getCurrentEmployee`, `listEmployees`, `listTasks(role)`, `listPolicies`, `getPolicyAckState`, `listSops`, `listExpenseClaims`, `listMessages`, `listDocuments`) and a few mutators for in-session state (`acknowledgePolicy(id)`, `setTaskStatus(id, status)`).

**Patterns to follow:** `frontend/lib/constants.ts` for domain values; `frontend/types/database.ts` for shapes.

**Test scenarios:**
- Happy path: `listPolicies()` returns 20 items; `listTasks('employee')` excludes admin-only tasks; `listTasks('admin')` returns all.
- Edge case: `acknowledgePolicy()` is idempotent (acking an already-acked policy doesn't double-count).
- Happy path: seeded onboarding employee has `policies_completed = false` initially.

**Verification:** `npm run test` passes; accessors return correctly-typed data.

- [x] **Unit 2: App shell, sidebar, mock session + role switch**

**Goal:** The persistent frame (dark sidebar + content), role-based nav, and the mock session that powers "who am I / which view."

**Requirements:** R2, R3

**Dependencies:** Unit 1

**Files:**
- Create: `frontend/lib/mock/session.tsx` (`MockSessionProvider`, `useSession`), `frontend/components/layout/AppShell.tsx`, `Sidebar.tsx`, `PageHeader.tsx`, `RoleSwitch.tsx`
- Modify: `frontend/app/layout.tsx` (wrap children in `MockSessionProvider`), create `frontend/app/page.tsx` (root redirect)
- Test: `frontend/lib/mock/__tests__/session.test.tsx`

**Approach:**
- `useSession` holds `currentEmployee` + `role` and exposes `setRole`. `RoleSwitch` is a small dev-only control (e.g. top-right) so Ryan flips employee/admin.
- `Sidebar` renders sections from `docs/FEATURE_SPEC.md` (Main / People / Finance / Resources / Comms / Admin), shows the Admin section only when `role === 'admin'`, uses `next/link` + `usePathname` for active highlight, and renders the bottom user card + sign-out (sign-out clears mock session → `/login`).
- Badges (pending tasks, X/20 policies, unread chat) read from accessors.

**Patterns to follow:** Sidebar spec in `docs/DESIGN_SYSTEM.md` (260px, `surface-sidebar`, active = `jera-red` bg) and `docs/FEATURE_SPEC.md` nav structure.

**Test scenarios:**
- Happy path: `role='admin'` → Admin nav items render; `role='employee'` → they do not.
- Happy path: `setRole` updates the active employee/admin visibility.
- Edge case: sign-out clears the session.

**Verification:** Shell renders, nav switches by role, active route highlights.

- [x] **Unit 3: Shared UI component library**

**Goal:** The reusable primitives every screen needs, matching the design system.

**Requirements:** R1

**Dependencies:** None (tokens exist); pairs with Unit 2

**Files:**
- Create: `frontend/components/ui/StatCard.tsx`, `ActionCard.tsx`, `Badge.tsx`, `Card.tsx`, `Button.tsx`, `Input.tsx`, `Select.tsx`, `ProgressBar.tsx`, `Avatar.tsx`, `Modal.tsx`, `Toast.tsx`, `DataTable.tsx`, `EmptyState.tsx`, `Tabs.tsx`
- Test: none

**Approach:** Build each primitive to the `docs/DESIGN_SYSTEM.md` "Component Patterns" spec (stat card top color bar, action card hover lift, badge color-at-15%-opacity, dark table headers, toast slide-in). Use Tailwind theme classes only.

**Patterns to follow:** `docs/DESIGN_SYSTEM.md` Component Patterns + Badges + Tables sections; cross-check against `docs/pulse_v4_prototype.html`.

**Test scenarios:** Test expectation: none — presentational primitives, verified visually against the prototype.

**Verification:** A scratch page (or Storybook-free visual check) shows each primitive matching the prototype; `npm run build` clean.

### Phase 2 — Onboarding core

- [x] **Unit 4: Auth screens (login, 2FA, forgot)**

**Goal:** Visual login / 2FA / forgot-password screens. No real auth — "Sign in" sets the mock session and routes to `/dashboard`.

**Requirements:** R1, R2, R3

**Dependencies:** Units 2, 3

**Files:**
- Create: `frontend/app/(auth)/login/page.tsx`, `(auth)/twofactor/page.tsx`, `(auth)/forgot/page.tsx`, optional `(auth)/layout.tsx` (dark gradient background)
- Test: none

**Approach:** Match the dark-gradient auth design (`docs/DESIGN_SYSTEM.md` "Auth Screens"). Login validates `@jera.co.za` format client-side, then (mock) advances to 2FA; 2FA has 6-digit auto-advance inputs with paste support; both "succeed" with any input and set the mock session. Forgot is a two-step visual flow.

**Patterns to follow:** `showAuthScreen` in `docs/pulse_v4_prototype.html`; `docs/FEATURE_SPEC.md` Authentication section.

**Test scenarios:** Test expectation: none — visual + mock flow; logic is trivial. (If 6-digit input auto-advance/paste proves fiddly, add a small RTL test for the input behavior.)

**Verification:** Click-through login → 2FA → dashboard works; visuals match prototype.

- [x] **Unit 5: Dashboard (employee + admin)**

**Goal:** The home screen for both roles.

**Requirements:** R1, R3

**Dependencies:** Units 2, 3

**Files:**
- Create: `frontend/app/dashboard/page.tsx` (+ small dashboard-only components if needed)
- Test: none

**Approach:** Employee view: welcome header, 4 stat cards (Total/Completed/In-Progress/Pending from mock tasks), progress bar, quick-action cards, team assignments with per-person progress + Ping button (Ping fires a Toast, not an email). Admin view adds Pending Approvals, Onboarding Summary (`AdminOnboardingSummary`), and Activity Feed (`AdminActivityFeed`) sections.

**Patterns to follow:** `renderDashboard` in prototype; `docs/FEATURE_SPEC.md` Dashboard section.

**Test scenarios:** Test expectation: none — presentational; stat math is direct count of mock data (covered by Unit 1 accessor tests).

**Verification:** Both role variants render correctly; Ping shows a toast.

- [x] **Unit 6: Workflow**

**Goal:** Onboarding task board, role-filtered, with status interactions.

**Requirements:** R1, R3

**Dependencies:** Units 2, 3

**Files:**
- Create: `frontend/app/workflow/page.tsx`
- Test: `frontend/app/workflow/__tests__/workflow.test.tsx`

**Approach:** Employee view shows `visibility` employee/both tasks grouped by phase (accordion phase headers per design system); admin view shows all tasks grouped by responsible person. Start → `inprogress`; Done → `done` (mutates mock state). Integration modal stub for "→ Zoho/M365"; 🔔 fires a toast. Contract-upload task shows a file-drop UI that records a mock entry (no real upload).

**Patterns to follow:** `renderWorkflow` / `renderTaskRow` in prototype; `docs/FEATURE_SPEC.md` Workflow section.

**Test scenarios:**
- Happy path: clicking Start moves a task to `inprogress`; Done moves it to `done`.
- Edge case: employee view never shows admin-only tasks.

**Verification:** Status changes persist within the session; role filtering correct.

- [x] **Unit 7: SOPs**

**Goal:** Four SOP walkthroughs with step navigation.

**Requirements:** R1

**Dependencies:** Units 2, 3

**Files:**
- Create: `frontend/app/sop/page.tsx`
- Test: none

**Approach:** Tab bar across the 4 SOPs; numbered step nav (past=green/current=red/future=grey); dark-gradient SOP cards with detail/action-hint/tip; Previous/Next; final "Complete SOP" records mock completion + toast.

**Patterns to follow:** `renderSOP` in prototype; `docs/DESIGN_SYSTEM.md` SOP Cards; `docs/FEATURE_SPEC.md` SOPs section.

**Test scenarios:** Test expectation: none — step navigation is simple local state; verified visually.

**Verification:** All 4 SOPs navigate step-by-step; completion updates progress.

- [x] **Unit 8: My Forms (5 onboarding forms)**

**Goal:** The five onboarding forms with progress tracking.

**Requirements:** R1

**Dependencies:** Units 2, 3

**Files:**
- Create: `frontend/app/forms/page.tsx` and form pages/components for personal, emergency, tax, goals (policies tab links to `/policies`)
- Test: `frontend/app/forms/__tests__/forms-validation.test.tsx`

**Approach:** Build the 5 forms per spec (Personal w/ SA province dropdown, Emergency w/ 2 contacts + medical + consent, Tax/Banking w/ SA bank dropdown + consent, Policies = redirect, 30-60-90 Goals). Client-side required-field validation; "Save" records mock completion and advances the X/5 progress bar. Use `SA_PROVINCES`, `SA_BANKS`, `ACCOUNT_TYPES` from constants.

**Patterns to follow:** `renderForms` + `view-form-*` in prototype; `docs/FEATURE_SPEC.md` My Forms section.

**Test scenarios:**
- Happy path: completing required fields + Save marks the form complete and increments progress.
- Error path: submitting with a required field empty shows a validation error and does not mark complete.
- Edge case: SA ID / required-format fields reject obviously invalid input.

**Verification:** Each form validates and updates progress; dropdowns populated from constants.

- [x] **Unit 9: Policies gate (critical)**

**Goal:** The 20-policy list with mandatory acknowledgement and the navigation gate.

**Requirements:** R1, R4

**Dependencies:** Units 2, 3

**Files:**
- Create: `frontend/app/policies/page.tsx`, `frontend/lib/policyGate.ts` (guard helper)
- Modify: `frontend/components/layout/Sidebar.tsx` + onboarding route entries to consult the guard
- Test: `frontend/app/policies/__tests__/policy-gate.test.tsx`

**Approach:** List all 20 policies with status; expand to show summary + "I have read and understood" checkbox (records `read_started_at` on open, `acknowledged_at` on tick). Overall X/20 progress. **Gate:** while `role==='employee'` and not all 20 acked, navigating to other onboarding sections (workflow, sop, forms) redirects to `/policies` with a banner. On the 20th ack, set mock `employee.policies_completed = true`; gate lifts. Admins are never gated.

**Execution note:** Implement the gate logic test-first — it is a compliance control and the highest-risk behavior in this plan.

**Patterns to follow:** `renderPolicies` in prototype; `docs/FEATURE_SPEC.md` Policies — CRITICAL GATE section.

**Test scenarios:**
- Happy path: acking all 20 sets `policies_completed = true` and lifts the gate.
- Edge case (the core requirement): with 19/20 acked, an employee navigating to `/workflow` is redirected to `/policies`.
- Edge case: admin role is never redirected regardless of ack state.
- Edge case: re-acking an already-acked policy doesn't change the count.

**Verification:** Gate blocks at <20 and lifts at 20 for employees; never blocks admins.

### Phase 3 — Operations

- [x] **Unit 10: Expenses (claim form + approver view)**

**Goal:** Expense claim entry with live math, plus the approver review flow.

**Requirements:** R1, R5

**Dependencies:** Units 2, 3

**Files:**
- Create: `frontend/app/expenses/page.tsx`, `frontend/lib/expenseCalc.ts`
- Test: `frontend/app/expenses/__tests__/expense-calc.test.ts`

**Approach:** Travel section (Client Name required, Date, Rate=`SARS_KM_RATE`, KMs, auto-calc Amount), Other section (Client Name required, Date, Description, Amount, mock receipt upload), Add-Row buttons, auto Grand Total, red policy-warning banner. Submit → status `submitted` + toast. Approver view (when `expense_role` is approver/both): Pending Approvals tab, expandable line items, Approve/Decline with notes → toast.

**Execution note:** Implement `expenseCalc` test-first — it handles money.

**Patterns to follow:** `view-expenses` in prototype; `docs/FEATURE_SPEC.md` Expenses section; `SARS_KM_RATE` in constants.

**Test scenarios:**
- Happy path: a travel line of 100 km computes R150.00; grand total sums travel + other lines.
- Edge case: 0 km / empty amount → R0.00, no NaN.
- Error path: submitting with a missing required Client Name is blocked.

**Verification:** Live totals correct to 2 decimals; approver flow toggles status.

- [x] **Unit 11: People directory**

**Goal:** Grid of employee cards.

**Requirements:** R1

**Dependencies:** Units 2, 3

**Files:** Create `frontend/app/people/page.tsx` · Test: none

**Approach:** Card grid (avatar color+initials, name, role, status dot, department, email) from `listEmployees()`, including the onboarding employee.

**Patterns to follow:** `renderPeople` in prototype; `docs/FEATURE_SPEC.md` People Directory.

**Test scenarios:** Test expectation: none — presentational.

**Verification:** All seeded employees render with correct status dots.

- [x] **Unit 12: Documents library**

**Goal:** Categorised document browser.

**Requirements:** R1

**Dependencies:** Units 2, 3

**Files:** Create `frontend/app/documents/page.tsx` · Test: none

**Approach:** Categories per spec, file-type badges (DOCX/PDF/XLSX/TXT), title/description, click logs a mock view (toast). No real download.

**Patterns to follow:** `renderDocLibrary` in prototype; `docs/FEATURE_SPEC.md` Document Library.

**Test scenarios:** Test expectation: none — presentational.

**Verification:** Categories and badges render per prototype.

- [x] **Unit 13: Chat & Announcements**

**Goal:** Two-tab comms screen.

**Requirements:** R1, R3

**Dependencies:** Units 2, 3

**Files:** Create `frontend/app/chat/page.tsx` · Test: none

**Approach:** Announcements tab (admin-only posting; red left border + ANNOUNCEMENT tag) and General Chat tab (everyone). Message list + compose bar (Enter to send appends to mock messages). Only admins can type in Announcements.

**Patterns to follow:** `renderChat` in prototype; `docs/FEATURE_SPEC.md` Chat & Announcements.

**Test scenarios:** Test expectation: none — local append; admin-gating of the announcements composer verified visually via role switch.

**Verification:** Sending appends a message; announcement composer disabled for employees.

### Phase 4 — Admin portal

- [x] **Unit 14: Admin — All Employees + New Employee**

**Goal:** Admin employee table and the onboarding-creation form.

**Requirements:** R1, R3

**Dependencies:** Units 2, 3

**Files:** Create `frontend/app/admin/employees/page.tsx`, `frontend/app/admin/onboard/page.tsx` · Test: none

**Approach:** Employees table (avatar, name, email, role, department, status, phone, actions; Notify→toast). New Employee form (name, role, email, department, start date, manager) → appends a mock employee + onboarding workflow + toast. Admin-only routes (guard redirects employees away).

**Patterns to follow:** `renderAdminEmployees`, `view-admin-onboard`; `docs/FEATURE_SPEC.md` Admin Portal.

**Test scenarios:** Test expectation: none — presentational + mock append; route-guard covered by the shared guard from Unit 9.

**Verification:** Table lists mock employees; New Employee adds one; employees can't reach admin routes.

- [x] **Unit 15: Admin — Passwords + Notify All**

**Goal:** Password management table and broadcast notification composer.

**Requirements:** R1, R3

**Dependencies:** Units 2, 3

**Files:** Create `frontend/app/admin/passwords/page.tsx`, `frontend/app/admin/notify/page.tsx` · Test: none

**Approach:** Passwords table (employee, 2FA status, Reset/Enable-Disable actions → toast). Notify All composer (type info/urgent/celebration/reminder, subject, message, target all/department) → appends a mock `admin_notification` + toast; sent history below.

**Patterns to follow:** `renderAdminPasswords`, `renderAdminNotify`; `docs/FEATURE_SPEC.md` Admin Portal.

**Test scenarios:** Test expectation: none — presentational + mock append.

**Verification:** Actions fire toasts; Notify All records to history.

## System-Wide Impact

- **Interaction graph:** All screens depend on Unit 2 (`useSession`) and Unit 1 (accessors). The policy gate (Unit 9) injects a route guard consumed by the sidebar and onboarding routes — changing it affects navigation app-wide.
- **State lifecycle risks:** Mock state is in-memory and resets on full page reload (acceptable for this phase; note it to Ryan so a reset isn't mistaken for a bug). Keep mutations centralized in the accessor layer so behavior is predictable.
- **API surface parity:** The accessor layer (`lib/mock/index.ts`) is the single seam the backend phase replaces. Keeping every screen on it (no direct mock imports) preserves R6.
- **Unchanged invariants:** `frontend/hooks/useAuth.ts`, `frontend/lib/supabase-*.ts`, `frontend/app/api/email/route.ts`, `frontend/types/database.ts`, and the design-token files are NOT modified by this plan (except layout wrapping in Unit 2 and package.json in Unit 1). The backend phase builds on them intact.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Mock layer diverges from real Supabase shape, breaking the later swap | Conform strictly to `frontend/types/database.ts`; route all reads/writes through the accessor layer |
| Policy gate (compliance control) has a hole — employee slips past at <20 | Implement test-first (Unit 9); cover the 19/20 redirect case explicitly |
| Expense money math wrong | Test-first `expenseCalc` (Unit 10); assert 2-decimal totals and no NaN |
| Scope creep from Leave/Meeting screens not in spec | Explicitly deferred; confirm with Ryan before building |
| In-memory state resets on reload confuses non-dev user | Document the behavior; optionally persist to `localStorage` if it becomes annoying (deferred) |
| Adding Vitest pulls in tooling Ryan won't maintain | Scope tests to 4 logic units only; keep config minimal |

## Documentation / Operational Notes

- Update `frontend/` (or root) README with the `npm run dev` mock-mode instructions once Phase 1 lands.
- Per `CLAUDE.md`: each unit = one feature branch + draft PR; the Claude review bot runs on each (needs the `ANTHROPIC_API_KEY` repo secret Ryan sets).
- Each PR should include a screenshot of the screen next to the prototype for visual verification.

## Sources & References

- Build approach: `docs/BUILD_APPROACH.md`
- Feature behavior: `docs/FEATURE_SPEC.md`
- Visual reference: `docs/pulse_v4_prototype.html`
- Design system: `docs/DESIGN_SYSTEM.md`
- Working agreement: `CLAUDE.md`
- Data shapes: `frontend/types/database.ts` · Constants: `frontend/lib/constants.ts`
