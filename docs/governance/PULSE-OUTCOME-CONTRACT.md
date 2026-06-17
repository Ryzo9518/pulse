# Pulse — DETERMINISTIC OUTCOME CONTRACT (Backend Phase)

> ✅ **RATIFIED — Ryan de Kock (Owner), 2026-06-17.** Board-certified SIGNED-OFF (zero defects: TOTAL, single-implementation, fully traced, zero TARGET-as-LIVE). This is the locked build spec for P4. P4 build additionally requires the live dedicated Postgres on jeraaiboss + the M365 client secret + the on-prem LLM host before it can execute.

**Standard:** Fable zero-drift. This contract sits **above** the certified
`docs/governance/PULSE-GOVERNANCE-CONTRACT.md` (hereafter **GOV**). GOV owns the
authority matrix (GOV §1), the statecharts (GOV §3.1–§3.5, §4), the V-id ledger
(GOV §6), and the LIVE/TARGET tags. This document owns the **outcomes**: for
every Stage × Actor × Action it resolves exactly **one** concrete result across
**11 facets**, plus a Given-When-Then acceptance test.

**Determinism bar (binding on every cell):**
For every Stage × Actor × Action — including every rejection, error, and
timeout/async-pending path — there is exactly **one** outcome. Each of the 11
facets is a single resolved value:

1. **user action** · 2. **client-side effect** · 3. **other-actor / BP effect**
· 4. **UI shown** (incl. exact buttons + visible/hidden sections) ·
5. **messaging** (verbatim copy) · 6. **notifications** (channel + template) ·
7. **data change** (exact field + value) · 8. **state change** (prior→resulting
statechart state, referencing GOV statecharts) · 9. **rejection behaviour** (if
illegal here: exact HTTP/UI + message + what stays unchanged) · 10. **error
behaviour** (on failure: exact UI + message + state, never silent success) ·
11. **timeout/async-pending behaviour**.

**Single-sourcing rule (mandatory).** §1 below is the **one** vocabulary table
per concept (every status enum, constant set, button label, gate predicate,
error code, notification template, data-write id, rejection id). Matrix cells
**reference an id** (e.g. `V-9 GATE-APPROVER`); they never restate the value
inline and never carry two strings for one concept. **Forbidden in cells:**
TARGET/LIVE/should/may/note/TODO hedges, inline literals, dual-valued cells,
inline file:line that duplicates a §1 id. Every cell traces to a GOV section id
or a §1 id (which itself traces to GOV / the ground sources).

**LIVE/TARGET tagging.** Tagging lives on the **§1 ids**, not re-asserted in each
cell. An id carries `[LIVE]` (verified at HEAD 2026-06-17) or `[TARGET]` (owed by
the build). A cell that references a `[TARGET]` id inherits that maturity. The §0
maturity legend resolves how a facet that mixes a LIVE mechanism with a TARGET
seam swap reads.

---

## §0 Maturity legend & sentinels

| Id | Meaning | Trace |
|---|---|---|
| MAT-LIVE | Built and verified at HEAD; the cited screen/policy/trigger exists. | GOV §6 ledger |
| MAT-TARGET | Not in the tree at HEAD; the build must create it. | GOV §6 ledger |
| MAT-LIVE-UI-TARGET-SEAM | The UI/validation is LIVE (a built screen on the mock seam); the persisted write + RLS re-decision + integration is TARGET (lands when the seam swaps to async Postgres). Read: the user-visible facet is LIVE today; the durable facet is owed. | GOV §5 (seam = `frontend/lib/mock/index.ts`); GOV §6 `Single mock seam` LIVE, `Mock synchronous accessors` TARGET |

**Single-value sentinels** (the only legal "nothing here" tokens; each is a §1 id,
never the word *none*):

| Id | Use |
|---|---|
| V-0 | Facet is structurally inapplicable for this row (no second actor / no background process touched). The only legal facet-3 value when no other-actor or BP effect occurs, and the legal value for any other facet that does not apply on this path. |
| DAT-NONE | No data change occurs: a read-only path, or a write rejected/aborted before any row is touched. The **only** legal facet-7 value for every "no write"/"read-only"/"reads return zero rows" path — zero inline literals; every such cell references DAT-NONE. |
| SCH-NONE | No statechart transition occurs (the action touches a field with no machine, or is rejected before any transition). |
| NOTE-NONE-NOEMAIL | No notification fires because the trigger is not wired and no email is intended on this path. |
| NOTE-NONE-REJECTED | No notification fires because the action was rejected before any send point. |

---

## §1 VOCABULARY (single source — every concept defined exactly once)

### §1.1 Status enums (statechart alphabets)

| Id | Concept | Resolved value | Trace |
|---|---|---|---|
| V-EMP-STATUS | `employees.status` alphabet | `active, onboarding, probation, suspended, terminated` | GOV §3.1; 001_schema.sql:25 [LIVE] |
| V-EXP-STATUS | `expense_status` alphabet | `draft, submitted, approved, returned, paid` | GOV §3.3; 001_schema.sql:28 [LIVE] |
| V-TASK-STATUS | `onboarding_task_status.status` alphabet | `pending, inprogress, done` | 001_schema.sql:26,200 [LIVE] |
| V-ACK-STATE | derived ack state | `unacknowledged, reading, acknowledged` | GOV §3.2 (derived; no status column) [TARGET-derivation] |
| V-CERT-EXP | cert expiry classifier output | `none, valid, soon, expired` | GOV §3.4; certifications.ts:199-207 [LIVE] |
| V-BILL-STAGE | billable ladder classifier output | `pre, supervised, ilt, certified` | GOV §3.5; training.ts:748-757 [LIVE] |

### §1.2 Role / actor constants

| Id | Concept | Resolved value | Trace |
|---|---|---|---|
| V-ROLE | role alphabet | `employee, manager, admin` (+ `is_owner` super-admin flag) | 001_schema.sql:24,58,61 [LIVE] |
| V-ACTOR-OWNER | Owner | Ryan; `is_owner = true`; Admin's full surface, un-scopeable, plus A3 protection | GOV §1.3; 002_rls.sql:40-49 [LIVE] |
| V-ACTOR-ADMIN | Admin | Raymond, Ben; `pulse_is_admin()` true | GOV §1.2; HANDOFF §2 [LIVE] |
| V-ACTOR-MGR | Manager | Charl, Kevin; team oversight only, never payroll/POPIA/personal/contract/HR-admin | GOV §1.1 A4; HANDOFF.md:47 [LIVE] |
| V-ACTOR-EMP | Employee | self-service only | GOV §1.3 [LIVE] |

### §1.3 Gate predicates (authorization tests — RLS is the wire)

| Id | Concept | Resolved predicate | Trace |
|---|---|---|---|
| GATE-TRUE | open read | `using (true)` | 002_rls.sql:130,164,166,204,222,224,272,289 [LIVE] |
| GATE-SELF | own row | `employee_id = pulse_current_employee()` | 002_rls.sql:31-33 [LIVE] |
| GATE-ADMIN | admin or owner | `pulse_is_admin()` | 002_rls.sql:46-49 [LIVE] |
| GATE-SELF-OR-ADMIN | self or admin/owner | `employee_id = pulse_current_employee() or pulse_is_admin()` | 002_rls.sql:145-150 [LIVE] |
| GATE-TEAM-READ | manager team membership | `pulse_role()='manager' and pulse_is_team_member(employee_id)` | 002_rls.sql:68-72 [LIVE] |
| GATE-OWNER | owner only | `pulse_is_owner()` | 002_rls.sql:40-43 [LIVE] |
| GATE-APPROVER | expense approver set | `pulse_is_admin() or (pulse_role()='manager' and pulse_is_team_member(new.employee_id))` | 002_rls.sql:326-327 [LIVE] |
| GATE-PAID | mark-paid actor | `pulse_is_admin()` on `new.status='paid'` distinct from old | GOV §3.3 guard(mark_paid) [TARGET] |
| GATE-MGR-OTS | manager onboarding-task work-phase reach | `pulse_role()='manager' and exists(...onboarding_workflows join onboarding_tasks where pulse_is_team_member(w.employee_id) and tk.manager_hidden=false and tk.phase_id<>'hr')` | 002_rls.sql:181-185 (read); GOV BLOCKER 2 (write) [LIVE-read / TARGET-write] |
| GATE-MGR-WF | manager schedule-onboarding reach | `pulse_role()='manager' and pulse_is_team_member(employee_id)` | GOV §1.4 AUTHORITY CONFLICT #1; `wf_manager_ins` [TARGET] |
| GATE-OTS-FREEZE | manager onboarding-task column freeze | manager-writable allowlist `{status, started_at, completed_at, completed_by}`; security-definer trigger raises on a manager write of `assigned_to / workflow_id / task_id` | GOV §3.6; GOV BLOCKER 2 trigger arms [TARGET] |
| GATE-OTS-ORDER | onboarding-task status ordering | `BEFORE UPDATE` trigger rejects any `(old.status,new.status)` pair absent from the GOV §3.6 table | GOV §3.6 [TARGET] |
| GATE-EXP-FREEZE | post-submit monetary freeze | branch in `enforce_expense_transition`: when `old.status not in ('draft','returned')`, raise if any of `total_other/total_travel/total_advances/grand_total` distinct from old | GOV F4 / BLOCKER 3 [TARGET] |
| GATE-EXP-ORDER | expense status ordering | `BEFORE UPDATE` trigger rejects any `(old.status,new.status)` pair absent from the GOV §3.3 table | GOV §3.3 [TARGET] |
| GATE-EMP-ORDER | employee status ordering | `BEFORE UPDATE` trigger rejects any `(old.status,new.status)` pair absent from the GOV §3.1 table | GOV §3.1 [TARGET] |
| GATE-ACK-DERIVE | read-before-ack ordering | `BEFORE INSERT OR UPDATE` trigger derives V-ACK-STATE and rejects pairs absent from the GOV §3.2 table | GOV §3.2 [TARGET] |

### §1.4 Button / control labels (verbatim from built screens)

| Id | Label (verbatim) | Trace |
|---|---|---|
| BTN-SIGNIN | `Sign In` | (auth)/login/page.tsx:68-69 [LIVE] |
| BTN-ACK | acknowledge checkbox; `disabled={acknowledged}` after tick (371-373); badge MSG-ACK-BADGE (377-383) | policies/page.tsx:369-383 [LIVE] |
| BTN-EDIT-PUBLISH | `Edit / publish` | policies/page.tsx:343 [LIVE] |
| BTN-DL-PDF | `⬇ Download PDF` | policies/page.tsx:351 [LIVE] |
| BTN-EXP-SUBMIT | claim submit control | expenses/page.tsx:476-479 (submit handler) [LIVE] |
| BTN-EXP-APPROVE | `Approve` | expenses/page.tsx:1161 [LIVE] |
| BTN-EXP-RETURN | `Return for correction` | expenses/page.tsx:1162-1166 [LIVE] |
| BTN-SAVE-CERT | `Save certificate` (AA Rate Certificate) | expenses/page.tsx:261 [LIVE] |
| BTN-ASK-SEND | `Send` | chat/page.tsx:149 [LIVE] |
| BTN-CONTINUE | `Continue onboarding →` | policies/page.tsx:398-399 [LIVE] |
| BTN-OWNER-SELECT | owner `<select>` (Unassigned + roster); rendered only when `can(role,'assignTaskOwners')` | frontend/app/workflow/WorkflowBoard.tsx:14,99-104,296-299 [LIVE-UI] |
| BTN-STATUS-CHECK | task done checkbox (toggles done↔pending via `toggleDone`) | frontend/app/workflow/WorkflowBoard.tsx:126-140,218-224 [LIVE] |

### §1.5 Messaging copy (verbatim)

| Id | Copy (verbatim) | Trace |
|---|---|---|
| MSG-LOGIN-SUB | `Sign in with your Jera account` | (auth)/login/page.tsx:37 [LIVE] |
| MSG-ACK-BADGE | `I have read and understood this policy` + `✓ acknowledged` on tick | policies/page.tsx:377-383 [LIVE] |
| MSG-EXP-SUBMIT | `Expense claim submitted` / `Grand total {rand} sent to finance for approval.` | expenses/page.tsx:479-480 [LIVE] |
| MSG-EXP-INCOMPLETE | `Claim incomplete` / `Complete every line with a value — client/details, and an invoice number on invoiced travel.` | expenses/page.tsx:439,441 [LIVE] |
| MSG-EXP-TIMESHEET | `Timesheet required` / `A copy of your timesheet must accompany this claim form.` | expenses/page.tsx:450-451 [LIVE] |
| MSG-EXP-SLIPS | `Receipt slips required` / `Attach the receipt slips for the expenses you incurred.` | expenses/page.tsx:460-461 [LIVE] |
| MSG-EXP-RATE | `No travel rate on file` / `Add your AA Rate Certificate rates before claiming travel — the per-km rate is missing.` | expenses/page.tsx:470,472 [LIVE] |
| MSG-EXP-GATE | the **single** resolved client-gate failure message: the first failing gate in the locked source order `INCOMPLETE -> TIMESHEET -> SLIPS -> RATE`. Exactly one of {MSG-EXP-INCOMPLETE, MSG-EXP-TIMESHEET, MSG-EXP-SLIPS, MSG-EXP-RATE} fires — whichever gate fails first; the later gates are not evaluated. This id resolves the four-way submit-gate to one value per submission. | expenses/page.tsx:430-473 (gate order: 430-444 incomplete, 446-454 timesheet, 456-464 slips, 466-473 rate) [LIVE] |
| MSG-EXP-APPROVED | `Claim approved` / `{submitter} — {rand}. Submitter notified.` | expenses/page.tsx:1023,1027-1028 [LIVE] |
| MSG-EXP-RETURNED | `Claim returned` / `{submitter}'s claim was sent back for correction.` | expenses/page.tsx:1023,1029 [LIVE] |
| MSG-ASK-DISCLAIMER | `Pulse Assistant uses Jera's HR handbook & payroll rules. For anything binding, confirm with HR ({HR_EMAIL}).` | chat/page.tsx:153-154 [LIVE] |
| MSG-DENY-RLS | RLS no-row outcome: query returns zero rows / a write affects zero rows; the screen renders the unchanged prior view (default-deny is silent at the wire). | GOV §1.1 A1; 002_rls.sql:114-119 [LIVE] |
| MSG-DENY-TRIGGER | the trigger's own `raise exception` text surfaces as a failed-write toast. | 002_rls.sql:87,92,102,328 [LIVE] |
| MSG-ERR-GENERIC | generic write-failure toast — error variant, title `Couldn't save`, body `Something went wrong — your changes were not saved. Try again.` | [TARGET] (seam-swap error surface) |
| MSG-PENDING-SAVING | optimistic pending indicator: the control shows `isLoading`/disabled until the async write resolves. | (auth)/login BTN-SIGNIN `isLoading`; BTN-EXP-SUBMIT [LIVE-UI / TARGET-seam] |

### §1.6 Notification templates (channel + template)

