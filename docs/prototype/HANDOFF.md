# Pulse — Developer Handoff

**The heartbeat of your team** — Jera Consulting's internal HR & onboarding portal.

This document is the implementation brief for the backend build. The front end exists as a working, interactive prototype: **`Pulse.dc.html`** (single self-contained component + `policies-content.js` with all 24 real HR policies). Open it in a browser to see every screen, role, and flow behave exactly as intended. The prototype is the source of truth for UI, states, and interactions.

> **Status:** front end is prototype-complete with mock data and in-memory state. No backend, auth, file storage, email, or persistence is wired. This brief maps the prototype to a real Next.js + Supabase build.

---

## 1. Stack & decisions (locked)

| Area | Decision |
|---|---|
| Front end | Next.js (existing repo `Ryzo9518/pulse`) |
| Database / auth | Supabase (Postgres + RLS) |
| Email / notifications | **Microsoft 365 / Outlook via Graph API** |
| File storage | **SharePoint / OneDrive (Microsoft 365)** |
| Policy documents | **Word → stored HTML/rich text**, edited in-app; PDF original downloadable |
| Ask-HR bot | **Deferred — build last.** Prototype uses a demo LLM helper; production needs a real endpoint grounded on the policy corpus |
| Design system | **Keep the current Outfit + dark-sidebar look — this is intentional.** Do NOT revert to the Jera "documents" DS (Inter/navy/tight radii). Brand burgundy `#911431` is correct. |

**Design tokens in use** (keep these): burgundy `#911431`, dark sidebar `#1a1a1a`, page bg `#FAF9F7`, card border `#E8E4DF`. Status colours: ok `#2D8A56`, warn `#C4880C`, err/burgundy `#911431`, info `#2b72b9`. Fonts: Outfit (UI), JetBrains Mono (figures/codes).

---

## 2. Roles & permissions

Three roles. The prototype fakes this with a "View as" toggle; production resolves it from the authenticated user.

| Capability | Employee | Manager | Admin |
|---|---|---|---|
| See own dashboard / onboarding / training / forms / policies | ✓ | ✓ | ✓ |
| Team dashboard (roster, cert expiry, billable pipeline) | — | ✓ (their team) | ✓ (all) |
| View team **Training** status | — | ✓ | ✓ |
| View team **Certifications** + tender export | — | ✓ | ✓ |
| **Upload / edit** certificates (incl. for others) | — | — | ✓ |
| **Approve expense claims** | — | ✓ | ✓ |
| **Schedule onboarding** (new starter) | — | ✓ | ✓ |
| See **employment contract** task | — | **✗** | ✓ |
| See **payroll / tax / banking / medical (POPIA)** tasks | — | **✗** | ✓ |
| Assign task owners | — | — | ✓ |
| Publish / version policies | — | — | ✓ |
| Upload company documents / SharePoint links | — | — | ✓ |
| **Notify All** (company announcements) | — | — | ✓ |

**Manager rule of thumb:** work-related team oversight only. Never payroll, never POPIA/personal data, never the employment contract. A manager can start an onboarding and track its work tasks, but the HR Admin phase (tax, banking, payroll, medical aid) and the contract/NDA task are hidden from them — enforce this in RLS, not just the UI.

---

## 3. Modules (screens in the prototype)

| Module | Route key | What it does | Backend notes |
|---|---|---|---|
| Dashboard | `dashboard` | Employee: time-aware "This week" (due dates from start date), focus/journey hero, contacts, Ask-HR nudge. Manager/Admin: team-at-a-glance, cert-expiry alerts, approvals queue, billable pipeline, onboarding-in-progress. | All figures computed from real tables — none hardcoded. |
| Workflow | `workflow` | Onboarding phases (Pre-Arrival → Day 1 → IT Setup → HR Admin → Orientation) with task checklist, owner assignment, status. | `onboarding_tasks`. Owner assignment + email on assign (Graph). Manager visibility excludes `hr` phase + contract task. |
| SOPs | `sop` | Read-only system walkthroughs (Zoho Projects, Desk, Timekeeping, Client Access). | Static content or `sops` table. |
| My Forms | `forms` | 5 onboarding forms (personal, emergency, tax/banking, policy ack, 30-60-90). | `form_submissions`. Tax/banking = POPIA-sensitive. |
| Policies | `policies` | Read + acknowledge gate for all 24 HR policies; admin publishes new versions (resets acks). | `policies`, `policy_versions`, `policy_acknowledgements`. Word→HTML on upload. |
| Training | `training` | Per-product Sage U learning paths (Intacct, X3, 300 People, Payroll Advanced, …) with nested groups, typed modules, progress, ILT date entry → billable readiness. | `training_paths`, `training_modules`, `training_progress`. |
| Certifications | `certifications` | Upload product + qualification (NQF) certs with expiry; org→product cascading tender filters; download-all / select for tender packs. | `certifications`. Expiry drives recertification alerts. |
| Expenses | `expenses` | Claim form: expenses incurred + travel (AA rate, invoiced/non-invoiced) + advances; grand total; timesheet required; submit → approve/return. AA Rate Certificate upload sets per-person rates. | `expense_claims`, `expense_lines`, `aa_rate_certificates`. |
| Directory | `people` | Searchable staff directory. | `employees` (work fields only for non-admins). |
| Documents | `documents` | Company document library; admin uploads files or SharePoint links (multiple). | `documents` (+ SharePoint refs). |
| Ask HR | `chat` | AI assistant grounded on HR/payroll policies. **Deferred.** | Real LLM endpoint + policy corpus retrieval. |
| All Employees / My Team | `admin-employees` | Admin: full roster. Manager: their team (work fields, no POPIA). | RLS-scoped. |
| Schedule / New Employee | `admin-onboard` | Capture new hire (name, role, dept, product, start, email, buddy) → generates 30 tasks across 5 phases, adds to roster + onboarding + training. | Manager may schedule but not see contract. |
| Notify All | `admin-notify` | Compose announcement, pick audience (with live counts), email + in-app, live preview, send. | Admin only. Graph API send. |

