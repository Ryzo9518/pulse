# Pulse — Go-Live Completion Plan

**Date:** 2026-06-30
**Status:** LIVING PLAN — the reference for finishing the live build. Tick items
as they land. Each workstream is one or more PRs following the standard deploy.
**Goal:** every screen on real data, all actions working, **no mock/demo data**,
ready for day-to-day HR use by Jera staff.

---

## 1. Where we are (done)

**Infrastructure (live on `jeraaiboss`, https://pulse.jera.co.za):** Postgres +
PostgREST + Caddy (TLS) + Auth.js Microsoft sign-in; encrypted off-box backups to
Hetzner. Real Microsoft login works; first-login relinks the employee to their
Entra account.

**Live screens (real data, your identity — no Sarah):** ✅ Identity everywhere ·
✅ People · ✅ Policies (+ acknowledge write) · ✅ Dashboard · ✅ SOPs · ✅ Admin
All-Employees/My-Team.

**Foundations reused by every screen below:**
- Authenticated proxy `app/api/rest/[...path]` — reads any table (RLS-scoped),
  writes only allow-listed tables (`WRITE_ALLOWLIST` in `lib/data/rest-proxy.ts`).
- Per-domain hook pattern (`lib/data/use*.ts`): live via proxy / mock fallback,
  same shapes, `{loading, error}`. Behind `NEXT_PUBLIC_PULSE_DATA=live`.
- Real identity via `useCurrentEmployee()` / the live session provider.
- Reproducible content-seed migrations (`scripts/gen-*.ts` → `database/migrations/`).

## 2. The standard recipe (every workstream follows this)

1. **Read path:** add/extend a `lib/data/useX.ts` hook that fetches from
   `/api/rest/<table>` (live) or the mock seam (fallback); wire the screen with
   loading + error + empty states.
2. **Write path (if any):** add the table to `WRITE_ALLOWLIST` (with only the
   methods needed); confirm RLS allows the intended write and **denies** the
   others (verify with a minted user token via curl before wiring UI); call the
   proxy from the hook; re-fetch after.
3. **Content/reference data:** if the table is empty but should ship with
   content, add a `00N_seed_*.sql` migration generated from the canonical source.
4. **Identity:** read role/id from `useCurrentEmployee()` (live) — never a persona.
5. **Verify:** `tsc` clean · `vitest` green · `next build` green · data path
   proven with a real token · then **deploy** (rsync → `npm run build` →
   `systemctl --user restart pulse-frontend.service`).
6. **Ship:** one PR per workstream (or per sub-screen), conventional title.

> Security guardrails that must hold every time: RLS is the boundary (never
> pre-filter in the client as the control); the signing secret / service token
> never reach the browser; writes re-honour the ratified statecharts (ack gate,
> expense, onboarding_task_status); POPIA — managers never see payroll/ID/medical.

---

## 3. Workstreams (in build order)

Order rationale: unlock the core onboarding loop first, then quick catalog wins,
then the write-heavy screens, then external integrations. POPIA at-rest
encryption lands before any real personal data is entered (WS-7/WS-10).

### WS-1 — Admin "Onboard a new hire" flow  ⭐ unlocks Workflow
- [ ] **Goal:** an admin onboards a person → creates an `onboarding_workflows`
      row + seeds that workflow's `onboarding_task_status` rows from the task
      template. This is why Workflow is empty today (0 workflows exist).
- **Data/writes:** insert `onboarding_workflows`; bulk-insert `onboarding_task_status`
      (status='pending') for the template tasks; set `employees.status='onboarding'`.
- **Allowlist:** `onboarding_workflows` (POST), `onboarding_task_status` (POST),
      `employees` (PATCH status) — scoped to admin via RLS.
- **Screen:** `app/admin/onboard/page.tsx` (exists as mock) → live create.
- **Reference data:** seed the **full onboarding task template** (currently only
      5 `onboarding_tasks`; mock had ~30) via a `00N_seed_onboarding_template.sql`.
- **Accept:** admin onboards a test hire → a workflow + N task statuses exist →
      that hire (or admin) sees them in Workflow. Clean up the test row.

### WS-2 — Workflow / Onboarding board
- [ ] **Goal:** live phase-accordion of tasks + per-task status, for employee
      (own workflow), manager (team), admin (all).
- **Data:** `onboarding_phases`, `onboarding_tasks`, `onboarding_task_status`
      (joined to the signed-in person's workflow).
- **Writes:** status update + (admin) owner assignment — `onboarding_task_status`
      PATCH. **Governed by the ratified Fable triggers** (manager-freeze:
      status/started/completed only; ordering trigger). Verify the trigger
      behaviour through the proxy before wiring.
- **Depends on:** WS-1 (needs workflow instances).
- **Accept:** an onboarding employee ticks a task → status persists → gate/Focus
      ring update; a manager can update team task status but not assign owners.

### WS-3 — Training
- [ ] **Goal:** live product catalog (6 products) + learning paths; per-user
      enrolment/progress (empty until enrolled).
- **Data:** `products`, training paths, `training_status`/`training_progress`.
- **Writes (later):** enrolment / progress updates → allowlist when built.
- **Reference data:** seed training paths if the catalog needs them.
- **Accept:** Training shows the 6 real products; a user's progress shows empty
      state cleanly.

### WS-4 — Expenses
- [ ] **Goal:** live expense claims + lines; create/submit; admin approve/pay.
- **Data:** `expense_claims`, `expense_travel_lines`, `expense_other_lines`,
      `expense_advance_lines`, `aa_rate_certificates`.
- **Writes:** create claim + lines (POST), submit (PATCH status), admin paid
      (PATCH). **Governed by the ratified expense statechart** (self-approve
      blocked; paid=admin; monetary fields frozen post-submit). Allowlist the
      five tables with the right methods; verify RLS/trigger denials first.
- **Accept:** an employee creates + submits a claim (persists, RLS-scoped); an
      admin sees it in Dashboard approvals + can mark paid; an employee cannot
      approve their own.

### WS-5 — Certifications
- [ ] **Goal:** live cert list (empty → fills as added); employee self-upload +
      admin manage; expiry alerts feed the Dashboard.
- **Data:** `certifications`. **Writes:** POST (add/self-upload), DELETE/PATCH
      (admin). Allowlist `certifications`.
- **File storage:** the actual certificate file → SharePoint (WS-10/B5); store
      the link/metadata in the row for now.
- **Accept:** add a cert → appears in the list + (if expiring) in Dashboard
      recert alerts, RLS-scoped (manager sees team product certs only).

### WS-6 — Documents
- [ ] **Goal:** live document list by category; add + soft-delete (is_active).
- **Data:** `documents`, `document_acknowledgements`. **Writes:** POST, PATCH
      (is_active). Allowlist `documents`.
- **File storage:** SharePoint (WS-10/B5); link/metadata in the row for now.
- **Accept:** add a document → appears in its category; admin soft-delete hides it.

### WS-7 — Forms (personal / tax-banking / emergency / goals)  🔒 POPIA
- [ ] **Goal:** the signed-in employee views + edits their own onboarding forms.
- **Data/writes:** `employee_personal_info`, `employee_tax_banking`,
      `employee_emergency_contacts`, `employee_goals`, `onboarding_form_completions`.
      POST/PATCH own rows (RLS: self only). Allowlist those tables.
- **POPIA (must precede real data):** at-rest **column-level encryption** for
      banking / ID / medical (see WS-10); consent capture; managers never read these.
- **Accept:** an employee saves their tax/banking form (persists, encrypted,
      only they + admin can read); a manager cannot read it (verify via token).

### WS-8 — Admin Notify + email (B4)
- [ ] **Goal:** the Notify composer actually sends via **Microsoft Graph email**.
- **Data/writes:** `admin_notifications`, `email_log` (POST); Graph send from a
      server route (app token / delegated). Needs Graph Mail.Send permission.
- **Accept:** sending a notification logs it + delivers a real email.

### WS-9 — Ask-HR chat (B7)  ⛔ blocked on infra
- [ ] **Goal:** the Pulse Assistant answers from the HR handbook via an
      **on-prem/self-hosted LLM**.
- **Blocked on:** standing up the LLM host (Ryan to provision). Until then the
      chat stays a clearly-labelled stub.

### WS-10 — Cross-cutting integrations & hardening
- [ ] **POPIA at-rest encryption** for banking/ID/medical columns (pgcrypto or
      app-layer) + retention/erasure + audit-log review. **Before WS-7 real data.**
- [ ] **SharePoint storage (B5)** for cert/document/expense files
      (`jera.co.za Shared Documents/20_Finance/HR`), via Graph.
- [ ] **Graph email (B4)** shared by WS-8 + onboarding notifications.
- [ ] **Reference-data seeds:** full onboarding task template (WS-1), training
      paths (WS-3), any other catalog gaps.
- [ ] **Backups/ops:** confirm the backup key is stored off both boxes; add
      Hetzner-side retention pruning.

---

## 4. Suggested sequence to "fully live"

1. **WS-1 Onboard flow** (+ onboarding template seed) → **WS-2 Workflow**. *(Core
   onboarding loop — highest leverage.)*
2. **WS-3 Training catalog** (quick read win).
3. **WS-4 Expenses** → **WS-5 Certifications** → **WS-6 Documents** (write screens).
4. **WS-7 Forms** — *only after* WS-10 POPIA encryption is in.
5. **WS-8 email (B4)** + **WS-10 SharePoint (B5)** as their dependent screens need them.
6. **WS-9 Ask-HR** when the LLM host exists.

## 5. Decisions still needed from Ryan (non-blocking for WS-1–WS-6)
- Onboarding template: confirm the canonical task list (use the mock ~30, or a
  revised set?) before seeding (WS-1).
- POPIA encryption approach: DB-level (pgcrypto) vs app-level — affects WS-7.
- LLM host for Ask-HR (WS-9): where it runs.
- Graph email sender identity + permission grant (WS-8).

## 6. How to kick off
Say e.g. **"start WS-1"** (or "do the next workstream") and I execute it end-to-end
per §2, deploy, verify, and tick the box here — then move to the next.