| Id | Channel | Template | Trace |
|---|---|---|---|
| NOTE-ASSIGN | M365 Graph email | task-assigned to new owner: `You have been assigned: {task.title}` | HANDOFF §5.1; GOV §6 `Microsoft Graph email` [TARGET] |
| NOTE-ANNOUNCE | M365 Graph email + in-app `admin_notifications` | Notify-All announcement to the chosen audience | HANDOFF §5.1; 002_rls.sql:272-273 (in-app insert) [in-app LIVE / Graph TARGET] |
| NOTE-CERT-EXPIRY | M365 Graph email | certification-expiry reminder when V-CERT-EXP enters `soon` | HANDOFF §5.1; GOV §3.4 [TARGET] |
| NOTE-EXP-APPROVED | in-app toast (submitter notified) | MSG-EXP-APPROVED body asserts `Submitter notified` | expenses/page.tsx:1027 [toast LIVE / durable notify TARGET] |
| NOTE-NONE-NOEMAIL | (sentinel) | no send wired, none intended | §0 |
| NOTE-NONE-REJECTED | (sentinel) | rejected before any send | §0 |

### §1.7 Error codes (rejection / failure HTTP+UI surfaces)

| Id | Surface | Resolved value | Trace |
|---|---|---|---|
| REJ-RLS | RLS default-deny | wire: zero rows read / zero rows written (no row error raised); UI: MSG-DENY-RLS (prior view unchanged); no toast | GOV §1.1 A1; 002_rls.sql:114-119 [LIVE] |
| REJ-TRIGGER | trigger raise | wire: `raise exception` → 400-class write failure; UI: MSG-DENY-TRIGGER toast; prior row unchanged | 002_rls.sql:87,92,102,328 [LIVE] |
| REJ-PROTECT-OWNER | owner-protection trigger | raise `Only an owner may change role or owner status` / `An owner cannot be demoted by a non-owner` | 002_rls.sql:87,92 [LIVE] |
| REJ-PROTECT-EMP | employment-field trigger | raise `Only an admin may change employment fields (status/manager/expense role/department/title)` | 002_rls.sql:102 [LIVE] |
| REJ-APPROVER | self-approve / non-approver | raise `Only an approver (admin or the team manager) may approve/return a claim` | 002_rls.sql:328 [LIVE] |
| REJ-PAID | non-admin mark-paid | raise (admin-only `paid` branch) | GATE-PAID [TARGET] |
| REJ-EXP-FREEZE | monetary edit after submit | raise (GATE-EXP-FREEZE) | GOV F4 [TARGET] |
| REJ-EXP-ORDER | out-of-sequence expense transition | raise (GATE-EXP-ORDER) | GOV §3.3 [TARGET] |
| REJ-EMP-ORDER | out-of-sequence employee transition | raise (GATE-EMP-ORDER) | GOV §3.1 [TARGET] |
| REJ-ACK-ORDER | ack without prior read | raise (GATE-ACK-DERIVE) | GOV §3.2 [TARGET] |
| REJ-OTS-FREEZE | manager writes a frozen onboarding-task column | raise (GATE-OTS-FREEZE) | GOV §3.6; GOV BLOCKER 2 [TARGET] |
| REJ-OTS-ORDER | out-of-sequence onboarding-task status transition | raise (GATE-OTS-ORDER) | GOV §3.6 [TARGET] |
| REJ-MGR-LINE-DEL | manager deletes a team expense line (the live A7 hole) | raise: after the mandated F3 fix the `_self` FOR-ALL policy's USING+WITH CHECK are self-or-admin only (no manager branch), so a manager DELETE of a team line affects zero rows (REJ-RLS class); at HEAD the `_all` USING carries the manager-team branch and the DELETE succeeds — the defect this row certifies closed | GOV §1.3 F3; 002_rls.sql:254,256-257 [TARGET — fix; HEAD-hole LIVE] |
| REJ-CLIENT-GUARD | client-side validation block (no write attempted) | the matching MSG-EXP-* error toast; `showErrors` set; no network call | expenses/page.tsx:438-471 [LIVE] |
| REJ-UI-HIDDEN | capability-gated control absent | the control is not rendered (`can()` false); no action surface exists | capabilities.ts:71; GOV §1.3 [LIVE-UI] |
| P-PHONE | work-directory phone exposure mechanism | masked view / column move so a manager read of `employees.phone` is suppressed | GOV M5 / F8; 002_rls.sql:128-129 [TARGET — B0.5] |

### §1.8 Data-write ids (DAT-* — exact field + value targets)

| Id | Table.field(s) | Resolved write | Trace |
|---|---|---|---|
| DAT-EMP-SELF | `employees` work fields (self) | self updates own work-directory row | 002_rls.sql:132-134 [LIVE] |
| DAT-EMP-EMPLOY | `employees.{status,manager_id,expense_role,department,job_title}` | admin/owner only | 002_rls.sql:96-104 [LIVE] |
| DAT-EMP-ROLE | `employees.{role,is_owner}` | owner only | 002_rls.sql:84-93 [LIVE] |
| DAT-POPIA-SELF | POPIA satellites (`employee_personal_info`, `employee_medical_info`, `employee_tax_banking`), `emergency_contacts`, `aa_rate_certificates` | self or admin/owner write (GATE-SELF-OR-ADMIN) | 002_rls.sql:137-161,262-264 [LIVE] |
| DAT-CONTRACT | `contract_uploads` (write) | admin/owner only (GATE-ADMIN) | 002_rls.sql:200-201 [LIVE] |
| DAT-ONB-TASK-STATUS | `onboarding_task_status.{status,started_at,completed_at,completed_by}` | admin/owner all; manager on team work-phase rows (allowlist) | 002_rls.sql:187-188 (admin); GATE-MGR-OTS + GATE-OTS-FREEZE (manager) [LIVE-admin / TARGET-manager] |
| DAT-ONB-ASSIGN | `onboarding_task_status.assigned_to` | admin/owner only | 002_rls.sql:187-188; GOV BLOCKER 2 (manager forced NULL) [LIVE-admin / TARGET-freeze] |
| DAT-ONB-WF | `onboarding_workflows` insert | admin/owner all; manager on team (GATE-MGR-WF) | 002_rls.sql:173-174 (admin); `wf_manager_ins` (manager) [LIVE-admin / TARGET-manager] |
| DAT-POLICY-PUBLISH | `hr_policies.version` (publish) | admin/owner only | 002_rls.sql:205 [LIVE] |
| DAT-ACK | `hr_policy_acknowledgements.{acknowledged,read_started_at,acknowledged_at}` | self or admin/owner | 002_rls.sql:210-214 [LIVE] |
| DAT-ACK-EVENT | `hr_policy_ack_events` insert (append-only) | self or admin/owner insert; no update/delete | 002_rls.sql:216-219 [LIVE] |
| DAT-ACK-RESET | ack-reset on publish | `AFTER UPDATE OF version ON hr_policies` trigger sets `acknowledged=false, read_started_at=NULL, acknowledged_at=NULL` for affected rows; recompute DAT-POL-DONE | GOV §3.2 F5 [TARGET] |
| DAT-POL-DONE | `employees.policies_completed` | trigger-derived: `NOT EXISTS (an is_active policy with no acknowledged ack)` | GOV §3.2 / §4 F6; 001_schema.sql:71 [TARGET-derivation] |
| DAT-EXP-INSERT | `expense_claims` insert | submitter (self) only | 002_rls.sql:234-235 [LIVE] |
| DAT-EXP-TRANSITION | `expense_claims.{status,reviewed_by,reviewed_at,review_notes,approver_id}` | approver transition via GATE-APPROVER | 002_rls.sql:324-329 [LIVE] |
| DAT-EXP-RESUBMIT | `expense_claims.{status,submitted_at}` | submitter (self) re-submit of a `returned` claim: `status='submitted'`, `submitted_at` refreshed; the `returned` predecessor is exempt from GATE-EXP-FREEZE so monetary fields are editable on this edge | 002_rls.sql:234-241 (self update); GATE-EXP-FREEZE `returned` exemption (GOV F4 / §1.3) [LIVE-actor / TARGET-order] |
| DAT-EXP-PAID | `expense_claims.status='paid'` | admin/owner only (GATE-PAID) | GOV §1.2 paid row [TARGET] |
| DAT-EXP-LINE | `expense_travel_lines` / `expense_other_lines` / `expense_advance_lines` | self or admin/owner write; manager SELECT-only | 002_rls.sql:246-260 (do-block 246-260; template body 252-257); GOV §1.3 F3 split (`_sel`/`_self`) [LIVE-read / TARGET-write-split] |
| DAT-CERT-OWN | `certifications` (own) | self or admin/owner | 002_rls.sql:309-315 [LIVE] |
| DAT-CERT-ANY | `certifications` (others) | admin/owner only | 002_rls.sql:310 (`pulse_is_admin()` branch) [LIVE] |
| DAT-TRAIN-SELF | `training_status` / `training_progress` self write | self or admin/owner (`ts_self`/`tp_self`) | 002_rls.sql:294-296,300-302 [LIVE] |
| DAT-TRAIN-READ | `training_status` / `training_progress` read scope | self + admin + team-manager (replace the `pulse_is_staff()` disjunct) | 002_rls.sql:292-293,298-299; GOV BLOCKER 1 [TARGET — RLS currently org-wide] |
| DAT-DOC | `documents` insert/delete | admin/owner only | 002_rls.sql:277-278 [LIVE] |
| DAT-NOTIFY | `admin_notifications` insert | admin/owner only | 002_rls.sql:272-273 [LIVE] |
| DAT-MSG | `messages` insert (self) / delete (admin) | author self insert; admin/owner may delete others (`for all`) | 002_rls.sql:268-270 [LIVE] |
| DAT-AUDIT | `audit_log` insert | self-attributed or admin; no update/delete | 002_rls.sql:284-286 [LIVE] |
| DAT-FORM | `onboarding_form_completions` insert/update (incl. POPIA tax/banking form) | self or admin/owner (`forms_self`, GATE-SELF-OR-ADMIN) | 002_rls.sql:191-193 [LIVE] |
| DAT-GOALS | `employee_goals` insert/update | self or admin/owner (`goals_self`, GATE-SELF-OR-ADMIN) | 002_rls.sql:194-196 [LIVE] |
| DAT-SOPC | `sop_completions` insert/update | self or admin/owner (`sopc_self`, GATE-SELF-OR-ADMIN) | 002_rls.sql:226-228 [LIVE] |
| DAT-DOCACK | `document_acknowledgements` insert/update | self or admin/owner (`docack_self`, GATE-SELF-OR-ADMIN) | 002_rls.sql:279-281 [LIVE] |
| DAT-EMAILLOG | `email_log` insert (send-outcome record; one row per Graph send, success or failure) | admin/system only (`email_admin`, GATE-ADMIN) | 002_rls.sql:275 [LIVE-policy / TARGET-Graph-writes] |
| DAT-ACKEV-INS | `hr_policy_ack_events` insert (append-only evidence) | self or admin/owner (`ackev_ins`, GATE-SELF-OR-ADMIN); no update/delete policy → mutation denied | 002_rls.sql:216-219 [LIVE] |
| DAT-EXP-LINE-SELF | `expense_travel_lines`/`expense_other_lines`/`expense_advance_lines` insert/update/delete | self or admin/owner only via the mandated F3 `_self` FOR-ALL policy (USING + WITH CHECK self-or-admin, no manager branch) | 002_rls.sql:246-260; GOV §1.3 F3 [LIVE-self-write / TARGET-split] |
| DAT-MSG-DEL-ADMIN | `messages` delete of another author's row | admin/owner only (the `msg_self` `for all` USING `author_id=self or pulse_is_admin()`; M7 admin-delete-others reach) | 002_rls.sql:268-270 [LIVE] |
| DAT-CONTRACT-DEL | `contract_uploads` delete | admin/owner only (`contract_admin` FOR ALL, GATE-ADMIN); rows are `ON DELETE RESTRICT`-protected as FK targets where applicable; owner-protection (A8/A3) keeps employee rows undeletable by non-owners | 002_rls.sql:200-201; 001_schema.sql ON DELETE RESTRICT [LIVE] |
| DAT-FILE-REF | the SharePoint item reference stored by the originating DAT-* write (the `file_url`/`file_ref`/`document_url` column owned by whichever row persists the file metadata — e.g. DAT-CERT-OWN, DAT-CERT-ANY, DAT-DOC, DAT-CONTRACT, DAT-POPIA-SELF AA-cert) | the stored reference is the item id/URL returned by SharePoint on confirmed upload; it is written only by the originating DAT-* row's own policy, never as a standalone write | GOV §6 `SharePoint / OneDrive storage` [TARGET] |

### §1.9 Transition edges (P-ORDER references into GOV statecharts)

| Id | Edge | Trace |
|---|---|---|
| T-EMP-0 | `creation --route_new_hire[admin]--> onboarding` (the creation→initial-state edge: routing a new hire to `onboarding` on row creation; the column default is `active`, so this routing is owed). This edge is the GOV §3.1 *separate* creation→initial-state TARGET, carved OUT of the §3.1 pair statechart (which assumes a created row); it is not a `(old.status,new.status)` transition and is not enforced by GATE-EMP-ORDER. | GOV §3.1 `initial:` note + creation→initial-state caption; 001_schema.sql:62 (default `active`) [TARGET] |
| T-EMP-1 | `onboarding --complete_onboarding[admin]--> probation` | GOV §3.1 [TARGET] |
| T-EMP-2 | `probation --confirm[admin]--> active` | GOV §3.1 [TARGET] |
| T-EMP-3 | `active --suspend[admin]--> suspended` | GOV §3.1 [TARGET] |
| T-EMP-4 | `suspended --reinstate[admin]--> active` | GOV §3.1 [TARGET] |
| T-EMP-5 | `{onboarding,probation,active,suspended} --terminate[admin]--> terminated` | GOV §3.1 [TARGET] |
| T-EXP-1 | `draft --submit[self]--> submitted` | GOV §3.3 [LIVE-actor / TARGET-order] |
| T-EXP-2 | `submitted --approve[approver]--> approved` | GOV §3.3; 002_rls.sql:324-329 [LIVE] |
| T-EXP-3 | `submitted --return[approver]--> returned` | GOV §3.3; 002_rls.sql:324-329 [LIVE] |
| T-EXP-4 | `returned --resubmit[self]--> submitted` | GOV §3.3 [TARGET-order] |
| T-EXP-5 | `approved --mark_paid[admin]--> paid` | GOV §3.3; GATE-PAID [TARGET] |
| T-ACK-1 | `unacknowledged --read_started--> reading` | GOV §3.2 [TARGET] |
| T-ACK-2 | `reading --acknowledge[self/admin]--> acknowledged` | GOV §3.2 [TARGET-order; ack write LIVE] |
| T-ACK-3 | `* --publish_new_version[admin]--> unacknowledged` (reset; self-loop legal from unacknowledged) | GOV §3.2 [TARGET] |
| T-OTS-1 | `pending --start[admin\|mgr-team-workphase]--> inprogress` (entry: `started_at:=now()`) | GOV §3.6 [TARGET-order] |
| T-OTS-2 | `inprogress --complete[admin\|mgr-team-workphase]--> done` (entry: `completed_at:=now(), completed_by:=actor`) | GOV §3.6 [TARGET-order] |
| T-OTS-3 | `pending --complete[admin\|mgr-team-workphase]--> done` (direct-tick fast path; entry: `completed_at:=now(), completed_by:=actor`) | GOV §3.6 [TARGET-order] |
| T-OTS-4 | `done --reopen[admin\|mgr-team-workphase]--> inprogress` (exit: clear `completed_at/completed_by`) | GOV §3.6 [TARGET-order] |
| T-OTS-5 | `inprogress --reset[admin\|mgr-team-workphase]--> pending` (exit: clear `started_at/completed_at/completed_by`) | GOV §3.6 [TARGET-order] |
| T-OTS-6 | `done --reset[admin\|mgr-team-workphase]--> pending` (exit: clear `started_at/completed_at/completed_by`) | GOV §3.6 [TARGET-order] |
| P-OTS-EDGE | the **single resolved** GOV §3.6 edge selected by the `(old.status,new.status)` pair via GATE-OTS-ORDER (the §3.6 table resolves exactly one of T-OTS-1…6 per write). The matrix references this selector for any task-status action; `assigned_to` writes route through DAT-ONB-ASSIGN, never this edge. | GOV §3.6 [TARGET-order] |
| P-ORDER | the GOV §3.1/§3.3/§3.2/§3.6 transition tables are the single source; ordering enforced by GATE-EMP-ORDER / GATE-EXP-ORDER / GATE-ACK-DERIVE / GATE-OTS-ORDER | GOV §3.1,§3.3,§3.2,§3.6 [TARGET] |