---

## 4. Business rules

- **Billable readiness** (Training & dashboard pipeline), derived from a consultant's training flags + ILT date:
  - **Supervised-billable** ≈ start date **+ 7 days** (foundations + shadowing done).
  - **ILT complete** = the instructor-led training date the consultant enters.
  - **Certified** ≈ ILT date **+ 10 days** (after the certification exam).
  - Stages: Pre-supervised → Supervised-billable → ILT complete → Certified.
- **Expense travel (AA rate):** reimburse at the consultant's **AA Vehicle Rates Certificate** rate. **Full AA rate** for travel **invoiced** to a client; **fixed-cost** rate for **non-invoiced**. Travel not invoiced to a client may not be claimed. Grand total payable = expenses incurred + travel − advances. A timesheet copy must accompany every claim. Submit by the 25th.
- **Policy versioning:** publishing a new version **resets all acknowledgements** — every employee must re-acknowledge.
- **Certification expiry:** product certs have an expiry; within 60 days → "expiring" (amber), past → "expired" (red). Drives the admin recertification alerts and the tender-pack readiness.
- **Onboarding generation:** scheduling a new hire generates the standard task set (30 tasks across 5 phases) seeded from the phase/task template.
- **Salaries** paid on the 25th; **annual leave** 15 days/yr; **sick** 15 days/36-month cycle; **notice** per BCEA (1wk ≤6mo, 2wk 6–12mo, 4wk 1yr+). (Used by Ask-HR and policy content.)

---

## 5. Integrations — discrete backend tickets

1. **Microsoft 365 Graph — email.** Assignment notifications (task assigned), announcements (Notify All), and certification-expiry reminders. Triggered server-side on the relevant events.
2. **SharePoint / OneDrive — file storage.** Certificate PDFs, the AA Rate Certificate, company documents, and policy source files. Store SharePoint item references against the records.
3. **Word → HTML conversion.** On policy upload, convert the `.docx` body to sanitised HTML/rich text for in-app reading + editing; keep the original for PDF download.
4. **Ask-HR LLM (deferred, build last).** Real model endpoint with retrieval over the 24-policy corpus + payroll/leave/expense rules; never invent figures; defer to HR for binding answers.
5. **Microsoft 365 auth / SSO.** Map M365 identities to the three roles; drive RLS.

---

## 6. Where the data lives in the prototype

In `Pulse.dc.html` the canonical mock datasets (single sources of truth — mirror these as tables) are:

- `PEOPLE` → `employees` (name, title, dept, status active/onboarding/probation, email, colour)
- `PHASES` + `TASKS` → onboarding template → `onboarding_tasks`
- `getPolicies()` / `policies-content.js` (`window.PULSE_POLICIES`) → `policies` (24 real HR policies, code/version/effective/summary/full_text)
- `ONBOARDING` → per-hire onboarding progress (tasks done, policy acks)
- `TRAINING_STATUS` → per-consultant billable flags + ILT date
- `INTACCT_PATHS` / `X3_PATHS` / `PAYROLL_PATHS` / `PEOPLE300_PATHS` → `training_paths` + `training_modules`
- `SEED_CERTS` + `ORG_PRODUCTS` → `certifications` + org/product taxonomy
- `EXPENSE_CLAIMS` + claim line state → `expense_claims` + `expense_lines`
- `VEHICLE` / `aaCert` → `aa_rate_certificates`

See `SCHEMA.sql` for the proposed Postgres schema.