### §1.10 Constants (named magnitudes)

| Id | Concept | Resolved value | Trace |
|---|---|---|---|
| V-ONB-TASKSET | the generated standard onboarding task set produced when a new starter is scheduled | 30 tasks across 5 phases | GOV §3.6 (onboarding_task_status / onboarding_tasks); HANDOFF §2 onboarding [TARGET] |

---

## §2 Alias-fold rule (resolves the F1 A4-vs-B1a inconsistency)

**One rule, applied everywhere.** When two distinct rows resolve to an identical
11-facet outcome, the matrix lists **every distinct row** and marks the duplicate
explicitly with `ALIAS-OF <row-id>` in facet 1; the remaining facets are not
re-stated. An alias row is **never silently folded away** (the prior A4-drop
defect) and **never partially listed** (the prior B1a.11 over-list defect). The
coverage ledger (§4) counts an alias row once, under its canonical row, and names
the alias rows it subsumes. This rule governs the M365 block (A-rows) and the
directory block (B-rows) identically.

---

## §3 OUTCOME MATRIX

Cell format: `N <facet-value>` where N is the facet number 1–11 and the value is
a §1 id (or §0 sentinel). GWT is the executable acceptance test for the row.

### §3.A — M365 sign-in → identity resolution → role

> Block maturity: **MAT-TARGET** for identity→role resolution (M365 SSO is GOV §6
> `plan:103`). The login **screen** is LIVE (BTN-SIGNIN), so the UI facets are
> MAT-LIVE-UI-TARGET-SEAM.

**A1 — Authorized: known M365 user with an `employees` row.**
- 1 user submits M365 credentials at the login screen.
- 2 client: MSG-PENDING-SAVING on BTN-SIGNIN until the identity round-trip resolves.
- 3 V-0.
- 4 login screen → on success redirect to `/dashboard`; sidebar renders the role label (GOV §6 `roleLabel`).
- 5 MSG-LOGIN-SUB.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-NONE (session binds `auth.uid()` → `employees.auth_user_id`; `pulse_role()`/`pulse_is_owner()` resolve from the row — read-only, no write to employees).
- 8 SCH-NONE.
- 9 V-0.
- 10 on resolution failure mid-flow: MSG-ERR-GENERIC; session not established; prior logged-out view unchanged.
- 11 while the round-trip is in flight: MSG-PENDING-SAVING; no role decided until it resolves.
- **GWT:** Given a M365 user whose token maps to an `employees.auth_user_id`, When they complete sign-in, Then a session is established, `pulse_role()` returns that row's role, and they land on `/dashboard` (no `employees` write).

**A2 — Rejection: authenticated M365 user with NO `employees` row (fail-closed).**
- 1 user signs in with a valid M365 identity absent from `employees`.
- 2 client: MSG-PENDING-SAVING, then returned to the logged-out form.
- 3 V-0.
- 4 login screen remains; no app chrome.
- 5 MSG-ERR-GENERIC (no role could be resolved).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE (`pulse_current_employee()` is NULL so every RLS predicate is false).
- 8 SCH-NONE.
- 9 REJ-RLS — fail-closed: with no employee row, default-deny yields zero readable rows; the user cannot enter the app.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a valid M365 token with no matching `employees` row, When sign-in completes, Then `pulse_current_employee()` is NULL, all base-table reads return zero rows (REJ-RLS), and the user is not admitted.

**A3 — Rejection: invalid / unknown M365 credentials.**
- 1 user submits credentials M365 rejects.
- 2 client: MSG-PENDING-SAVING, then the form is re-enabled.
- 3 V-0.
- 4 login screen remains.
- 5 MSG-ERR-GENERIC.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — no session is created (authN failed upstream of Pulse authorization).
- 10 V-0.
- 11 V-0.
- **GWT:** Given credentials M365 rejects, When the user submits, Then no Pulse session is created and the login screen re-renders with MSG-ERR-GENERIC.

**A4 — Timeout / async-pending: M365 / Graph identity endpoint does not respond. (ALIAS-OF A3 for the post-timeout terminal facets.)**
- 1 ALIAS-OF A3 — user submits credentials; the identity provider is unreachable or slow.
- 2 client: MSG-PENDING-SAVING held; BTN-SIGNIN stays disabled.
- 3 V-0.
- 4 login screen with the pending control (post-timeout: ALIAS-OF A3).
- 5 MSG-PENDING-SAVING (post-timeout: ALIAS-OF A3 → MSG-ERR-GENERIC).
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-NONE (ALIAS-OF A3).
- 8 SCH-NONE (ALIAS-OF A3).
- 9 V-0 (post-timeout: ALIAS-OF A3 → REJ-RLS, no session).
- 10 on timeout expiry the path resolves to A3's surface: MSG-ERR-GENERIC; form re-enabled; no session.
- 11 the defining facet: while in flight the app is not entered and no role is decided; on timeout it collapses to facet 10.
- **GWT:** Given the identity endpoint does not respond within the timeout, When the user waits, Then BTN-SIGNIN stays in MSG-PENDING-SAVING until timeout, after which the row resolves identically to A3 (ALIAS-OF A3 per §2).

### §3.B — Employees / directory (read/write under RLS)

> Block maturity (per-cell, not blanket — C9): the directory **reads** (B1) and the
> **non-status** employment writes/rejections (B2-fields, B2-reject, B5) are
> **MAT-LIVE** (the policies and protection triggers exist at HEAD). B1a's
> masked-phone fix is **MAT-TARGET** (P-PHONE). The **employee-status table**
> (B-EMP-1…8 and B-EMP-X01…X13) is **MAT-TARGET**: its facet-8 T-EMP edges and its
> facet-9 GATE-EMP-ORDER / REJ-EMP-ORDER are the §3.1 ordering machine, which is
> `[TARGET — to build]` (the enum is bare at HEAD; only *who* may write `status` is
> LIVE-enforced, not *what order*). This header does **not** claim MAT-LIVE for any
> cell that references TARGET ordering.

**B1 — Authorized: any role reads the work directory.**
- 1 actor opens Directory (`/people`).
- 2 client: roster renders from the seam.
- 3 V-0.
- 4 directory list; search box; no POPIA columns.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 V-0.
- 10 on read failure: MSG-ERR-GENERIC; empty list; no partial render.
- 11 MSG-PENDING-SAVING list skeleton until the read resolves.
- **GWT:** Given any authenticated role, When they open `/people`, Then `emp_select` (GATE-TRUE) returns the work directory and no POPIA satellite column is present.

**B1a — Rejection (owed): manager reads `employees.phone` of a non-team member.**
- 1 manager views a non-team employee's directory entry expecting the phone column.
- 2 client: the directory row renders without a phone value.
- 3 V-0.
- 4 directory entry with the phone field masked/absent.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — resolved through the P-PHONE mechanism: the masked-view / column-move suppresses `employees.phone` from the manager projection so the value is never returned.
- 10 V-0.
- 11 V-0.
- **HEAD note:** at HEAD `emp_select` is GATE-TRUE and `phone` leaks org-wide (GOV M5); P-PHONE is the owed fix that makes facet 9 hold.
- **GWT:** Given P-PHONE is built, When a manager reads a non-team employee's directory entry, Then `employees.phone` is not in the returned projection (REJ-RLS via P-PHONE); at HEAD this assertion fails because `emp_select` is GATE-TRUE.

#### B-EMP — admin/owner sets `employees.status`: the pair-keyed employee-status table (C2)

> Per the full-totality mandate the prior single "B2-status" selector row is
> expanded into **one row per resolved outcome** over the `(old.status,
> new.status)` **pair** space. Because the LIVE write path carries no event token
> (`setTaskStatus`/status writes pass no event), the status model keys on the
> `(old, new)` **pair**, not on `(old, event, new)` triples. States =
> V-EMP-STATUS members `{onboarding, probation, active, suspended, terminated}`.
> The **8 legal pairs** are authorized rows B-EMP-1…8 (facet 8 = the one resolved
> T-EMP edge; facet 9 = V-0). The **13 distinct illegal pairs** are rejection rows
> B-EMP-X01…X13 (facet 8 = SCH-NONE; facet 9 = REJ-EMP-ORDER). Actor for every
> cell is admin/owner (a non-admin status write is the distinct REJ-PROTECT-EMP
> path, row B2-reject). The §3.1 enforcement vehicle is GATE-EMP-ORDER (a
> `BEFORE UPDATE` trigger rejecting any pair absent from the §3.1 table).
>
> **Cell map (from \ to → resolution row; a pair that no edge reaches is still an
> illegal pair the gate rejects):**
>
> | from \ to | onboarding | probation | active | suspended | terminated |
> |---|---|---|---|---|---|
> | **onboarding** | X03 | B-EMP-1 | X01 | X02 | B-EMP-2 |
> | **probation** | — | X04 | B-EMP-3 | X05 | B-EMP-4 |
> | **active** | — | X07 | X08 | B-EMP-5 | B-EMP-6 |
> | **suspended** | — | X10 | B-EMP-7 | X12 | B-EMP-8 |
> | **terminated** | — | X13 | X14 | X15 | X17 |
>
> Cells marked `—` (`probation→onboarding`, `active→onboarding`,
> `suspended→onboarding`, `terminated→onboarding`) are illegal pairs outside the
> enumerated rejection set: no event in the prior event-keyed enumeration reached
> them, so they were never assigned an X-id; GATE-EMP-ORDER still rejects them as
> pairs absent from the §3.1 table. The 13 X-ids above are the enumerated distinct
> illegal pairs B-EMP-X01…X13 covers.

**B-EMP-1 — Authorized: admin completes onboarding (`onboarding`→`probation`).**
- 1 admin sets status `onboarding`→`probation` (complete_onboarding).
- 2 client: the row reflects `probation`.
- 3 V-0.
- 4 All Employees roster with the `probation` status badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-1.
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `onboarding`.
- 11 MSG-PENDING-SAVING on the control until the write resolves.
- **GWT:** Given an admin and an `onboarding` employee, When complete_onboarding fires, Then DAT-EMP-EMPLOY writes `probation` and T-EMP-1 records.

**B-EMP-2 — Authorized: admin terminates from onboarding (`onboarding`→`terminated`).**
- 1 admin sets status `onboarding`→`terminated`.
- 2 client: the row reflects `terminated`.
- 3 V-0.
- 4 roster with the `terminated` badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-5 (onboarding branch).
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `onboarding`.
- 11 MSG-PENDING-SAVING.
- **GWT:** Given an `onboarding` employee, When terminate fires, Then DAT-EMP-EMPLOY writes `terminated` (T-EMP-5); the row is never deleted (A8).

**B-EMP-3 — Authorized: admin confirms probation (`probation`→`active`).**
- 1 admin sets status `probation`→`active` (confirm).
- 2 client: the row reflects `active`.
- 3 V-0.
- 4 roster with the `active` badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-2.
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `probation`.
- 11 MSG-PENDING-SAVING.
- **GWT:** Given a `probation` employee, When confirm fires, Then DAT-EMP-EMPLOY writes `active` and T-EMP-2 records.

**B-EMP-4 — Authorized: admin terminates from probation (`probation`→`terminated`).**
- 1 admin sets status `probation`→`terminated`.
- 2 client: the row reflects `terminated`.
- 3 V-0.
- 4 roster with the `terminated` badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-5 (probation branch).
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `probation`.
- 11 MSG-PENDING-SAVING.
- **GWT:** Given a `probation` employee, When terminate fires, Then DAT-EMP-EMPLOY writes `terminated` (T-EMP-5).

**B-EMP-5 — Authorized: admin suspends an active employee (`active`→`suspended`).**
- 1 admin sets status `active`→`suspended` (suspend).
- 2 client: the row reflects `suspended`.
- 3 V-0.
- 4 roster with the `suspended` badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-3.
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `active`.
- 11 MSG-PENDING-SAVING.
- **GWT:** Given an `active` employee, When suspend fires, Then DAT-EMP-EMPLOY writes `suspended` and T-EMP-3 records.

**B-EMP-6 — Authorized: admin terminates an active employee (`active`→`terminated`).**
- 1 admin sets status `active`→`terminated`.
- 2 client: the row reflects `terminated`.
- 3 V-0.
- 4 roster with the `terminated` badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-5 (active branch).
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `active`.
- 11 MSG-PENDING-SAVING.
- **GWT:** Given an `active` employee, When terminate fires, Then DAT-EMP-EMPLOY writes `terminated` (T-EMP-5).

**B-EMP-7 — Authorized: admin reinstates a suspended employee (`suspended`→`active`).**
- 1 admin sets status `suspended`→`active` (reinstate).
- 2 client: the row reflects `active`.
- 3 V-0.
- 4 roster with the `active` badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-4 (deterministic `suspended`→`active`; GOV §3.1 BLOCKER 5c).
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `suspended`.
- 11 MSG-PENDING-SAVING.
- **GWT:** Given a `suspended` employee, When reinstate fires, Then DAT-EMP-EMPLOY writes `active` (T-EMP-4, deterministic target).

**B-EMP-8 — Authorized: admin terminates a suspended employee (`suspended`→`terminated`).**
- 1 admin sets status `suspended`→`terminated`.
- 2 client: the row reflects `terminated`.
- 3 V-0.
- 4 roster with the `terminated` badge.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (`status`).
- 8 T-EMP-5 (suspended branch).
- 9 V-0.
- 10 MSG-ERR-GENERIC; status stays `suspended`.
- 11 MSG-PENDING-SAVING.
- **GWT:** Given a `suspended` employee, When terminate fires, Then DAT-EMP-EMPLOY writes `terminated` (T-EMP-5).

**B-EMP-X01…X13 — Rejection: every illegal `(old.status,new.status)` admin status write (the 13 distinct illegal §3.1 pairs).**
This single rejection row enumerates all 13 **distinct illegal pairs**; each
carries the identical 11-facet outcome below, differing only in the named
`(old→new)` pair. Because the LIVE write path carries no event token, the model
keys on the `(old.status,new.status)` pair alone: a pair that *some* event would
reach legally is not an illegal cell (it is the legal pair), and a pair listed
twice under two events is one pair. The distinct illegal pairs are: **X01**
`onboarding→active` (skip-ahead, bypasses probation) · **X02**
`onboarding→suspended` (suspend illegal off non-active) · **X03**
`onboarding→onboarding` (self-loop) · **X04** `probation→probation` (self-loop) ·
**X05** `probation→suspended` (suspend illegal off non-active) · **X07**
`active→probation` (no backward move) · **X08** `active→active` (self-loop) ·
**X10** `suspended→probation` · **X12** `suspended→suspended` (self-loop) ·
**X13** `terminated→probation` (resurrection) · **X14** `terminated→active`
(resurrection) · **X15** `terminated→suspended` (resurrection) · **X17**
`terminated→terminated` (terminal; self-loop). The pairs `probation→active`
(former X06) and `suspended→active` (former X11) are **LEGAL** (GOV §3.1, confirm
/ B-EMP-3 and reinstate / B-EMP-7) and are not illegal cells; the former X09
(`active→active`) and X16 (`terminated→active`) are the same pairs as X08 and X14
and collapse into them.
- 1 admin attempts the named illegal `(old→new)` status pair.
- 2 client: no roster control composes an out-of-sequence jump; a forged write fails.
- 3 V-0.
- 4 All Employees roster; the status badge unchanged.
- 5 MSG-DENY-TRIGGER (REJ-EMP-ORDER).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-EMP-ORDER — GATE-EMP-ORDER rejects the pair absent from the GOV §3.1 table; status unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given an admin and any of the 13 distinct illegal pairs (e.g. X01 `onboarding→active`, X14 `terminated→active`), When the write is attempted, Then GATE-EMP-ORDER raises REJ-EMP-ORDER and status is unchanged; the §3.1 cell stays blank (unrepresentable).

**B2-fields — Authorized: admin/owner sets a non-status employment field (`manager_id`/`expense_role`/`department`/`job_title`).**
- 1 admin edits a non-status employment field.
- 2 client: the field reflects the new value.
- 3 V-0.
- 4 employees screen with the updated field.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EMP-EMPLOY (the non-status field).
- 8 SCH-NONE.
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; field unchanged.
- 11 MSG-PENDING-SAVING until resolved.
- **GWT:** Given an admin editing `department` (or `manager_id`/`expense_role`/`job_title`), When they save, Then DAT-EMP-EMPLOY writes and SCH-NONE (no status transition occurs).

**B2-reject — Rejection: non-admin self-promotes an employment field.**
- 1 employee/manager attempts to change own `status`/`manager_id`/`expense_role`/`department`/`job_title`.
- 2 client: the control is absent (REJ-UI-HIDDEN) or the save round-trips to a failure.
- 3 V-0.
- 4 employees/profile screen, employment fields read-only for the actor.
- 5 MSG-DENY-TRIGGER (REJ-PROTECT-EMP).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-PROTECT-EMP — the employment-field trigger raises; the row's employment fields stay unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a non-admin, When they attempt to set their own `expense_role`, Then `protect_privileged_employee_changes` raises REJ-PROTECT-EMP and the field is unchanged.

**B5 — Rejection: non-owner changes `role`/`is_owner` or demotes an owner.**
- 1 admin (non-owner) attempts to grant admin or demote the owner.
- 2 client: the control is absent for a non-owner (REJ-UI-HIDDEN) or the save fails.
- 3 V-0.
- 4 employees screen; role control owner-gated.
- 5 MSG-DENY-TRIGGER (REJ-PROTECT-OWNER).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-PROTECT-OWNER — the owner-protection trigger raises; `role`/`is_owner` unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a non-owner admin, When they try to set another row's `role='admin'` or demote `is_owner`, Then the protection trigger raises REJ-PROTECT-OWNER and `role`/`is_owner` are unchanged.

### §3.C — Onboarding tasks (manager team-scope + assigned_to freeze)

> Block maturity (per-cell — C9): the **read** scope (GATE-MGR-OTS) and the
> **admin/owner** write (DAT-ONB-TASK-STATUS, DAT-ONB-ASSIGN) are **MAT-LIVE**.
> The **status ordering** (P-OTS-EDGE / GATE-OTS-ORDER, GOV §3.6) and the
> **manager** write surface (GATE-MGR-OTS, GATE-OTS-FREEZE, REJ-OTS-FREEZE,
> REJ-OTS-ORDER) are **MAT-TARGET**. Per C3 the status action and the assign
> action are **separate rows** (no dual-value facet-8 cell): a status write
> resolves to exactly one GOV §3.6 edge via P-OTS-EDGE; an assign write resolves to
> SCH-NONE (`assigned_to` has no statechart).

**C1-status — Authorized: admin/owner sets a task status (one resolved §3.6 edge).**
- 1 admin toggles BTN-STATUS-CHECK on a task.
- 2 client: WorkflowBoard reflects the new status.
- 3 V-0.
- 4 WorkflowBoard with BTN-STATUS-CHECK (admin sees all phases incl. `hr`).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-ONB-TASK-STATUS (allowlist: `status, started_at, completed_at, completed_by`).
- 8 P-OTS-EDGE (the single GOV §3.6 edge selected by the `(old.status,new.status)` pair via GATE-OTS-ORDER).
- 9 V-0 (a legal §3.6 pair; the illegal-pair path is the dedicated rejection row C8-order).
- 10 on write failure: MSG-ERR-GENERIC; status unchanged; transaction rolled back.
- 11 MSG-PENDING-SAVING on the control until the write commits.
- **GWT:** Given an admin and a legal `(old.status,new.status)` pair, When they toggle status, Then DAT-ONB-TASK-STATUS writes and the one P-OTS-EDGE fires; an illegal pair is the C8-order rejection row (REJ-OTS-ORDER).

**C1-assign — Authorized: admin/owner assigns a task owner (`assigned_to`; no statechart).**
- 1 admin picks BTN-OWNER-SELECT for a task.
- 2 client: WorkflowBoard reflects the owner.
- 3 V-0.
- 4 WorkflowBoard with BTN-OWNER-SELECT (admin-only; REJ-UI-HIDDEN for managers).
- 5 V-0.
- 6 NOTE-ASSIGN to the new owner.
- 7 DAT-ONB-ASSIGN.
- 8 SCH-NONE.
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; owner unchanged.
- 11 MSG-PENDING-SAVING on the control; NOTE-ASSIGN fires only after the write commits.
- **GWT:** Given an admin, When they pick an owner, Then DAT-ONB-ASSIGN writes, SCH-NONE (no status transition), and NOTE-ASSIGN sends to the new owner.

**C2 — Authorized: manager sets `status` on a team member's work-phase task (one resolved §3.6 edge).**
- 1 manager toggles BTN-STATUS-CHECK on a qualifying team task.
- 2 client: board reflects the status.
- 3 V-0.
- 4 WorkflowBoard scoped to GATE-MGR-OTS rows; BTN-OWNER-SELECT absent (REJ-UI-HIDDEN); `hr`-phase + `manager_hidden` tasks not shown.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-ONB-TASK-STATUS (allowlist only, GATE-OTS-FREEZE-enforced).
- 8 P-OTS-EDGE (one resolved GOV §3.6 edge via GATE-OTS-ORDER).
- 9 V-0 (a legal §3.6 pair; the illegal-pair path is the dedicated rejection row C8-order).
- 10 on write failure: MSG-ERR-GENERIC; status unchanged; transaction rolled back.
- 11 MSG-PENDING-SAVING on the control until resolved.
- **GWT:** Given a manager and a team member's non-`hr`, non-`manager_hidden` task and a legal §3.6 pair, When they set status, Then GATE-MGR-OTS admits, DAT-ONB-TASK-STATUS writes only the allowlist columns, and the one P-OTS-EDGE fires; an illegal pair is the C8-order rejection row (REJ-OTS-ORDER).

**C3 — Rejection: manager sets status on an `hr`-phase / `manager_hidden` task or a non-team employee's task.**
- 1 manager attempts a status write on a hidden/HR/non-team task.
- 2 client: the row is not rendered (REJ-UI-HIDDEN) or the write fails.
- 3 V-0.
- 4 WorkflowBoard with those rows absent.
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — GATE-MGR-OTS excludes the row; zero rows updated.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager, When they attempt a status write on a `phase_id='hr'` or `manager_hidden` task, Then GATE-MGR-OTS excludes it and zero rows are updated (REJ-RLS).

**C4 — Rejection: manager sets/changes `assigned_to` (assign owners is admin-only).**
- 1 manager attempts to set or re-point `assigned_to` on an otherwise-qualifying team work-phase row.
- 2 client: BTN-OWNER-SELECT absent (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 WorkflowBoard without BTN-OWNER-SELECT for the manager.
- 5 MSG-DENY-TRIGGER (REJ-OTS-FREEZE).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE (no write to `assigned_to`).
- 8 SCH-NONE.
- 9 REJ-OTS-FREEZE — GATE-OTS-FREEZE raises (INSERT arm forces `assigned_to` NULL; UPDATE arm raises on `assigned_to` distinct); `assigned_to` unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager and a qualifying team row, When they attempt to write `assigned_to`, Then GATE-OTS-FREEZE raises REJ-OTS-FREEZE and `assigned_to` is unchanged.

**C5 — Rejection: manager re-points `task_id`/`workflow_id` on a qualifying row.**
- 1 manager attempts to mutate `task_id` or `workflow_id`.
- 2 client: no control surfaces this; a forged write fails.
- 3 V-0.
- 4 WorkflowBoard (no re-point control).
- 5 MSG-DENY-TRIGGER (REJ-OTS-FREEZE).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-OTS-FREEZE — the UPDATE arm raises on `task_id`/`workflow_id` distinct; both unchanged.
- 10 on write failure: MSG-ERR-GENERIC; both columns unchanged; transaction rolled back.
- 11 V-0.
- **GWT:** Given a manager, When they attempt to re-point `task_id` or `workflow_id`, Then GATE-OTS-FREEZE raises REJ-OTS-FREEZE and both columns are unchanged.

**C6-admin — Authorized: admin/owner schedules a new starter.**
- 1 admin schedules a new starter via `/admin/onboard`.
- 2 client: the new workflow + task set appears.
- 3 V-ONB-TASKSET is created as the background effect.
- 4 onboarding/schedule screen; admin sees all phases incl. contract/HR-admin.
- 5 V-0.
- 6 NOTE-ASSIGN.
- 7 DAT-ONB-WF insert (+ DAT-ONB-TASK-STATUS rows).
- 8 T-EMP-0.
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; no workflow created; transaction rolled back.
- 11 MSG-PENDING-SAVING until the workflow + task rows commit; NOTE-ASSIGN fires post-commit.
- **GWT:** Given an admin, When they schedule a starter, Then DAT-ONB-WF inserts, the task set generates with owners assigned (NOTE-ASSIGN), and the new hire routes to `onboarding` via T-EMP-0.

**C6-mgr — Authorized: manager schedules a team starter.**
- 1 manager schedules a team starter via the team path.
- 2 client: the new workflow + task set appears.
- 3 V-ONB-TASKSET is created as the background effect.
- 4 onboarding/schedule screen; the manager sees no contract/HR-admin phase (REJ-UI-HIDDEN).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-ONB-WF insert (+ DAT-ONB-TASK-STATUS rows).
- 8 T-EMP-0.
- 9 manager scheduling a non-team starter: REJ-RLS (GATE-MGR-WF excludes; zero rows inserted).
- 10 on write failure: MSG-ERR-GENERIC; no workflow created; transaction rolled back.
- 11 MSG-PENDING-SAVING until the workflow + task rows commit.
- **GWT:** Given a manager for a team member, When they schedule a starter, Then DAT-ONB-WF inserts (GATE-MGR-WF) with no owner assigned (NOTE-NONE-NOEMAIL) and the new hire routes to `onboarding` via T-EMP-0; a non-team starter raises REJ-RLS and no workflow is created.

**C7-emp — Rejection: an employee/onboardee writes `onboarding_task_status`.**
- 1 an employee (incl. the onboardee whose workflow it is) attempts to write an `onboarding_task_status` row (e.g. self-ticking their own onboarding task).
- 2 client: no task-status write control surfaces for an employee (REJ-UI-HIDDEN — the WorkflowBoard is admin/manager-scoped); a forged write fails.
- 3 V-0.
- 4 the onboardee's read-only onboarding view (their own task list visible via the SELECT grant; no status control).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `ots_write` is admin-only and there is no employee/onboardee write branch (`ots_manager_ins`/`ots_manager_upd` admit only managers; GATE-OTS-FREEZE never grants employees), so an employee write matches zero rows; the onboardee retains SELECT via `ots_sel`.
- 10 V-0.
- 11 V-0.
- **GWT:** Given an employee/onboardee, When they attempt to write `onboarding_task_status` (e.g. set their own task `done`), Then `ots_write` (admin-only) and the manager-only INSERT/UPDATE policies match zero rows (REJ-RLS); the onboardee keeps read via `ots_sel` (002_rls.sql:180), and no employee write branch exists (002_rls.sql:187-188).

**C8-order — Rejection: every illegal `(old.status,new.status)` task-status write (the 3 distinct illegal §3.6 pairs).**
This single rejection row enumerates all 3 **distinct illegal pairs** of the GOV
§3.6 status model; each carries the identical 11-facet outcome below, differing
only in the named `(old→new)` pair. Because the LIVE write path is **event-less**
(`WorkflowBoard.tsx:126-147` calls `setTaskStatus(task.id, status)` with no event
token), the model keys on the `(old.status, new.status)` **pair**, not on
`(old, event, new)` triples: a pair that *some* event reaches legally is the
legal pair, not an illegal cell, and a pair listed twice under two events is one
pair. The actor is admin/owner or a qualifying team manager (the same authorized
actor set as C1-status / C2 — illegality here is **ordering**, not authority; the
authority rejections are C3/C4/C5/C7-emp). The §3.6 enforcement vehicle is
GATE-OTS-ORDER (a `BEFORE UPDATE` trigger rejecting any `(old.status,new.status)`
pair absent from the GOV §3.6 table). The 3 distinct illegal pairs are the 3
self-loops: **O2** `pending→pending` (already there — no-op self-loop, not a
transition) · **O3** `inprogress→inprogress` (a task in progress has already
started; not a transition) · **O6** `done→done` (already complete — no self-loop
on complete). The pairs `pending→inprogress` (former O1) and `done→inprogress`
(former O5) are **LEGAL** (GOV §3.6, start / T-OTS-1 and reopen / T-OTS-4 — the
latter is exactly what live advance emits from `done`) and are not illegal cells;
the former O4 (`inprogress→inprogress`) is the same pair as O3 and collapses into
it.
- 1 the admin/owner or qualifying team manager attempts the named illegal `(old→new)` task-status pair.
- 2 client: no WorkflowBoard control composes an out-of-sequence task-status jump; a forged write fails.
- 3 V-0.
- 4 WorkflowBoard; the task-status badge unchanged.
- 5 MSG-DENY-TRIGGER (REJ-OTS-ORDER).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-OTS-ORDER — GATE-OTS-ORDER rejects the pair absent from the GOV §3.6 table; status unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given an admin or qualifying team manager and any of the 3 distinct illegal pairs (the self-loops O2 `pending→pending`, O3 `inprogress→inprogress`, O6 `done→done`), When the write is attempted, Then GATE-OTS-ORDER raises REJ-OTS-ORDER and status is unchanged; the §3.6 cell stays blank (unrepresentable).

### §3.D — Policies (read + acknowledge + publish/reset)

**D1 — Authorized: employee reads a policy and ticks acknowledge (read-before-ack).**
- 1 employee opens a policy and ticks BTN-ACK.
- 2 client: BTN-ACK disabled after tick.
- 3 V-0.
- 4 policy reader with BTN-ACK + BTN-DL-PDF; BTN-EDIT-PUBLISH hidden (REJ-UI-HIDDEN for non-admin).
- 5 MSG-ACK-BADGE.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-ACK (`acknowledged=true`, `acknowledged_at=now()`) + DAT-ACK-EVENT append; DAT-POL-DONE recomputed.
- 8 T-ACK-2 (`reading`→`acknowledged`).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; checkbox reverts; no ack persisted.
- 11 MSG-PENDING-SAVING on the control until the ack + event commit.
- **GWT:** Given an employee who opened the policy (T-ACK-1 set `read_started_at`), When they tick BTN-ACK, Then DAT-ACK + DAT-ACK-EVENT write, T-ACK-2 fires, and DAT-POL-DONE recomputes.

**D1-reject — Rejection: every illegal `(old derived-state, new derived-state)` ack write (the blank §3.2 cells).**
This single rejection row enumerates all illegal cells of the GOV §3.2
derived-state×event table; each carries the identical 11-facet outcome below,
differing only in the named pair. GATE-ACK-DERIVE derives V-ACK-STATE
(`unacknowledged/reading/acknowledged`) on every INSERT/UPDATE and rejects any
pair absent from the §3.2 table, so the full illegal domain is covered, not only
the read-skip. The illegal pairs are: **R1** `unacknowledged × acknowledge`
(attempted `unacknowledged→acknowledged`; the read-skip — a direct ack with
`read_started_at IS NULL`) · **R2** `reading × read_started` (attempted
`reading→reading`; re-starting a read already in progress is not a transition) ·
**R3** `acknowledged × read_started` (attempted `acknowledged→reading`; an
acknowledged policy cannot revert to reading except via the admin
publish_new_version reset) · **R4** `acknowledged × acknowledge` (attempted
`acknowledged→acknowledged`; already acknowledged — no self-loop on the
acknowledge event). The only legal exit from `acknowledged` is the admin
`publish_new_version` reset (T-ACK-3, row D2).
- 1 an ack write arrives whose derived `(old→new)` pair is one of the blank §3.2 cells (e.g. a direct ack with `read_started_at IS NULL`, or a re-acknowledge).
- 2 client: BTN-ACK requires opening the policy first and is disabled after a tick; a forged write fails.
- 3 V-0.
- 4 policy reader with BTN-ACK.
- 5 MSG-DENY-TRIGGER (REJ-ACK-ORDER).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-ACK-ORDER — GATE-ACK-DERIVE derives V-ACK-STATE and rejects the pair absent from the GOV §3.2 table; ack unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given any of the illegal §3.2 pairs (e.g. R1 `read_started_at IS NULL` with an `acknowledged=true` write, or R4 a re-acknowledge of an already-acknowledged row), When the write is attempted, Then GATE-ACK-DERIVE raises REJ-ACK-ORDER and no ack-state transition persists.

**D2 — Authorized: admin publishes a new policy version (resets acks).**
- 1 admin opens BTN-EDIT-PUBLISH and publishes a new version.
- 2 client: MSG-PENDING-SAVING on BTN-EDIT-PUBLISH until the version write + reset commit.
- 3 every affected employee's current ack is reset as the background effect.
- 4 admin policy editor with BTN-EDIT-PUBLISH + BTN-DL-PDF; BTN-ACK hidden for admin (`!isAdmin` gate).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-POLICY-PUBLISH (`version`) → fires DAT-ACK-RESET; DAT-POL-DONE recomputed per employee.
- 8 T-ACK-3 for each affected `(employee×policy)` (→`unacknowledged`); the `unacknowledged`→`unacknowledged` self-loop is the legal idempotent no-op.
- 9 V-0.
- 10 on publish failure: MSG-ERR-GENERIC; version unchanged; acks not reset; DAT-ACK-EVENT evidence untouched (A6).
- 11 MSG-PENDING-SAVING until the version write + reset trigger commit atomically.
- **GWT:** Given an admin publishing `HR001 v2.0`, When the version write commits, Then DAT-ACK-RESET clears every current ack for HR001, prior DAT-ACK-EVENT rows survive (A6), and DAT-POL-DONE re-opens the gate.

**D2-reject — Rejection: non-admin attempts to publish.**
- 1 employee/manager attempts to publish/version a policy.
- 2 client: BTN-EDIT-PUBLISH absent (REJ-UI-HIDDEN).
- 3 V-0.
- 4 policy reader without BTN-EDIT-PUBLISH.
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `pol_admin` (GATE-ADMIN) denies; `version` unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a non-admin, When they attempt to publish a policy version, Then `pol_admin` (GATE-ADMIN) denies the write (REJ-RLS) and `version` is unchanged.

### §3.E — Expenses (submit + approve/return + paid + self-approve rejection + resubmit)

**E1 — Authorized: employee submits a complete claim.**
- 1 employee fills the claim and triggers BTN-EXP-SUBMIT.
- 2 client: the claim shows a Submitted badge.
- 3 the claim enters the approvals queue (`pending_expense_approvals`) as the background effect.
- 4 expense form → submitted view; BTN-EXP-APPROVE/RETURN hidden for the submitter (REJ-UI-HIDDEN).
- 5 MSG-EXP-SUBMIT.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EXP-INSERT / status→`submitted`, `submitted_at=now()`.
- 8 T-EXP-1 (`draft`→`submitted`).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; the claim stays `draft`.
- 11 MSG-PENDING-SAVING on BTN-EXP-SUBMIT until the write commits.
- **GWT:** Given a complete claim with timesheet + slips + rate, When the employee submits, Then status→`submitted` (T-EXP-1), MSG-EXP-SUBMIT shows, and the claim appears in `pending_expense_approvals`.

**E1-reject-client — Rejection: submit blocked by a client-side gate.**
- 1 employee triggers BTN-EXP-SUBMIT with a missing line / timesheet / slip / rate.
- 2 client: `showErrors` set; no network call.
- 3 V-0.
- 4 expense form with the offending field flagged.
- 5 MSG-EXP-GATE (the single first-failing gate in the locked order `INCOMPLETE -> TIMESHEET -> SLIPS -> RATE`).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-CLIENT-GUARD — submission aborted before any write; the claim stays `draft`.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a claim missing its timesheet (and the earlier INCOMPLETE gate passing), When the employee submits, Then REJ-CLIENT-GUARD fires MSG-EXP-GATE resolving to MSG-EXP-TIMESHEET (the first failing gate), no network call is made, and status stays `draft`.

**E2 — Authorized: approver (admin or team manager) approves a submitted claim.**
- 1 approver triggers BTN-EXP-APPROVE.
- 2 client: the claim shows an Approved badge.
- 3 the submitter is notified.
- 4 approvals queue → BTN-EXP-APPROVE + BTN-EXP-RETURN on submitted claims.
- 5 MSG-EXP-APPROVED.
- 6 NOTE-EXP-APPROVED.
- 7 DAT-EXP-TRANSITION (status→`approved`, `reviewed_by`, `reviewed_at`).
- 8 T-EXP-2 (`submitted`→`approved`).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; status stays `submitted`.
- 11 MSG-PENDING-SAVING on BTN-EXP-APPROVE; NOTE-EXP-APPROVED post-commit.
- **GWT:** Given a team manager and a submitted team claim, When they approve, Then GATE-APPROVER admits, DAT-EXP-TRANSITION writes (T-EXP-2), and MSG-EXP-APPROVED + NOTE-EXP-APPROVED fire.

**E3 — Authorized: approver returns a submitted claim.**
- 1 approver triggers BTN-EXP-RETURN.
- 2 client: the claim shows a Returned badge.
- 3 the submitter sees the claim back for correction.
- 4 approvals queue → BTN-EXP-RETURN.
- 5 MSG-EXP-RETURNED.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EXP-TRANSITION (status→`returned`, `reviewed_by`, `review_notes`).
- 8 T-EXP-3 (`submitted`→`returned`).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; status stays `submitted`.
- 11 MSG-PENDING-SAVING on BTN-EXP-RETURN.
- **GWT:** Given an approver and a submitted claim, When they return it, Then DAT-EXP-TRANSITION writes (T-EXP-3) and MSG-EXP-RETURNED shows.

**E4 — Authorized: employee resubmits a returned claim (T-EXP-4; §5(a) closed).**
- 1 employee corrects a returned claim and triggers BTN-EXP-SUBMIT.
- 2 client: the claim shows a Submitted badge again.
- 3 the claim re-enters the approvals queue.
- 4 expense form (editable from `returned`) → submitted view.
- 5 MSG-EXP-SUBMIT.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EXP-RESUBMIT.
- 8 T-EXP-4 (`returned`→`submitted`).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; status stays `returned`.
- 11 MSG-PENDING-SAVING on BTN-EXP-SUBMIT.
- **GWT:** Given a returned claim, When the employee corrects amounts and resubmits, Then GATE-EXP-FREEZE permits the edit (`returned` exempt), status→`submitted` (T-EXP-4), and the claim re-queues.

**E5 — Authorized: admin/owner marks an approved claim paid (T-EXP-5).**
- 1 admin marks an approved claim paid.
- 2 client: the claim shows Paid (terminal).
- 3 V-0.
- 4 approvals/finance view; the mark-paid control is admin-only (REJ-UI-HIDDEN for manager).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EXP-PAID (status→`paid`).
- 8 T-EXP-5 (`approved`→`paid`, terminal).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; status stays `approved`.
- 11 MSG-PENDING-SAVING until the write commits.
- **GWT:** Given an admin and an approved claim, When they mark it paid, Then GATE-PAID admits, DAT-EXP-PAID writes (T-EXP-5), and the claim is terminal.

**E5-reject — Rejection: non-admin (incl. submitter, manager) sets `paid`.**
- 1 a non-admin attempts to set status→`paid`.
- 2 client: no paid control surfaces (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 the view without the mark-paid control.
- 5 MSG-DENY-TRIGGER (REJ-PAID).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-PAID — GATE-PAID raises for any non-admin on `new.status='paid'`; status unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a submitter or manager, When they attempt to set `paid`, Then GATE-PAID raises REJ-PAID and status is unchanged.

**E6 — Rejection: submitter self-approves / self-returns / self-stamps reviewed_by, and manager cross-team-approve (§5(c) closed; both paths traced in facet 9).**
- 1 a submitter attempts to move own claim to `approved`/`returned` or set `reviewed_by`; equally, a manager attempts to approve a non-team claim.
- 2 client: BTN-EXP-APPROVE/RETURN absent for a non-approver (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 own-claim / non-team-claim view without approver controls.
- 5 MSG-DENY-TRIGGER (REJ-APPROVER).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-APPROVER — `enforce_expense_transition` (GATE-APPROVER) raises (its `pulse_is_team_member(new.employee_id)` test fails for a submitter and for a cross-team manager); status + `reviewed_by` unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a submitter on their own submitted claim (or a manager on a non-team claim), When they attempt to approve, Then GATE-APPROVER raises REJ-APPROVER (A5) and status is unchanged.

**E7 — Rejection: manager edits monetary fields of a submitted/approved team claim (BLOCKER 3 / F4).**
- 1 manager attempts to rewrite `total_*`/`grand_total` on a non-draft team claim.
- 2 client: no monetary control surfaces on a non-draft claim; a forged write fails.
- 3 V-0.
- 4 approvals view (monetary fields read-only for the approver).
- 5 MSG-DENY-TRIGGER (REJ-EXP-FREEZE).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE (no write to monetary fields).
- 8 SCH-NONE.
- 9 REJ-EXP-FREEZE — GATE-EXP-FREEZE raises when `old.status not in ('draft','returned')` and a monetary field is distinct; values unchanged. (The complementary fix removes the manager branch from `claim_upd` so a manager acts on a team claim only through GATE-APPROVER.)
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager and a submitted team claim, When they attempt to rewrite `total_travel`, Then GATE-EXP-FREEZE raises REJ-EXP-FREEZE and monetary fields are unchanged.

**E8 — Rejection: out-of-sequence expense transition (e.g. `draft`→`paid`, `paid`→`submitted`).**
- 1 actor attempts a transition absent from the GOV §3.3 table.
- 2 client: no control composes this jump; a forged write fails.
- 3 V-0.
- 4 the relevant expense view.
- 5 MSG-DENY-TRIGGER (REJ-EXP-ORDER).
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-EXP-ORDER — GATE-EXP-ORDER rejects the `(old,new)` pair; status unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a `draft` claim, When `status='paid'` is attempted, Then GATE-EXP-ORDER raises REJ-EXP-ORDER and status stays `draft`.

**E9 — Authorized: self/admin writes (insert/update/delete) an expense line of a draft/returned claim (C7).**
- 1 the claim owner (self) or an admin adds/edits/removes a travel/other/advance line.
- 2 client: the line list + computed totals update.
- 3 V-0.
- 4 the expense form line editor (own/admin-editable while the parent is `draft`/`returned`).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-EXP-LINE-SELF (the F3 `_self` FOR-ALL policy, self-or-admin USING + WITH CHECK, no manager branch).
- 8 SCH-NONE (line rows carry no statechart; the A7 `grand_total` CHECK keeps the parent consistent).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; lines + totals unchanged; transaction rolled back.
- 11 MSG-PENDING-SAVING on the line control until the write commits.
- **GWT:** Given a claim owner (or admin) and a `draft`/`returned` claim, When they edit a line, Then DAT-EXP-LINE-SELF writes and the A7 `grand_total` CHECK holds; once the parent leaves `draft`/`returned` the F4 monetary freeze (E7) governs.

**E10 — Rejection: manager DELETEs an expense line of a team claim (the live A7 hole — C7).**
- 1 a manager attempts to DELETE a travel/other/advance line of a team member's claim.
- 2 client: no line-delete control surfaces for a manager (REJ-UI-HIDDEN); a forged DELETE is attempted at the wire.
- 3 V-0.
- 4 the approvals view (manager sees team line items read-only; no delete affordance).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-MGR-LINE-DEL.
- 10 V-0.
- 11 V-0.
- **HEAD note:** at HEAD the `_all` policy's **USING** carries the manager-team branch [LIVE: 002_rls.sql:254] while its WITH CHECK does not [LIVE: 002_rls.sql:256-257]; because USING governs DELETE, a manager **can** delete a team line today and mutate totals (A7 hole). The mandated fix removes that USING branch; this row certifies the post-fix rejection.
- **GWT:** Given the F3 fix is built, When a manager attempts to DELETE a team member's expense line, Then the `_self` policy matches zero rows (REJ-MGR-LINE-DEL) and the line survives; at HEAD this assertion fails because the `_all` USING grants the manager-team DELETE.

### §3.F — Certifications (upload own vs admin)

**F1cert — Authorized: any role uploads/edits OWN certifications.**
- 1 actor uploads/edits an own cert.
- 2 client: the cert list reflects the new row.
- 3 V-0.
- 4 certifications screen with the own upload control (uploadOwnCertificates).
- 5 V-0.
- 6 NOTE-CERT-EXPIRY scheduled if the new cert's V-CERT-EXP is `soon`.
- 7 DAT-CERT-OWN (file metadata + SharePoint ref).
- 8 V-CERT-EXP classifier re-evaluates (derived; SCH-NONE in the stored sense).
- 9 V-0.
- 10 on upload/storage failure: MSG-ERR-GENERIC; no cert row persisted.
- 11 MSG-PENDING-SAVING during the SharePoint upload; the cert row commits only after the upload resolves.
- **GWT:** Given any role, When they upload an own product cert with an expiry within 60 days, Then DAT-CERT-OWN writes, V-CERT-EXP classifies `soon`, and NOTE-CERT-EXPIRY is scheduled.

**F2cert — Authorized: admin uploads/edits a cert FOR ANOTHER employee.**
- 1 admin uploads a cert on someone else's behalf.
- 2 client: that employee's cert list updates.
- 3 V-0.
- 4 certifications screen with the admin upload-for-others control (uploadCertificates).
- 5 V-0.
- 6 NOTE-CERT-EXPIRY scheduled per V-CERT-EXP.
- 7 DAT-CERT-ANY.
- 8 V-CERT-EXP re-evaluates.
- 9 V-0.
- 10 on failure: MSG-ERR-GENERIC; no row persisted.
- 11 MSG-PENDING-SAVING during the upload.
- **GWT:** Given an admin, When they upload a cert for another employee, Then DAT-CERT-ANY writes under GATE-ADMIN.

**F3cert — Rejection: non-admin uploads/edits a cert for ANOTHER employee.**
- 1 manager/employee attempts to write another person's cert.
- 2 client: the upload-for-others control is absent (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 certifications screen with own-only controls; team certs read-only for managers (cert_sel team-read).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `cert_ins`/`cert_upd` (GATE-SELF-OR-ADMIN) deny a non-self/non-admin write; zero rows affected.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager, When they attempt to edit a team member's cert, Then GATE-SELF-OR-ADMIN denies the write (REJ-RLS); the manager retains team read via cert_sel.

### §3.G — Training (self write; team read)

**G1 — Authorized: employee writes own training status/progress.**
- 1 employee marks a module done / enters an ILT date.
- 2 client: the billable ladder + progress update.
- 3 V-0.
- 4 training screen with own progress controls + V-BILL-STAGE indicator.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-TRAIN-SELF.
- 8 V-BILL-STAGE re-evaluates (derived classifier; SCH-NONE stored).
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; flags unchanged.
- 11 MSG-PENDING-SAVING on the control.
- **GWT:** Given an employee, When they set `ilt_done=true`, Then DAT-TRAIN-SELF writes (`ts_self`/`tp_self`) and V-BILL-STAGE recomputes to `ilt`.

**G2 — Authorized: manager reads a team member's training (team-scoped).**
- 1 manager opens the team training view.
- 2 client: the team billable pipeline renders for own team only.
- 3 V-0.
- 4 team training dashboard scoped to the manager's reports.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 V-0.
- 10 on read failure: MSG-ERR-GENERIC; empty pipeline.
- 11 MSG-PENDING-SAVING list skeleton.
- **GWT:** Given the DAT-TRAIN-READ fix, When a manager reads training, Then GATE-TEAM-READ returns own-team rows only; at HEAD `pulse_is_staff()` returns org-wide rows (GOV BLOCKER 1).

**G3 — Rejection: manager reads a NON-team member's training (the org-wide leak).**
- 1 manager queries a non-team member's training row.
- 2 client: that row does not appear.
- 3 V-0.
- 4 team training dashboard (non-team rows absent).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS via DAT-TRAIN-READ: after the replace-not-append fix, GATE-TEAM-READ excludes the row; zero non-team rows returned.
- 10 V-0.
- 11 V-0.
- **HEAD note:** at HEAD the `pulse_is_staff()` disjunct leaks the row org-wide (GOV BLOCKER 1 / F7 Melicke negative test).
- **GWT:** Given Melicke (reports to Charl) has a `training_status` row, When Kevin reads training, Then his count is 1 (own team) after DAT-TRAIN-READ; at HEAD it is 2 (leak) (GOV F7).

### §3.H — Documents (admin upload/delete)

**H1 — Authorized: admin uploads / deletes a company document.**
- 1 admin uploads a file or SharePoint link, or deletes a document.
- 2 client: the document library updates.
- 3 V-0.
- 4 documents screen with the admin upload/delete control (uploadDocuments).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-DOC (insert; or `is_active=false`/delete).
- 8 SCH-NONE.
- 9 V-0.
- 10 on storage failure: MSG-ERR-GENERIC; the library unchanged.
- 11 MSG-PENDING-SAVING during the SharePoint upload/download round-trip.
- **GWT:** Given an admin, When they upload a document, Then DAT-DOC writes under GATE-ADMIN and it appears in the active library.

**H2 — Authorized: any role reads / downloads an active document.**
- 1 actor opens / downloads an active document.
- 2 client: the document opens via the SharePoint download.
- 3 V-0.
- 4 documents library (active docs only for non-admin).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 V-0.
- 10 on download failure: MSG-ERR-GENERIC; no file opened.
- 11 MSG-PENDING-SAVING during the SharePoint download.
- **GWT:** Given any role, When they open an active document, Then `doc_sel` (GATE-TRUE on `is_active`) returns it and the SharePoint download starts.

**H3 — Rejection: non-admin uploads / deletes a document.**
- 1 employee/manager attempts to upload or delete.
- 2 client: the upload/delete control is absent (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 documents library without the admin control.
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `doc_admin` (GATE-ADMIN) denies; the library unchanged.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a non-admin, When they attempt to delete a document, Then `doc_admin` (GATE-ADMIN) denies (REJ-RLS) and the document is unchanged.

### §3.I — POPIA satellites (self / admin-only)

**I1 — Authorized: self or admin writes a POPIA satellite.**
- 1 actor edits own (or, as admin, anyone's) POPIA satellite — personal/medical/tax-banking, emergency contact, or AA-rate cert.
- 2 client: the form reflects the saved values.
- 3 V-0.
- 4 My Forms / employee profile with the relevant POPIA form (TaxForm, PersonalForm, EmergencyForm, AA cert via BTN-SAVE-CERT); managers never see these (REJ-UI-HIDDEN).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-POPIA-SELF.
- 8 SCH-NONE.
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; values unchanged.
- 11 MSG-PENDING-SAVING on the form control.
- **GWT:** Given an employee, When they save own tax/banking, Then DAT-POPIA-SELF writes under GATE-SELF-OR-ADMIN. (The contract-write-by-self rejection is I3, keeping contract authority out of this facet.)

**I2 — Rejection: manager reads/writes any POPIA satellite or emergency contact.**
- 1 manager attempts to read or write a POPIA satellite / emergency contact.
- 2 client: no POPIA surface exists for managers (REJ-UI-HIDDEN); a forged read/write returns/affects nothing.
- 3 V-0.
- 4 manager screens with all POPIA/emergency sections hidden.
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE (reads return zero rows).
- 8 SCH-NONE.
- 9 REJ-RLS — the satellite policies (GATE-SELF-OR-ADMIN, no manager branch) deny; zero rows (A4).
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager, When they query a team member's `employee_tax_banking`, Then GATE-SELF-OR-ADMIN returns zero rows (REJ-RLS, A4).

**I3 — Rejection: self (non-admin) writes the employment contract.**
- 1 employee attempts to write/replace own `contract_uploads` row.
- 2 client: no self-write control for the contract (read-only for self); a forged write fails.
- 3 V-0.
- 4 onboarding/profile showing the contract as read-only for self.
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `contract_admin` (DAT-CONTRACT, GATE-ADMIN) denies a self write; the contract row is unchanged. (Self read of own contract is the separate `contract_sel` grant, GOV §1.3.)
- 10 V-0.
- 11 V-0.
- **GWT:** Given an employee, When they attempt to write own `contract_uploads`, Then DAT-CONTRACT (GATE-ADMIN) denies (REJ-RLS); the employee retains read via `contract_sel`.

**I4 — Authorized: admin/owner uploads/updates an employment contract (C8).**
- 1 admin uploads or updates an employee's `contract_uploads` row.
- 2 client: that employee's contract section reflects the saved file.
- 3 V-0.
- 4 admin profile/onboarding screen with the contract upload control (admin-only).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-CONTRACT.
- 8 SCH-NONE.
- 9 V-0.
- 10 on storage/write failure: MSG-ERR-GENERIC; the contract row unchanged.
- 11 MSG-PENDING-SAVING during the SharePoint upload round-trip.
- **GWT:** Given an admin, When they upload a contract, Then DAT-CONTRACT writes under GATE-ADMIN; managers never reach this surface (I5).

**I4-del — Authorized: admin/owner deletes a `contract_uploads` row (C8).**
- 1 admin deletes an employee's `contract_uploads` row (e.g. replacing a superseded contract file).
- 2 client: the contract section shows the row removed.
- 3 V-0.
- 4 admin profile/onboarding screen with the contract delete control (admin-only).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-CONTRACT-DEL.
- 8 SCH-NONE.
- 9 a non-admin delete: REJ-RLS (`contract_admin` FOR ALL, GATE-ADMIN — zero rows); an FK-referenced row blocked by `ON DELETE RESTRICT`.
- 10 on delete failure (incl. FK restriction): MSG-ERR-GENERIC; the row survives.
- 11 MSG-PENDING-SAVING on the delete control until it resolves.
- **GWT:** Given an admin, When they delete a `contract_uploads` row, Then DAT-CONTRACT-DEL removes it under GATE-ADMIN; a non-admin is denied (REJ-RLS) and any FK-referenced row is blocked by ON DELETE RESTRICT (A8).

**I5 — Rejection: manager reads an employment contract (C8).**
- 1 manager attempts to read a team member's `contract_uploads` row.
- 2 client: no contract surface exists for managers (REJ-UI-HIDDEN); a forged read returns nothing.
- 3 V-0.
- 4 manager screens with the contract section hidden.
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE (reads return zero rows).
- 8 SCH-NONE.
- 9 REJ-RLS — `contract_sel` (GATE-SELF-OR-ADMIN, no manager branch) returns zero rows for a manager (A4).
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager, When they query a team member's `contract_uploads`, Then `contract_sel` returns zero rows (REJ-RLS, A4 — managers never touch the contract).

**I6 — Rejection: owner/employee row DELETE (owner-protection + ON DELETE RESTRICT — C8).**
- 1 a non-owner attempts to DELETE an `employees` row (e.g. to "remove" a terminated or owner record), or any actor attempts a hard delete of a financial/audit-referenced row.
- 2 client: no delete-employee control surfaces (REJ-UI-HIDDEN); a forged DELETE is attempted at the wire.
- 3 V-0.
- 4 the relevant admin screen; termination is a status change (B-EMP-*), never a row delete.
- 5 MSG-DENY-TRIGGER (REJ-PROTECT-OWNER) for the owner path; the FK restriction surfaces as a write-failure toast for the referenced-row path.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-PROTECT-OWNER — the `BEFORE UPDATE OR DELETE` owner-protection trigger raises on a non-owner deleting/demoting an owner (A3); independently, financial/audit FKs are `ON DELETE RESTRICT` so a referenced employee row cannot be hard-deleted (A8); the row survives.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a non-owner, When they attempt to DELETE an owner's (or any FK-referenced) `employees` row, Then the owner-protection trigger raises REJ-PROTECT-OWNER and/or `ON DELETE RESTRICT` blocks it (A3/A8); the row survives — termination is the status path B-EMP-2/4/6/8, not a delete.

### §3.J — TARGET integration triggers

**J1 — Graph email on task assign (NOTE-ASSIGN).**
- 1 admin assigns a task owner (the assign sub-action of C1).
- 2 client: an assignment toast.
- 3 the new owner receives the assignment email.
- 4 WorkflowBoard with BTN-OWNER-SELECT.
- 5 V-0.
- 6 NOTE-ASSIGN.
- 7 DAT-ONB-ASSIGN + DAT-EMAILLOG.
- 8 SCH-NONE.
- 9 V-0.
- 10 on Graph send failure: MSG-ERR-GENERIC; the assignment persists, the email is logged failed (never a silent success).
- 11 the send is async-pending: the assignment commits first; NOTE-ASSIGN dispatches server-side post-commit; a slow Graph call does not block the assignment.
- **GWT:** Given an admin assigns an owner, When the assignment commits, Then NOTE-ASSIGN dispatches via Graph and an `email_log` row records the outcome; a Graph failure surfaces MSG-ERR-GENERIC without rolling back the assignment. (The assign authorization rejection is C4.)

**J2 — Graph email: Notify-All announcement (NOTE-ANNOUNCE).**
- 1 admin composes and sends a Notify-All.
- 2 client: a send-confirmed view.
- 3 the audience receives the email + in-app notification.
- 4 Notify-All screen with the audience picker + live counts (admin-only; REJ-UI-HIDDEN otherwise).
- 5 V-0.
- 6 NOTE-ANNOUNCE.
- 7 DAT-NOTIFY + DAT-EMAILLOG.
- 8 SCH-NONE.
- 9 non-admin attempt: REJ-RLS (`notif_ins` GATE-ADMIN denies).
- 10 on Graph failure: MSG-ERR-GENERIC; the in-app `admin_notifications` row persists; failed sends logged.
- 11 async-pending: the in-app insert commits first; the Graph fan-out dispatches post-commit.
- **GWT:** Given an admin sends a Notify-All, When it commits, Then DAT-NOTIFY inserts and NOTE-ANNOUNCE fans out via Graph; a non-admin send is denied by GATE-ADMIN (REJ-RLS).

**J3 — Graph email: certification-expiry reminder (NOTE-CERT-EXPIRY).**
- 1 the scheduled expiry job runs (system actor).
- 2 V-0.
- 3 employees with certs entering `soon` receive the reminder.
- 4 V-0.
- 5 V-0.
- 6 NOTE-CERT-EXPIRY.
- 7 DAT-EMAILLOG (the cert rows themselves are not mutated).
- 8 V-CERT-EXP classifier drives the trigger (derived; SCH-NONE stored).
- 9 V-0.
- 10 on Graph failure: failed sends logged; the job records the failure (never a silent success); MSG-ERR-GENERIC surfaced to the admin job monitor.
- 11 async-pending: the job batches sends; a slow Graph call retries per the job policy, not inline.
- **GWT:** Given a cert whose V-CERT-EXP is `soon`, When the expiry job runs, Then NOTE-CERT-EXPIRY dispatches and `email_log` records each send outcome.

**J4 — SharePoint upload / download (file storage).**
- 1 actor uploads or downloads a file (cert, AA cert, document, policy source).
- 2 client: a progress indicator on the file control.
- 3 SharePoint stores the item; the record keeps the item reference.
- 4 the originating screen's file control.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-FILE-REF (the SharePoint item reference is persisted by the originating DAT-* row's own write; the field set is fixed once in the §1.8 id, never restated in this cell).
- 8 SCH-NONE.
- 9 V-0.
- 10 on SharePoint failure: MSG-ERR-GENERIC; no record persisted with a dangling reference (the metadata write and the upload commit together or not at all).
- 11 async-pending: MSG-PENDING-SAVING until SharePoint confirms the item; the record's reference is written only on confirmation.
- **GWT:** Given an upload, When SharePoint confirms the item, Then DAT-FILE-REF is stored by the originating DAT-* row; a SharePoint failure surfaces MSG-ERR-GENERIC and persists no dangling reference. (Authorization rejection is owned by the originating row, e.g. H3, F3cert.)

**J5 — Ask-HR query (real LLM endpoint).**
- 1 employee types a question and triggers BTN-ASK-SEND.
- 2 client: the question appends to the thread; the assistant reply streams in.
- 3 V-0.
- 4 Ask-HR screen with the thread + BTN-ASK-SEND.
- 5 MSG-ASK-DISCLAIMER pinned under the composer.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-MSG (self-authored question + assistant reply persisted to `messages`).
- 8 SCH-NONE.
- 9 a non-self read of another user's thread: REJ-RLS (`msg_self` GATE-SELF-OR-ADMIN; the admin-delete-others reach is the `for all` clause, GOV M7).
- 10 on LLM failure: MSG-ERR-GENERIC; the question persists, the reply is marked failed (never a fabricated answer, never a silent success).
- 11 async-pending: MSG-PENDING-SAVING streaming indicator until the LLM responds; the reply persists only on completion.
- **GWT:** Given an employee asks a question, When the LLM responds, Then DAT-MSG persists the exchange and MSG-ASK-DISCLAIMER is shown; an LLM failure surfaces MSG-ERR-GENERIC and persists no fabricated reply.

### §3.K — Messages delete (Ask-HR history; M7 admin reach)

> Block maturity: the `messages` policies (self insert, self/admin read, admin
> delete-others) are **MAT-LIVE** (`msg_self` `for all`, GOV M7); the real Ask-HR
> LLM that fills the thread is MAT-TARGET (J5).

**K1 — Authorized: admin/owner DELETEs another author's Ask-HR message (M7 — C8).**
- 1 admin deletes another employee's `messages` row (moderation of Ask-HR history).
- 2 client: the message disappears from the admin view of that thread.
- 3 V-0.
- 4 admin Ask-HR / moderation view (admin-only delete affordance; REJ-UI-HIDDEN for non-admin).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-MSG-DEL-ADMIN.
- 8 SCH-NONE.
- 9 V-0.
- 10 on delete failure: MSG-ERR-GENERIC; the message survives.
- 11 MSG-PENDING-SAVING on the delete control until it resolves.
- **GWT:** Given an admin, When they delete another author's message, Then DAT-MSG-DEL-ADMIN removes it under the `msg_self` `for all` USING `pulse_is_admin()` reach (M7).

**K2 — Rejection: employee DELETEs another author's Ask-HR message (C8).**
- 1 a non-admin employee attempts to delete a message they did not author.
- 2 client: no delete affordance for others' messages (REJ-UI-HIDDEN); a forged DELETE is attempted.
- 3 V-0.
- 4 the employee's own Ask-HR thread (no cross-author delete control).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `msg_self` USING (`author_id = self or pulse_is_admin()`) excludes another author's row for a non-admin; zero rows deleted.
- 10 V-0.
- 11 V-0.
- **GWT:** Given an employee, When they attempt to delete another author's message, Then `msg_self` (GATE-SELF-OR-ADMIN-class USING) matches zero rows (REJ-RLS); only the author or an admin may delete.

### §3.L — Self-owned onboarding records & append-only evidence (C6)

> Block maturity: all policies in this block are **MAT-LIVE** (the `_self`
> FOR-ALL policies and the append-only `audit_log` / `hr_policy_ack_events`
> insert-only policies exist at HEAD). The A6 immutability rows are LIVE-enforced
> by the absence of any UPDATE/DELETE policy (FORCE-RLS default-deny).

**L1-form — Authorized: self or admin writes an `onboarding_form_completions` record (incl. POPIA tax/banking form).**
- 1 the employee (self) or an admin writes an `onboarding_form_completions` row.
- 2 client: the My-Forms screen reflects the saved record.
- 3 V-0.
- 4 the My Forms self-service screen; managers never see POPIA forms (REJ-UI-HIDDEN).
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-FORM.
- 8 SCH-NONE.
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; the record unchanged.
- 11 MSG-PENDING-SAVING on the form control.
- **GWT:** Given an employee, When they complete the tax/banking onboarding form, Then DAT-FORM writes under GATE-SELF-OR-ADMIN.

**L1-goals — Authorized: self or admin writes an `employee_goals` record.**
- 1 the employee (self) or an admin writes an `employee_goals` row.
- 2 client: the Goals screen reflects the saved record.
- 3 V-0.
- 4 the Goals self-service screen.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-GOALS.
- 8 SCH-NONE.
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; the record unchanged.
- 11 MSG-PENDING-SAVING on the form control.
- **GWT:** Given an employee, When they record a goal, Then DAT-GOALS writes under GATE-SELF-OR-ADMIN.

**L1-sop — Authorized: self or admin writes a `sop_completions` record.**
- 1 the employee (self) or an admin writes a `sop_completions` row.
- 2 client: the SOPs screen reflects the saved record.
- 3 V-0.
- 4 the SOPs self-service screen.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-SOPC.
- 8 SCH-NONE.
- 9 V-0.
- 10 on write failure: MSG-ERR-GENERIC; the record unchanged.
- 11 MSG-PENDING-SAVING on the form control.
- **GWT:** Given an employee, When they complete a SOP, Then DAT-SOPC writes under GATE-SELF-OR-ADMIN.

**L2-form — Rejection: a non-self/non-admin writes another person's `onboarding_form_completions`.**
- 1 a manager/other employee attempts to write someone else's `onboarding_form_completions` row.
- 2 client: no surface exists for another person's record (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 the actor's own My Forms screen (no cross-employee write control).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `forms_self` (GATE-SELF-OR-ADMIN, no manager branch) matches zero rows for a non-self/non-admin write.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager, When they attempt to write a team member's `onboarding_form_completions`, Then `forms_self` (GATE-SELF-OR-ADMIN) denies the write (REJ-RLS); the record is unchanged.

**L2-goals — Rejection: a non-self/non-admin writes another person's `employee_goals`.**
- 1 a manager/other employee attempts to write someone else's `employee_goals` row.
- 2 client: no surface exists for another person's record (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 the actor's own Goals screen (no cross-employee write control).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `goals_self` (GATE-SELF-OR-ADMIN, no manager branch) matches zero rows for a non-self/non-admin write.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager, When they attempt to write a team member's `employee_goals`, Then `goals_self` (GATE-SELF-OR-ADMIN) denies the write (REJ-RLS); the record is unchanged.

**L2-sop — Rejection: a non-self/non-admin writes another person's `sop_completions`.**
- 1 a manager/other employee attempts to write someone else's `sop_completions` row.
- 2 client: no surface exists for another person's record (REJ-UI-HIDDEN); a forged write fails.
- 3 V-0.
- 4 the actor's own SOPs screen (no cross-employee write control).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `sopc_self` (GATE-SELF-OR-ADMIN, no manager branch) matches zero rows for a non-self/non-admin write.
- 10 V-0.
- 11 V-0.
- **GWT:** Given a manager, When they attempt to write a team member's `sop_completions`, Then `sopc_self` (GATE-SELF-OR-ADMIN) denies the write (REJ-RLS); the record is unchanged.

**L3 — Authorized: self or admin records a document acknowledgement.**
- 1 the employee (self) or an admin inserts/updates a `document_acknowledgements` row.
- 2 client: the document shows acknowledged.
- 3 V-0.
- 4 the documents screen with the acknowledge control.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-DOCACK.
- 8 SCH-NONE.
- 9 a non-self/non-admin write: REJ-RLS (`docack_self`, GATE-SELF-OR-ADMIN, no manager branch — zero rows).
- 10 on write failure: MSG-ERR-GENERIC; the ack unchanged.
- 11 MSG-PENDING-SAVING on the acknowledge control.
- **GWT:** Given an employee, When they acknowledge a document, Then DAT-DOCACK writes under GATE-SELF-OR-ADMIN; a non-self/non-admin write is denied (REJ-RLS).

**L4 — Authorized: self-attributed or admin inserts an `audit_log` row.**
- 1 an authenticated actor inserts an audit row attributed to own `employee_id` (or an admin inserts any).
- 2 client: V-0 (audit writes are server-side; no direct user surface).
- 3 the audit trail gains an append-only row as the background effect.
- 4 V-0.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-AUDIT.
- 8 SCH-NONE.
- 9 a non-self-attributed insert by a non-admin: REJ-RLS (`audit_ins` WITH CHECK `employee_id = self or pulse_is_admin()`, GOV M6 — zero rows).
- 10 on write failure: MSG-ERR-GENERIC; no audit row written.
- 11 MSG-PENDING-SAVING (server-side, not user-visible).
- **GWT:** Given any authenticated actor, When an audit row is inserted with their own `employee_id`, Then DAT-AUDIT writes (`audit_ins`); a non-admin attempting a row attributed to another `employee_id` is denied (REJ-RLS, M6).

**L5 — Rejection: any actor UPDATEs or DELETEs `audit_log` (A6 immutability).**
- 1 any actor (incl. owner/admin) attempts to UPDATE or DELETE an `audit_log` row.
- 2 client: no edit/delete affordance for audit rows (REJ-UI-HIDDEN); a forged UPDATE/DELETE is attempted.
- 3 V-0.
- 4 the audit view (read-only for admins; immutable).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `audit_log` is FORCE-RLS with **no** UPDATE/DELETE policy, so default-deny applies to the owner too (A6); zero rows mutated.
- 10 V-0.
- 11 V-0.
- **GWT:** Given any actor including the owner, When they attempt to UPDATE or DELETE an `audit_log` row, Then FORCE-RLS default-deny (no UPDATE/DELETE policy) blocks it (REJ-RLS, A6); the evidence is immutable.

**L6 — Authorized: self or admin appends an `hr_policy_ack_events` evidence row.**
- 1 the ack flow (self or admin) appends a version-stamped `hr_policy_ack_events` row (the entry action of T-ACK-2).
- 2 client: V-0 (the event append is a side effect of the ack tick D1).
- 3 the append-only evidence trail gains a row as the background effect.
- 4 V-0.
- 5 V-0.
- 6 NOTE-NONE-NOEMAIL.
- 7 DAT-ACKEV-INS.
- 8 SCH-NONE.
- 9 a non-self/non-admin append: REJ-RLS (`ackev_ins` WITH CHECK GATE-SELF-OR-ADMIN — zero rows).
- 10 on write failure: MSG-ERR-GENERIC; no evidence row written (the parent ack rolls back with it).
- 11 MSG-PENDING-SAVING until the ack + event commit atomically (see D1.11).
- **GWT:** Given an employee acknowledging a policy, When the ack commits, Then DAT-ACKEV-INS appends a version-stamped evidence row (`ackev_ins`); a non-self/non-admin append is denied (REJ-RLS).

**L7 — Rejection: any actor UPDATEs or DELETEs `hr_policy_ack_events` (A6 immutability).**
- 1 any actor (incl. owner/admin) attempts to UPDATE or DELETE an `hr_policy_ack_events` row (e.g. to erase ack history after a republish).
- 2 client: no edit/delete affordance for evidence rows (REJ-UI-HIDDEN); a forged UPDATE/DELETE is attempted.
- 3 V-0.
- 4 the policy/ack evidence view (read-only; immutable).
- 5 MSG-DENY-RLS.
- 6 NOTE-NONE-REJECTED.
- 7 DAT-NONE.
- 8 SCH-NONE.
- 9 REJ-RLS — `hr_policy_ack_events` is FORCE-RLS with **no** UPDATE/DELETE policy (only `ackev_ins`/`ackev_sel`), so default-deny applies to the owner too (A6); the prior evidence survives a republish (GOV §3.2 invariant).
- 10 V-0.
- 11 V-0.
- **GWT:** Given any actor including the owner, When they attempt to UPDATE or DELETE an `hr_policy_ack_events` row, Then FORCE-RLS default-deny blocks it (REJ-RLS, A6); evidence survives the D2 republish reset.

---

## §4 Coverage ledger (TOTAL — every Stage × Actor × Action enumerated)

This ledger is **TOTAL**, per the ratified full-totality mandate. Every
Stage × Actor × Action edge is enumerated as a matrix row — every authorized path,
every rejection, every error (facet 10), and every timeout/async-pending path
(facet 11). There is **no** "non-total by design" carve-out and **no**
"ratified-open" deferral: the prior set-aside items (a–c) are now realized as
concrete rows — the full pair-keyed employee-status table (§3.B, 8 legal pairs +
13 distinct illegal pairs across B-EMP-* rows), the resubmit edge (E4), and the
cross-team-approve rejection (E6,
with its dedicated facet-9 trace). The onboarding-task statechart (§3.C) is
enumerated per resolved GOV §3.6 edge via P-OTS-EDGE, with `assigned_to` split to
its own admin-only write (C-status vs C-assign). Alias rows (§2) are counted once
under their canonical row and the alias rows they subsume are named.

| Flow | Authorized | Rejection | Error (facet 10) | Timeout/async (facet 11) |
|---|---|---|---|---|
| M365 sign-in | A1 | A2, A3 | A1.10 (A2/A3 facet-10 = V-0) | A1.11, A4 (A4 ALIAS-OF A3 post-timeout) |
| Directory read + masked phone | B1, B1a | B1a.9 (REJ-RLS via P-PHONE) | B1.10, B1a.10 | B1.11, B1a.11 |
| Employee status (pair-keyed) | B-EMP-1…8 (8 legal pairs) | B-EMP-X01…X13 (13 distinct illegal pairs, REJ-EMP-ORDER) | B-EMP-1.10…B-EMP-8.10 (X01–X13 facet-10 = V-0) | B-EMP-1.11…B-EMP-8.11 (X01–X13 facet-11 = V-0) |
| Employee non-status fields / role | B2-fields | B2-reject, B5 | B2-fields.10 (B2-reject/B5 facet-10 = V-0) | B2-fields.11 (B2-reject/B5 facet-11 = V-0) |
| Onboarding tasks | C1-status, C1-assign, C2, C6-admin, C6-mgr | C3, C4, C5, C7-emp, C8-order (3 distinct illegal §3.6 pairs, REJ-OTS-ORDER) | C1-status.10, C1-assign.10, C2.10, C5.10, C6-admin.10, C6-mgr.10 (C3/C4/C7-emp/C8-order facet-10 = V-0) | C1-status.11, C1-assign.11, C2.11, C6-admin.11, C6-mgr.11 (C3/C4/C5/C7-emp/C8-order facet-11 = V-0) |
| Policies ack + publish | D1, D2 | D1-reject, D2-reject | D1.10, D2.10 | D1.11, D2.11 |
| Expenses (status + lines) | E1, E2, E3, E4, E5, E9 | E1-reject-client, E5-reject, E6, E7, E8, E10 | E1.10, E2.10, E3.10, E4.10, E5.10, E9.10 (E6/E7/E8/E10 facet-10 = V-0) | E1.11, E2.11, E3.11, E4.11, E5.11, E9.11 |
| Certifications | F1cert, F2cert | F3cert | F1cert.10, F2cert.10 | F1cert.11, F2cert.11 |
| Training | G1, G2 | G3 | G1.10, G2.10 | G1.11, G2.11 |
| Documents | H1, H2 | H3 | H1.10, H2.10 | H1.11, H2.11 |
| POPIA satellites + contract | I1, I4, I4-del | I2, I3, I4-del.9, I5, I6 | I1.10, I4.10, I4-del.10 | I1.11, I4.11, I4-del.11 |
| Messages delete | K1 | K2 | K1.10 (K2 facet-10 = V-0) | K1.11 |
| Self-owned records + evidence | L1-form, L1-goals, L1-sop, L3, L4, L6 | L2-form, L2-goals, L2-sop, L3.9, L4.9, L5, L6.9, L7 | L1-form.10, L1-goals.10, L1-sop.10, L3.10, L4.10, L6.10 | L1-form.11, L1-goals.11, L1-sop.11, L3.11, L4.11, L6.11 |
| Integration triggers | J1, J2, J3, J4, J5 | J2.9, J5.9 (J1.9→C4) | J1.10, J2.10, J3.10, J4.10, J5.10 | J1.11, J2.11, J3.11, J4.11, J5.11 |

> **Totality note.** The employee-status row enumerates the §3.1 pair space:
> 8 authorized legal-pair rows + 13 distinct illegal pairs (REJ-EMP-ORDER). The
> onboarding-task status action is split from the assign action (C1-status /
> C1-assign), each resolving to a single facet-8 value (P-OTS-EDGE vs SCH-NONE).
> The schedule-onboarding row is split by actor into C6-admin (facet 6 =
> NOTE-ASSIGN) and C6-mgr (facet 6 = NOTE-NONE-NOEMAIL), each routing the new hire
> to `onboarding` via the single creation→initial-state edge T-EMP-0; the
> employee/onboardee write of `onboarding_task_status` resolves to a determinate
> REJ-RLS in C7-emp (admin-only `ots_write`, onboardee SELECT-only via `ots_sel`),
> closing the prior totality gap (no Employee × write onboarding_task_status row).
> The expense-line write (E9) and the manager-line-delete hole (E10) close the A7
> line surface. The contract write/read (I4/I5), the owner/employee DELETE path
> (I6), the messages admin-delete-others / employee reject (K1/K2), and every
> previously-missing governed surface — `onboarding_form_completions`,
> `employee_goals`, `sop_completions` (each split self/reject:
> L1-form/L1-goals/L1-sop + L2-form/L2-goals/L2-sop), `document_acknowledgements`,
> `audit_log` insert + A6 immutability, `hr_policy_ack_events` A6 immutability
> (L1-form…L7) — are enumerated.

> **F1 alias-fold applied (per §2).** M365 row: every distinct row A1–A4 is listed;
> A4 is marked `ALIAS-OF A3` for its post-timeout terminal facets — the alias cells
> are listed explicitly, not dropped. Directory row: B1/B1a Error is `B1.10, B1a.10`
> and Timeout is `B1.11, B1a.11` — B1a.11 is listed explicitly, not collapsed to
> "As B1". The one rule governs every block.

---

## §5 Scope-closure record (full totality — no open deferrals)

The earlier "set-aside" items are now **closed** — every one is realized as
concrete rows in §3, not deferred. There is **no** "ratified-open" item and **no**
"non-total by design" carve-out anywhere in this contract.

- **(a) Resubmit T-EXP-4 — CLOSED (E4).** Row E4 + edge T-EXP-4; the `returned`
  exemption from GATE-EXP-FREEZE is the mechanism.
- **(b) Employee-status transition rows — CLOSED (pair-keyed table, §3.B).** The
  prior single selector row is replaced by the pair-keyed enumeration over
  `(old.status, new.status)`: B-EMP-1…8 (8 legal pairs, one resolved T-EMP edge
  each) and B-EMP-X01…X13 (13 distinct illegal pairs, REJ-EMP-ORDER). The two
  pairs `probation→active` and `suspended→active` are legal (confirm / reinstate)
  and the former duplicate-event cells (active→active, terminated→active) collapse
  to one pair each, so no illegal cell is a legal pair under a different event. No
  per-pair expansion is deferred.
- **(c) Cross-team-approve rejection — CLOSED (E6, dedicated facet-9 trace).** E6
  carries both the submitter self-approve and the manager cross-team-approve paths;
  facet 9 names GATE-APPROVER's `pulse_is_team_member(new.employee_id)` failing for
  both. No standalone deferral remains.
- **(d) REJ-RLS vs MSG-DENY-RLS no-op-vs-toast — CLOSED.** Resolved in §1.7:
  REJ-RLS is the wire outcome (zero rows, no raised error); MSG-DENY-RLS is its UI
  surface (prior view unchanged, **no toast** — default-deny is silent).
  REJ-TRIGGER/MSG-DENY-TRIGGER is the contrasting raised-error+toast path.
- **(e) NOTE-NONE split — CLOSED.** Resolved in §0: NOTE-NONE-NOEMAIL (no email
  intended/wired) vs NOTE-NONE-REJECTED (rejected before any send) are two distinct
  sentinels.
- **(f) Onboarding-task status/assign split — CLOSED (C1-status / C1-assign, C2).**
  Status writes resolve to one P-OTS-EDGE (GOV §3.6); `assigned_to` writes resolve
  to SCH-NONE; no dual-value facet-8 cell remains.
- **(g) Expense-line + manager-delete hole — CLOSED (E9 / E10).** Self/admin line
  writes (E9, DAT-EXP-LINE-SELF) and the manager-team-delete rejection (E10,
  REJ-MGR-LINE-DEL) close the A7 line surface.
- **(h) Previously-missing governed surfaces — CLOSED (I4/I5/I6, K1/K2,
  L1-form/L1-goals/L1-sop, L2-form/L2-goals/L2-sop, L3–L7).** Contract
  write/read + DELETE path, messages admin-delete-others + employee reject, the
  self-owned onboarding records (each split per-table into a single-valued
  authorized row and a single-valued rejection row — no three-valued facet-7 or
  facet-9 cell remains), and the A6 append-only immutability of `audit_log` and
  `hr_policy_ack_events` are all enumerated.
- **(i) Onboarding-task out-of-sequence rejection — CLOSED (C8-order).** The 3
  distinct illegal §3.6 pairs (the self-loops `pending→pending`,
  `inprogress→inprogress`, `done→done`) are a dedicated rejection row (facet 8 =
  SCH-NONE, facet 9 = REJ-OTS-ORDER), matching the B-EMP-X dedicated-row pattern.
  `pending→inprogress` (start) and `done→inprogress` (reopen — what live advance
  emits from `done`) are legal pairs, not illegal cells; the duplicate
  `inprogress→inprogress` event-cells collapse to one pair. The C1-status / C2
  facet-9 cells are now V-0; no selector cell remains in the task-status rows.
- **(j) Ack out-of-sequence rejection — CLOSED (D1-reject broadened).** D1-reject
  now enumerates all blank §3.2 derived-state cells (R1 `unacknowledged ×
  acknowledge`, R2 `reading × read_started`, R3 `acknowledged × read_started`,
  R4 `acknowledged × acknowledge`), matching GATE-ACK-DERIVE's full domain, not
  only the read-skip.
- **(k) SharePoint item reference single-sourced — CLOSED (DAT-FILE-REF).** J4
  facet 7 references the single §1.8 id DAT-FILE-REF; the three field literals
  (`file_url`/`file_ref`/`document_url`) and the `DAT-*` wildcard are folded into
  that id and no longer appear inline in any facet-7 cell.

**Citation-hygiene applied in this redraft (C9/C10):**
- The Return control label is `Return for correction` (BTN-EXP-RETURN,
  expenses/page.tsx:1162-1166), not "Return".
- The MSG-EXP-* line ranges are corrected to the actual source lines (§1.5).
- BTN-STATUS-CHECK / BTN-OWNER-SELECT cite the actual WorkflowBoard lines
  (218-224 checkbox; 296-299 owner select).
- The §3.B block header is per-cell and does **not** claim MAT-LIVE for the
  B-EMP-* cells that reference TARGET ordering (T-EMP edges / GATE-EMP-ORDER).
- DAT-EXP-LINE cites the do-block `246-260` and notes the template body `252-257`
  distinctly (not conflated).

---

## §6 Self-check (determinism bar + full-totality conformance)

- **Totality.** The matrix is TOTAL: every Stage × Actor × Action edge is a row,
  including every rejection, error, and timeout/async path. No "non-total by
  design" header and no "ratified-open" deferral remain anywhere (§4 header, §5
  closure record).
- Every matrix cell is a single §1 id or §0 sentinel — no inline literal, no
  dual-value cell, no TARGET/LIVE/should/may/note/TODO hedge inside a cell
  (maturity lives on the §1 ids and the per-cell block headers).
- **C1 applied:** MSG-EXP-GATE (§1.5) is the single-valued first-failing-gate id
  in the locked order `INCOMPLETE -> TIMESHEET -> SLIPS -> RATE`; E1-reject-client
  references it (exactly one of the four sub-messages fires).
- **C2 applied:** the employee-status row is the pair-keyed table — B-EMP-1…8
  (each facet 8 = one resolved T-EMP edge; 8 legal pairs) and B-EMP-X01…X13 (each
  facet 9 = REJ-EMP-ORDER; 13 distinct illegal pairs). Because the runtime carries
  no event, the model keys on `(old.status, new.status)` pairs, so a pair reachable
  legally by any event is the legal pair (former X06 `probation→active`, X11
  `suspended→active`) and duplicate-event cells collapse to one pair each (X09→X08,
  X16→X14). The task-status rows match the same pattern: C1-status / C2 carry
  facet 9 = V-0 (legal pairs only) and the 3 distinct illegal §3.6 pairs are the
  dedicated rejection row C8-order (facet 9 = REJ-OTS-ORDER). **No selector cell
  remains anywhere** — the prior `9 if the pair is absent from the GOV §3.6 table:
  REJ-OTS-ORDER` conditional selector is removed from both C1-status and C2.
- **C3 applied:** the task-toggle row is split into C1-status (facet 8 = one
  resolved P-OTS-EDGE) and C1-assign (facet 8 = SCH-NONE); no dual-value cell.
- **C4 applied:** DAT-NONE (§0) is the single sentinel for every no-write /
  read-only / zero-rows facet-7 cell; **zero inline literals remain in facet 7.**
  J4 facet 7 references the single §1.8 id DAT-FILE-REF (the prior `DAT-*`
  wildcard + `file_url`/`file_ref`/`document_url` literals are folded into that
  id); the self-owned-record rows reference exactly one DAT-* id each (L1-form =
  DAT-FORM, L1-goals = DAT-GOALS, L1-sop = DAT-SOPC — the prior three-valued
  "DAT-FORM, DAT-GOALS, or DAT-SOPC" cell is split). Every `- 7` line is a single
  resolved id or DAT-NONE.
- **C5 applied:** GOV §3.6 onboarding_task_status statechart added (states
  pending/inprogress/done; manager allowlist `status/started_at/completed_at/
  completed_by`; BEFORE-trigger freeze of `assigned_to/workflow_id/task_id` +
  `assigned_to` NULL on manager insert; GATE-OTS-ORDER). Authorized task-status
  rows (C1-status / C2) reference the single resolved §3.6 edge via P-OTS-EDGE with
  facet 9 = V-0; the 3 distinct illegal §3.6 pairs (the self-loops) are the
  dedicated rejection row C8-order (facet 8 = SCH-NONE, facet 9 = REJ-OTS-ORDER) —
  no conditional selector embedded in an authorized row.
- **C6 applied:** authorized + rejection rows added for
  `onboarding_form_completions`, `employee_goals`, `sop_completions` — each split
  per-table into a single-valued authorized row (L1-form/L1-goals/L1-sop) and a
  single-valued rejection row (L2-form/L2-goals/L2-sop), so no facet-7 or facet-9
  cell folds three actions — `document_acknowledgements` (L3), `audit_log` insert +
  A6 immutability (L4/L5), `hr_policy_ack_events` append + A6 immutability (L6/L7).
- **C7 applied:** E9 (self/admin line write, DAT-EXP-LINE-SELF) and E10
  (manager-team-delete rejection, REJ-MGR-LINE-DEL — the live A7 USING-vs-WITH-CHECK
  hole) added.
- **C8 applied:** I4 (admin contract write) + I5 (manager contract read reject);
  I6 (owner/employee DELETE path — owner-protection trigger + ON DELETE RESTRICT);
  K1 (admin delete-others) + K2 (employee delete-others reject).
- **C9/C10 applied:** BTN-EXP-RETURN = `Return for correction`; MSG-EXP-* and
  BTN-* line ranges corrected; the §3.B header is per-cell and does not claim
  MAT-LIVE for cells referencing TARGET ordering.
- **F1 applied:** §2 states one alias-fold rule; the M365 row lists A1–A4 with A4
  marked ALIAS-OF A3; the directory row lists B1.10/B1a.10 and B1.11/B1a.11.
- **F2 applied:** every structurally-inapplicable facet 3 is `V-0`.
- **F3 applied:** I1.7 = DAT-POPIA-SELF; the contract-write-by-self rejection lives
  in I3, so no GATE-ADMIN clause sits in facet 7.
- **F4 applied:** B2 is split into the status table (B-EMP-*) and B2-fields (facet
  8 = SCH-NONE). **No conditional/wildcard cell remains in facet 8 or facet 9
  anywhere:** every statechart facet-8 cell is one resolved edge or SCH-NONE, and
  every illegal-transition path is a dedicated rejection row (B-EMP-X01…X13 for
  §3.1, E8 for §3.3, C8-order for §3.6, D1-reject for §3.2) whose facet 9 is a
  single REJ-*-ORDER id — never a `9 if the pair is absent…` conditional embedded
  in an authorized row. Every remaining REJ-*-ORDER cell is a genuinely illegal
  `(old, new)` pair the pair-keyed gate rejects: legal-under-some-event pairs are
  dropped (former X06/X11 in §3.1, O1/O5 in §3.6) and duplicate-event cells
  collapse to one pair each (X09→X08, X16→X14 in §3.1; O4→O3 in §3.6).
- **F5 applied:** G1.7 = DAT-TRAIN-SELF; no raw table+policy names in the cell.
- **F6 applied:** D2.2 = MSG-PENDING-SAVING on BTN-EDIT-PUBLISH until the version write + reset commit (BTN-ACK is employee-only, hidden for admin per the `!isAdmin` gate, so it is not D2's client facet); no inline file:line.
- **F7 applied:** B1a.9 resolves to REJ-RLS via P-PHONE; the HEAD-leak statement
  lives only in the HEAD note + GWT.
- Every authorized row is paired (§4) with rejection (facet 9), error (facet 10),
  and timeout/async (facet 11).

*End of outcome contract. It is subordinate to GOV; where this document and GOV
disagree, GOV's authority matrix and statecharts win and the disagreement is a
defect to be surfaced, never silently brokered.*
