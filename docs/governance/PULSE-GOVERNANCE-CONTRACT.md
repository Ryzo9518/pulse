# Pulse — GOVERNANCE CONTRACT (Backend Phase)

> ✅ **RATIFIED — Ryan de Kock (Owner), 2026-06-17.** Board-certified SIGNED-OFF (single-implementation, zero false [LIVE], no deferred fork). Locked build spec for P4, paired with the deterministic outcome contract.

**Standard:** Fable zero-drift governance. Every normative claim below is tagged
either `[LIVE: file:line]` (verified true against the working tree at HEAD on
2026-06-17) or `[TARGET — to build]` (not yet in the tree; the build must create
it). There are zero un-tagged authority claims. A LIVE tag that cannot be
reproduced from the cited line is a contract defect, not a rounding error.

**Source-of-truth precedence (locked):**
1. `docs/prototype/HANDOFF.md §2` — the human-authored permission matrix. When
   any artifact disagrees with HANDOFF §2, that disagreement is a **bug to be
   surfaced** (see the AUTHORITY CONFLICT call-outs), never silently brokered in
   this document.
2. `database/migrations/002_rls.sql` — the **enforced** authorization boundary.
   RLS is the wire; the UI is not a security boundary
   [LIVE: frontend/lib/capabilities.ts:7].
3. `frontend/lib/capabilities.ts` — the UI mirror of (1), used so the manager
   boundary stays consistent across screens [LIVE: frontend/lib/capabilities.ts:2-7].

Where (2) and (3) disagree, this contract flags it explicitly rather than
pretending one wins by fiat.

**Canonical store:** Postgres (`database/migrations/001_schema.sql`,
`002_rls.sql`, and seed `003_seed.sql`). Authentication is Microsoft 365
(`[TARGET — to build]`, plan B1); **authorization is Pulse's own**
(`employees.role` + `is_owner`) [LIVE: 001_schema.sql:58,61]. M365 supplies
identity only [LIVE: 001_schema.sql:49-52].

---

## §1 Authority & ownership

### 1.1 Absolute rules (invariants)

These hold at every instant for every actor. Each is either enforced now (LIVE)
or owed by the build (TARGET).

- **A1 — Default-deny.** RLS is enabled on every public base table; a table with
  no matching permissive policy returns nothing
  [LIVE: 002_rls.sql:114-119]. The suite asserts zero tables without
  `relrowsecurity` [LIVE: database/test/rls_tests.sql:104-106].
- **A2 — The UI is not the boundary.** Authorization is re-decided at the
  database layer regardless of what the client sends
  [LIVE: 002_rls.sql:3-5; frontend/lib/capabilities.ts:7].
- **A3 — Owner is protected.** Only an owner may grant/revoke admin or owner, and
  an owner cannot be demoted, disabled, or deleted by a non-owner — enforced by a
  `BEFORE UPDATE OR DELETE` trigger, not by policy alone
  [LIVE: 002_rls.sql:75-109].
- **A4 — Managers never touch POPIA/payroll/contract.** Manager is work-related
  team oversight only [LIVE: 002_rls.sql:11-12; HANDOFF.md:47]. The POPIA
  satellites, emergency contacts, and the employment contract are self-or-admin
  only [LIVE: 002_rls.sql:137-161,197-201]. (Scope of "personal data" — see M5:
  the work directory `phone` is read-exposed org-wide today and is tagged
  **[TARGET — B0.5 masked view / column move]**; a fix IS owed
  [LIVE: 002_rls.sql:128-129].)
- **A5 — No self-approval of expenses.** Moving a claim to `approved`/`returned`
  or setting `reviewed_by` requires an approver (admin or the submitter's team
  manager); the submitter cannot rubber-stamp their own draft
  [LIVE: 002_rls.sql:317-334].
- **A6 — Append-only evidence cannot be rewritten.** `audit_log` and
  `hr_policy_ack_events` are FORCE-RLS (RLS applies to the table owner too, not
  just `authenticated`) and have no UPDATE/DELETE policy → mutation denied
  [LIVE: 002_rls.sql:124-125,216-219,282-286].
- **A7 — Money cannot drift.** Totals are `NUMERIC`, never float, and
  `grand_total = total_other + total_travel − total_advances` is a CHECK
  constraint [LIVE: 001_schema.sql:322-337].
- **A8 — Termination is a status change, never a row delete.** Financial/audit
  FKs are `ON DELETE RESTRICT` [LIVE: 001_schema.sql:67,261,319,475].

### 1.2 Single-writer per field

Each governed field has exactly one writer class. Anything else is a forbidden
state (see 1.4).

| Field | Single writer | Enforced by |
|---|---|---|
| `employees.role`, `employees.is_owner` | Owner only | trigger [LIVE: 002_rls.sql:84-93] |
| `employees.status`, `.manager_id`, `.expense_role`, `.department`, `.job_title` | Admin/Owner only | trigger [LIVE: 002_rls.sql:96-104] |
| `employees.display_name`, `.avatar_initials` | System (derive trigger) — never client-set | [LIVE: 001_schema.sql:80-89] |
| POPIA satellites (`employee_personal_info`, `employee_medical_info`, `employee_tax_banking`) | Self or Admin/Owner | [LIVE: 002_rls.sql:137-153] |
| `emergency_contacts` | Self or Admin/Owner | [LIVE: 002_rls.sql:155-161] |
| `contract_uploads` (write) | Admin/Owner only | [LIVE: 002_rls.sql:200-201] |
| `expense_claims` insert | Submitter (self) only | [LIVE: 002_rls.sql:234-235] |
| `expense_claims` → `approved`/`returned`, `reviewed_by` | Approver (Admin/Owner or team Manager) | trigger [LIVE: 002_rls.sql:324-329] |
| `expense_claims` → `paid` | Admin/Owner only | **[TARGET — unguarded at HEAD]** — no single-writer row exists; `claim_upd` lets the submitter set `status='paid'` and the transition trigger only guards `approved`/`returned`/`reviewed_by` [LIVE: 002_rls.sql:237-241,324-325]. Build must add `paid` to the guarded set (Admin/Owner only). |
| `hr_policy_acknowledgements` | Self or Admin/Owner | [LIVE: 002_rls.sql:210-214] |
| `hr_policy_ack_events` | Self or Admin/Owner insert; nobody updates/deletes | [LIVE: 002_rls.sql:216-219] |
| `certifications` (own) | Self or Admin/Owner | [LIVE: 002_rls.sql:309-315] |
| `aa_rate_certificates` (per-person AA pay-rate; payroll/POPIA) | Self or Admin/Owner — no manager branch | [LIVE: 002_rls.sql:262-264] |
| `onboarding_form_completions` (incl. POPIA tax/banking form) | Self or Admin/Owner | [LIVE: 002_rls.sql:191-193] |
| `employee_goals` | Self or Admin/Owner | [LIVE: 002_rls.sql:194-196] |
| `sop_completions` | Self or Admin/Owner | [LIVE: 002_rls.sql:226-228] |
| `document_acknowledgements` | Self or Admin/Owner | [LIVE: 002_rls.sql:279-281] |
| `email_log` | Admin/Owner only | [LIVE: 002_rls.sql:275] |
| `hr_policies`, `documents`, `onboarding_*` templates, `sops`/`sop_steps`, `products` | Admin/Owner only | [LIVE: 002_rls.sql:164-167,205,222-225,277-278,290] |
| `onboarding_workflows`, `onboarding_task_status` (write) | Admin/Owner only | [LIVE: 002_rls.sql:173-174,187-188] |
| `admin_notifications` (send) | Admin/Owner only | [LIVE: 002_rls.sql:273] |
| `audit_log` insert | Self-attributed (any authenticated, but only own `employee_id`) or Admin/Owner | [LIVE: 002_rls.sql:284-285] |

### 1.3 Who-may-write-what matrix (per role, incl. Owner)

Legend: `W` = write, `R` = read, `—` = denied, `(team)` = scoped to the
manager's direct reports, `(self)` = own row only, `(all)` = every row.
**Owner = Admin's full surface, explicitly un-scopeable, plus the protected
authority of A3** [LIVE: 002_rls.sql:8-10,40-49].

| Surface | Employee | Manager | Admin | Owner | Authority |
|---|---|---|---|---|---|
| `employees` work directory | R(all) / W(self) | R(all) / W(self) | R(all) / W(all) | R(all) / W(all) | [LIVE: 002_rls.sql:130-135] (M5: `phone` is read-exposed in the work directory — **[TARGET — B0.5 masked view / column move]**, a fix is owed [LIVE: 002_rls.sql:128-129]) |
| `employees.role` / `is_owner` | — | — | — | W | [LIVE: 002_rls.sql:84-93] |
| `employees` employment fields | — | — | W | W | [LIVE: 002_rls.sql:96-104] |
| POPIA satellites | R/W(self) | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:137-161] |
| `contract_uploads` | R(self) | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:197-201] |
| `onboarding_workflows` | R(self) | R(team) / **W(team) [TARGET]** | R/W(all) | R/W(all) | read [LIVE: 002_rls.sql:170-172]; manager INSERT mandated via `wf_manager_ins` with check `pulse_role()='manager' AND pulse_is_team_member(employee_id)` (the table has only `employee_id` [LIVE: 001_schema.sql:186-192]) (AUTHORITY CONFLICT #1, HANDOFF §2 wins) |
| `onboarding_task_status` | R(self) | R(team, non-hidden, non-`hr` phase) / **W `status` (team, work-phase); `assigned_to` admin-only [TARGET]** | R/W(all) | R/W(all) | read [LIVE: 002_rls.sql:178-186]; manager INSERT+UPDATE mandated via `ots_manager_ins` + `ots_manager_upd`, both scoped by an EXISTS join through `onboarding_workflows` + `onboarding_tasks` (`tk.phase_id <> 'hr'` AND `tk.manager_hidden = false`) — the columns are not on this table [LIVE: 001_schema.sql:196-203]; manager-writable columns limited to `status`, `started_at`, `completed_at`, `completed_by` by a security-definer trigger with separate INSERT and UPDATE arms that forces `assigned_to` to NULL on a manager INSERT and freezes the entire non-writable set (`assigned_to`, `workflow_id`, `task_id`) on a manager UPDATE (F1: "assign task owners" is admin-only [LIVE: HANDOFF.md:42]) (AUTHORITY CONFLICT #1, HANDOFF §2 wins) |
| Schedule onboarding (new starter) | — | **W(team, work-phase); `assigned_to` admin-only [TARGET]** | W | W | HANDOFF §2 wins (AUTHORITY CONFLICT #1): three artifacts — `wf_manager_ins` INSERT on `onboarding_workflows` (`pulse_role()='manager' AND pulse_is_team_member(employee_id)`) + `ots_manager_ins` INSERT and `ots_manager_upd` UPDATE on `onboarding_task_status`, both via an EXISTS join through `onboarding_workflows` + `onboarding_tasks` (`tk.phase_id <> 'hr'` AND `tk.manager_hidden = false`, mirroring [LIVE: 002_rls.sql:181-185]), paired with a security-definer trigger (separate INSERT and UPDATE arms) that forces `assigned_to` to NULL on a manager INSERT and freezes the entire non-writable set (`assigned_to`, `workflow_id`, `task_id`) on a manager UPDATE ("assign task owners" admin-only [LIVE: HANDOFF.md:42]); capability LIVE in UI mirror [LIVE: capabilities.ts:53-58], RLS admin-only at HEAD [LIVE: 002_rls.sql:173-174,187-188] until the grant lands |
| `hr_policies` publish | — | — | W | W | [LIVE: 002_rls.sql:205] |
| `hr_policy_acknowledgements` | R/W(self) | R(team) | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:207-214] |
| `expense_claims` submit | W(self) | W(self) | W(all) | W(all) | [LIVE: 002_rls.sql:234-235] |
| `expense_claims` approve/return | — | W(team) | W(all) | W(all) | [LIVE: 002_rls.sql:324-329]; **at HEAD `claim_upd` USING+CHECK grant a manager full-column UPDATE of every field of a team claim incl. monetary fields [LIVE: 002_rls.sql:237-241]; mandated fix removes the manager branch from `claim_upd` so managers act on team claims ONLY via the guarded `enforce_expense_transition` trigger [LIVE: 002_rls.sql:324-329] — see BLOCKER 3** |
| `expense_claims` → `paid` | — | — | **W [TARGET — unguarded at HEAD]** | **W [TARGET]** | [LIVE: 002_rls.sql:237-241,324-325] (see 1.2) |
| `certifications` | R/W(self) | R(team) | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:306-315] |
| `aa_rate_certificates` (AA pay-rate; payroll/POPIA) | R/W(self) | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:262-264] (no manager branch — load-bearing under A4: Manager NEVER payroll) |
| `expense_*_lines` (travel/other/advance; rand amounts, A7) | R/W(self) | **R(team) only [TARGET]** | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:246-260] — at HEAD the manager-team disjunct sits in the `_all` policy's **USING** [LIVE: 002_rls.sql:254], which governs DELETE, so a manager can delete a team line row and mutate totals (A7). **Mandated fix (F3, single mechanism [TARGET — to build]):** remove the manager-team disjunct from the USING of all three `_all` policies; manager line reach is **SELECT-only**. Vehicle: split each `_all` into a `_sel` SELECT policy carrying the manager-team read branch plus a `_self` FOR-ALL policy whose USING and WITH CHECK are self-or-admin only (no manager branch in either) |
| `onboarding_form_completions` (POPIA tax/banking form) | R/W(self) | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:191-193] |
| `employee_goals` | R/W(self) | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:194-196] |
| `sop_completions` | R/W(self) | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:226-228] |
| `document_acknowledgements` | R/W(self) | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:279-281] (§4 derived-stage row depends on these) |
| `email_log` | — | — | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:275] |
| `training_status` / `training_progress` | R/W(self) | **W(self); R(team) [TARGET — RLS currently org-wide]** | R/W(all) | R/W(all) | write [LIVE: 002_rls.sql:294-296,300-302] unchanged; read [LIVE: 002_rls.sql:292-293,298-299] is org-wide at HEAD; mandated fix **REPLACES** the `pulse_is_staff()` disjunct in `ts_sel`/`tp_sel` with `pulse_is_admin() OR (manager AND pulse_is_team_member(employee_id))` — **see BLOCKER 1** |
| `documents` manage | R(active) | R(active) | R/W(all) | R/W(all) | [LIVE: 002_rls.sql:277-278] |
| `admin_notifications` (Notify All) | R | R | W | W | [LIVE: 002_rls.sql:272-273] |
| `messages` (Ask-HR history) | R/W(self) | R/W(self) | R(all)+delete / W(self) | R(all)+delete / W(self) | [LIVE: 002_rls.sql:268-270] — **note M7: `for all` ⇒ Admin/Owner may DELETE others' messages** |
| `audit_log` | W(self-attributed); R— | W(self-attributed); R— | W(all); R(all) | W(all); R(all) | [LIVE: 002_rls.sql:284-286] |

### 1.4 Every illegal state is describable as forbidden

- A manager reading any POPIA satellite, emergency contact, or contract row →
  forbidden [LIVE: 002_rls.sql:137-161,197-201; rls_tests.sql:33-37].
- A submitter approving/returning/`reviewed_by`-stamping their own claim →
  forbidden [LIVE: 002_rls.sql:324-329].
- A submitter self-setting `status='paid'` → **NOT yet forbidden**
  **[TARGET — unguarded at HEAD]** (1.2, BLOCKER 5b).
- A non-owner changing `role`/`is_owner`, or demoting/deleting an owner →
  forbidden [LIVE: 002_rls.sql:84-93; rls_tests.sql:110-133].
- A user self-promoting status/manager/expense_role → forbidden
  [LIVE: 002_rls.sql:96-104].
- Any UPDATE/DELETE of `audit_log` or `hr_policy_ack_events` → forbidden
  [LIVE: 002_rls.sql:124-125,216-219,282-286].
- `grand_total` inconsistent with its parts → forbidden
  [LIVE: 001_schema.sql:335-337].
- An out-of-sequence lifecycle transition (e.g. `draft → paid`,
  `terminated → active`) → **NOT yet forbidden** **[TARGET — to build]**
  (BLOCKER 5a/5c; §3).

> **AUTHORITY CONFLICT #1 — `scheduleOnboarding` (Manager).**
> HANDOFF §2 grants Manager "Schedule onboarding (new starter)"
> [LIVE: HANDOFF.md:39,67] and `capabilities.ts` mirrors it
> [LIVE: frontend/lib/capabilities.ts:53-58]. But scheduling writes
> `onboarding_workflows` + `onboarding_task_status`, both of which are
> **admin/owner-only** in RLS [LIVE: 002_rls.sql:173-174,187-188]. Per the
> locked precedence (HANDOFF §2 wins), this resolves to a single grant; the UI
> offers an action the database currently denies, so a manager pressing
> "Schedule" would hit a write failure until the grant below lands.
> **Mandated resolution (HANDOFF §2 wins) — two distinct policies, because the
> two target tables carry different columns [TARGET — to build]:** the columns
> `phase_id` and `manager_hidden` live on **neither** target table —
> `onboarding_workflows` has only `employee_id`
> [LIVE: 001_schema.sql:186-192] and `onboarding_task_status` has none of
> `employee_id`/`phase_id`/`manager_hidden` [LIVE: 001_schema.sql:196-203]
> (phase/hidden membership is reachable only by joining through
> `onboarding_tasks`). A single flat predicate is therefore impossible; state
> two policies:
> - **`wf_manager_ins`** — an **INSERT** policy on `onboarding_workflows` with
>   `with check (pulse_role() = 'manager' AND
>   pulse_is_team_member(employee_id))`. (`onboarding_workflows.employee_id`
>   exists [LIVE: 001_schema.sql:188], matching the `wf_sel` manager read scope
>   at [LIVE: 002_rls.sql:170-172].)
> - **`ots_manager_ins`** (INSERT) **and `ots_manager_upd`** (UPDATE) — two
>   policies on `onboarding_task_status` (split per HANDOFF §2: a manager may
>   create and "track its work tasks"). Both are gated by the **same** `EXISTS`
>   team + work-phase join through `onboarding_workflows` + `onboarding_tasks`,
>   mirroring `ots_sel` [LIVE: 002_rls.sql:181-185]:
>   `pulse_role() = 'manager' AND exists (select 1 from onboarding_workflows w
>   join onboarding_tasks tk on tk.id = onboarding_task_status.task_id where
>   w.id = workflow_id and pulse_is_team_member(w.employee_id) and
>   tk.manager_hidden = false and tk.phase_id <> 'hr')`
>   (`ots_manager_ins` carries it in WITH CHECK; `ots_manager_upd` carries it in
>   both USING and WITH CHECK).
> - **HARD CONSTRAINT (F1) — the manager grant is row-level, never column-level.**
>   RLS cannot restrict *which columns* a manager writes, and "assign task owners"
>   is **ADMIN-ONLY** [LIVE: HANDOFF.md:42]. The two policies above must therefore
>   be paired with a security-definer trigger on `onboarding_task_status` whose
>   INSERT and UPDATE arms are **separate predicates** — the INSERT arm never
>   references `OLD`:
>   - **`BEFORE INSERT` arm:** raise if `pulse_role() = 'manager'` AND
>     `new.assigned_to IS NOT NULL`. A manager INSERT must force `assigned_to` to
>     `NULL`; a manager may never choose a task owner at creation.
>   - **`BEFORE UPDATE` arm:** raise if `pulse_role() = 'manager'` AND
>     `new.assigned_to IS DISTINCT FROM old.assigned_to` (plus the rest of the
>     non-writable column set — see F1 column-freeze in §1.3 / BLOCKER 2).
>
>   A manager may write **only** `status`, `started_at`, `completed_at`,
>   `completed_by` on a qualifying row; `assigned_to` stays admin-only. The
>   "non-`assigned_to` column allowlist inside RLS" path is impossible (RLS is
>   row-level) and the freeze lives in this one trigger, not scattered.
>
> Set the §1.3 authority-matrix manager onboarding cell to `status =
> W(team, work-phase)`, `assigned_to = admin-only`; require **positive** (manager
> sets `status` on a team member's work-phase task), **negative-phase** (manager
> blocked on `hr`-phase / `manager_hidden` task, and on a non-team employee),
> **negative-insert** (a manager INSERT with a non-null `assigned_to` is
> **BLOCKED**), **negative-assign** (manager BLOCKED from setting
> `assigned_to` on an otherwise qualifying team work-phase row), and
> **negative-repoint** (manager BLOCKED from re-pointing `task_id` or
> `workflow_id` on a qualifying team work-phase row) tests in
> `rls_tests.sql`.
> **Rejected alternative:** strip the capability from `capabilities.ts` and
> correct HANDOFF §2 ("capabilities.ts loses"). Rejected because the locked
> precedence makes HANDOFF §2 authoritative; the database must conform to the
> human-authored matrix, not the reverse.

---

## §2 (reserved — folded into §1 authority and §3 statecharts)

---

## §3 Formal statecharts (Harel / XState style)

Notation: `state --event[guard]--> state`; `entry:` / `exit:` actions noted
inline. Illegal states are listed as *unrepresentable* targets the build must
make impossible. **Where a machine is only a bare enum today with no SQL
transition table, it is tagged TARGET — the column exists, the ordering does
not.**

### 3.1 Employee onboarding status

`employee_status` is a **bare enum** with no transition table
[LIVE: 001_schema.sql:25]; only the privileged-change trigger decides *who* may
write `status` [LIVE: 002_rls.sql:96-104], not *what order*. The ordering machine
below is therefore **[TARGET — to build]** as a SQL transition guard.

```
states: onboarding, probation, active, suspended, terminated
         (enum members [LIVE: 001_schema.sql:25])
initial: the column default is 'active' [LIVE: 001_schema.sql:62]; routing new
         hires to 'onboarding' on creation is [TARGET — to build] (no artifact
         at HEAD sets a new hire's status to 'onboarding')

onboarding  --complete_onboarding[admin]--> probation
probation   --confirm[admin]-------------> active
active      --suspend[admin]-------------> suspended
suspended   --reinstate[admin]-----------> active        # deterministic target
active      --terminate[admin]-----------> terminated    # TERMINAL
probation   --terminate[admin]-----------> terminated
suspended   --terminate[admin]-----------> terminated
onboarding  --terminate[admin]-----------> terminated

entry(any change): write audit_log row in same txn  [TARGET]
guard(all): pulse_is_admin()  [LIVE: 002_rls.sql:96-104]
```

Pair table (the deterministic target the build must enforce; a blank cell =
illegal) **[TARGET — to build]**. **The runtime carries no event token** — the
status write path passes only the new status, so this machine keys on the
`(old.status, new.status)` **pair**, not on `(old, event, new)` triples. The
columns below are the *destination* status, and each non-blank cell names the
event whose edge that legal pair realizes. **Enforcement vehicle (identical
pattern; §3.2 compares a derived state):** transition ordering is enforced by a
`BEFORE UPDATE` trigger — **GATE-EMP-ORDER** — that rejects any
`(old.status, new.status)` pair absent from this table; the table is the single
source — no second copy in app code.

| from \ to | onboarding | probation | active | suspended | terminated |
|---|---|---|---|---|---|
| onboarding | — | probation (complete_onboarding) | — | — | terminated (terminate) |
| probation | — | — | active (confirm) | — | terminated (terminate) |
| active | — | — | — | suspended (suspend) | terminated (terminate) |
| suspended | — | — | active (reinstate) | — | terminated (terminate) |
| terminated | — | — | — | — | — |

There are **8 legal pairs** (the non-blank cells) and therefore **17 illegal
pairs** in the full 5×5 pair space. The outcome contract's enumerated rejection
set (B-EMP-X01…X13) covers the **13 distinct illegal pairs** reachable from the
prior event-keyed enumeration; the remaining 4 illegal pairs
(`probation→onboarding`, `active→onboarding`, `suspended→onboarding`,
`terminated→onboarding`) are equally rejected by GATE-EMP-ORDER as pairs absent
from this table.

Rationale — the blank `→suspended` cells (`onboarding`/`probation`/`suspended`
→ `suspended`): **suspend is legal only from `active`**. An employee not yet
confirmed (onboarding/probation) or already suspended has no active engagement
to suspend, so those pairs are illegal by design, not omission. The
`→active` cells are legal only from `probation` (confirm) and `suspended`
(reinstate); a `→active` write from any other state (including `active→active`
and `terminated→active`) is an illegal pair.

Caption: this table assumes a **created row**. The
creation -> initial-state step (a new hire entering `onboarding`) is a separate
**[TARGET]** — the column default is `active` [LIVE: 001_schema.sql:62], and
routing new hires to `onboarding` on creation is not yet built (see the
`initial:` note above).

Illegal states (must be unrepresentable) **[TARGET — to build]**:
- `terminated → active` (resurrection of a terminated employee).
- Skip-ahead `onboarding → active` bypassing probation.
- Any same-status self-loop pair (`onboarding→onboarding`, `probation→probation`,
  `active→active`, `suspended→suspended`, `terminated→terminated`): a status write
  whose new value equals the old is not a transition.
- Any `status` write by a non-admin [LIVE-blocked: 002_rls.sql:96-104].
- Out-of-sequence pair (any blank cell above), rejected by GATE-EMP-ORDER on the
  `(old.status, new.status)` pair.

> Resolution note (BLOCKER 5c): the earlier `reinstate → (back to prior)`
> notation was non-deterministic; it is replaced by the deterministic
> `suspended → active`. If "return to the exact prior state" is later required,
> introduce an explicit XState **history state** (`H`) on the active/suspended
> region — but never an under-specified "prior".

### 3.2 The 24-policy acknowledgement gate

24 policies seeded (HR001–HR024)
[LIVE: `grep -oE 'HR0[0-9][0-9]' database/migrations/003_seed.sql | sort -u | wc -l` = 24];
HANDOFF says publishing a new version **resets all acknowledgements**
[LIVE: HANDOFF.md:80].

```
per (employee × policy):
  unacknowledged --read_started--> reading
  reading        --acknowledge[employee_id = self OR admin]--> acknowledged
                   entry: append hr_policy_ack_events row (version-stamped, append-only)
  acknowledged   --publish_new_version[admin]--> unacknowledged   # reset current ack
                   exit (reset actions) [TARGET — owner: AFTER UPDATE OF version
                         ON hr_policies trigger, security definer; see F5]:
                         read_started_at := NULL; acknowledged := false;
                         acknowledged_at := NULL; recompute policies_completed
                   invariant: the prior ack_events row SURVIVES (proof preserved)

gate(employee): policies_completed == true  iff  every active policy acknowledged
```

State×event table (deterministic target; a blank cell = illegal)
**[TARGET — to build:** no SQL transition table exists; the ordering below is
not enforced — see the read-before-ack note**]**. **Enforcement vehicle
(identical pattern; §3.2 compares a derived state):** because
`hr_policy_acknowledgements` has **no `status` column** — only `acknowledged`
boolean, `read_started_at`, `acknowledged_at`
[LIVE: 001_schema.sql:263-265] — the `(old.status, new.status)` formulation
used in §3.1/§3.3 is mechanically impossible here. The vehicle is therefore a
`BEFORE INSERT OR UPDATE` trigger that **derives** the state
`s := (acknowledged ? 'acknowledged' : read_started_at is not null ? 'reading'
: 'unacknowledged')` and rejects any `(old s, new s)` pair absent from the
transition table above; on INSERT it treats `old s := 'unacknowledged'`. A
`BEFORE UPDATE`-only trigger would never fire on the direct-ack path, because
acks are **created by INSERT** (`ack_self_ins` [LIVE: 002_rls.sql:210-211]), not
by UPDATE of a pre-existing row. The transition table is the single source — no
second copy in app code.

| from \ event | read_started | acknowledge | publish_new_version |
|---|---|---|---|
| unacknowledged | reading | — | unacknowledged |
| reading | — | acknowledged | unacknowledged |
| acknowledged | — | — | unacknowledged |

- The `unacknowledged --publish_new_version--> unacknowledged` cell is a **legal
  idempotent no-op (self-loop)**, not illegal: republishing a policy an employee
  has not yet acknowledged leaves the gate open, matching HANDOFF's reset
  semantics [LIVE: HANDOFF.md:80].
- Current ack writable by self/admin
  [LIVE: 002_rls.sql:210-214 (`ack_self_ins` 210-211, `ack_self_upd` 212-214)].
- Evidence append-only, never erased on republish
  [LIVE: 001_schema.sql:270-279; 002_rls.sql:216-219].
- **`policies_completed` is a derived gate — server/trigger-maintained, never
  client-set** **[TARGET — to build]** (today it is a plain column
  [LIVE: 001_schema.sql:71]). **Canonical predicate (F6):**
  `policies_completed := NOT EXISTS (an is_active policy with no acknowledged ack
  for the employee)` — equivalently every active policy is acknowledged. This is
  the same `is_active` denominator the view must use; see F6 below, which
  redefines `admin_onboarding_summary.policies_done`
  [LIVE: 001_schema.sql:551] to add the `is_active` join so the view and the gate
  compute identically. The bare count-of-acknowledged form is **superseded** by
  the NOT-EXISTS predicate. The maintaining trigger recomputes it on the
  INSERT/UPDATE surfaces that move acks — `hr_policy_acknowledgements`
  insert/update [LIVE: 002_rls.sql:210-214] — and on the ack-reset (below), so a
  republished policy re-opens the gate (per HANDOFF reset [LIVE: HANDOFF.md:80]).
- **Ack-reset vehicle (F5) — previously genuinely undefined.** The reset on
  `publish_new_version` had no named owner (the lines earlier cited for it,
  002_rls.sql:306-315, are actually the `certifications` policies — the wrong
  table). The vehicle is an **`AFTER UPDATE OF version ON hr_policies` trigger
  (security definer)** that, for every `hr_policy_acknowledgements` row of the
  policy whose `version` changed, sets `acknowledged = false`,
  `read_started_at = NULL`, `acknowledged_at = NULL`
  [LIVE: 001_schema.sql:263-265] and recomputes `policies_completed` for each
  affected employee per the F6 predicate. The prior `hr_policy_ack_events`
  evidence rows are **untouched** (append-only, A6
  [LIVE: 002_rls.sql:216-219]). An **application-layer reset is REJECTED** — the
  reset is owned by this database trigger so it cannot be bypassed by a client
  that simply does not re-publish through the app.
- **The `read_started → reading → acknowledge` ordering is NOT enforced.** A
  `read_started_at timestamptz` column exists [LIVE: 001_schema.sql:264], so
  `reading` is partially representable, but **no guard requires
  `read_started_at IS NOT NULL` before an ack**: `ack_self_ins` permits a direct
  ack insert and `ack_self_upd` permits the `acknowledged` state with no read
  precondition [LIVE: 002_rls.sql:210-214]. `reading` is therefore **[TARGET —
  read-before-ack guard not enforced]**, not a LIVE gating state; the ordering is
  aspirational until the guard is built.

Illegal states: acknowledging on behalf of another non-self employee while
non-admin → forbidden [LIVE: 002_rls.sql:211]; deleting ack evidence →
forbidden [LIVE: 002_rls.sql:216-219]. Acknowledging without a prior
`read_started` → **NOT yet forbidden** **[TARGET — read-before-ack guard not
enforced; ack_self_ins/upd at 002_rls.sql:210-214 permit direct ack]**.

### 3.3 Expense-claim lifecycle

`expense_status` enum: `draft, submitted, approved, returned, paid`
[LIVE: 001_schema.sql:28] — a **bare enum with no SQL transition table**; the
transition trigger constrains *who* approves/returns, not *order*
[LIVE: 002_rls.sql:321-334]. Ordering is **[TARGET — to build]**.

```
draft     --submit[employee_id = self]-----------> submitted
            entry: set submitted_at
submitted --approve[approver: admin OR team-manager]--> approved
submitted --return[approver]----------------------> returned
returned  --resubmit[employee_id = self]---------> submitted
approved  --mark_paid[admin ONLY]----------------> paid   # TERMINAL
            guard: TARGET — unguarded at HEAD (see 1.2 / BLOCKER 5b)

guard(approve|return|set reviewed_by):
  pulse_is_admin() OR (manager AND team_member(employee_id))
  [LIVE: 002_rls.sql:324-329]
guard(mark_paid) — DISTINCT branch, NOT the approver actor test [TARGET]:
  if new.status is distinct from old.status and new.status = 'paid'
     then require pulse_is_admin()   # admin/owner only — NOT the
                                     # admin-or-team-manager approver set
  legal predecessor: only approved -> paid
hard rule: a submitter may not approve/return their own claim (A5)
```

This table governs **STATUS transitions only**; field-freeze invariants (which
columns a manager or submitter may rewrite, e.g. monetary fields after submit)
have a single owner — the added monetary-freeze branch inside
`enforce_expense_transition` (F4 / BLOCKER 3) — not here, and not duplicated in a
second trigger, CHECK, or RLS allowlist.

State×event table (deterministic target; blank = illegal) **[TARGET — to
build]**. **Enforcement vehicle (identical pattern; §3.2 compares a derived
state):** transition ordering is enforced by a `BEFORE UPDATE` trigger that
rejects any `(old.status, new.status)` pair absent from the transition table
above; that table is the single source — no second copy in app code. (The
existing
`enforce_expense_transition` trigger constrains *who* may approve/return and the
`mark_paid` actor; the ordering check is the additional rejection rule this
vehicle adds.)

| from \ event | submit | approve | return | resubmit | mark_paid |
|---|---|---|---|---|---|
| draft | submitted | — | — | — | — |
| submitted | — | approved | returned | — | — |
| returned | — | — | — | submitted | — |
| approved | — | — | — | — | paid |
| paid | — | — | — | — | — |

Illegal states (must be unrepresentable):
- Self-approval [LIVE-blocked: 002_rls.sql:324-329].
- `draft → paid` / submitter self-setting `paid` **[TARGET — unguarded at HEAD]**
  (1.2, BLOCKER 5b).
- A submitter editing a submitted/approved claim back toward `draft`, or mutating
  monetary fields after submit → **NOT yet forbidden** **[TARGET — `claim_upd`
  has no status-freeze guard, 002_rls.sql:237-241]**. Monetary-field immutability
  once `status NOT IN ('draft','returned')` is owned by the single added branch
  inside `enforce_expense_transition` (F4 / BLOCKER 3) — not a separate trigger,
  CHECK, or RLS allowlist. Status-ordering (the `back toward draft` half) is the
  §3.3 transition-table guard (BLOCKER 5a).
- Out-of-sequence transition (any blank cell) **[TARGET — to build]**
  (BLOCKER 5a).

### 3.4 Certification expiry

Single classifier `certExpiryInfo`
[LIVE: frontend/lib/mock/certifications.ts:199-207].

```
states: none(no expiry), valid(>60d), soon(0..60d), expired(<0d)
classify(expiry, today):
  expiry == null              -> none      [LIVE: certifications.ts:200]
  days < 0                    -> expired   [LIVE: certifications.ts:204]
  days <= 60                  -> soon      [LIVE: certifications.ts:205]
  else                        -> valid     [LIVE: certifications.ts:206]

valid --time(days<=60)--> soon --time(days<0)--> expired
```

This is **derived from the row's `expiry` date + the current date**, not a stored
state column — it cannot enter an illegal state because it is a total function of
its inputs. Only product certs carry `expiry`; the schema CHECK forbids a
graduate cert from having one [LIVE: 001_schema.sql:531-534]. **Canonical
downstream identifier for the amber state is `soon`** [LIVE: certifications.ts:205];
all code and derived values must use `soon`. "expiring" (HANDOFF:81) is **display
copy only** [LIVE: HANDOFF.md:81], never an identifier.

### 3.5 The 4-stage billable ladder

Single classifier `billableStage`
[LIVE: frontend/lib/mock/training.ts:748-757]; stage type
`'pre' | 'supervised' | 'ilt' | 'certified'`
[LIVE: frontend/types/database.ts:639].

```
states: pre, supervised, ilt, certified
classify(d):
  d.certified            -> certified   [LIVE: training.ts:753]
  d.ilt_done             -> ilt         [LIVE: training.ts:754]
  d.getting_started_done -> supervised  [LIVE: training.ts:755]
  else                   -> pre         [LIVE: training.ts:756]

pre --getting_started_done--> supervised --ilt_done--> ilt --certified--> certified
```

Dated milestones (projection, not state):
- supervised ≈ start_date + 7 days
  [LIVE: training.ts:32 (`SUPERVISED_OFFSET_DAYS = 7`)].
- ilt = entered ILT date [LIVE: training.ts:772].
- certified ≈ ILT date + 10 days
  [LIVE: training.ts:35 (`CERT_PREP_DAYS = 10`)].

Illegal states are unrepresentable: the classifier is a pure total function of
three booleans, so every input maps to exactly one stage
[LIVE: training.ts:748-757].

### 3.6 Onboarding task status

`onboarding_task_status.status` is the `task_status` enum
`pending, inprogress, done` [LIVE: 001_schema.sql:26,200]. The table carries the
work-tracking columns `status, started_at, completed_at, completed_by` plus the
admin-only `assigned_to` and the structural keys `workflow_id, task_id`
[LIVE: 001_schema.sql:196-205]. Like §3.1/§3.3 the enum is **bare** — no SQL
transition table exists, so the ordering machine below is
**[TARGET — to build]** as a SQL transition guard, paired with the manager
column-freeze trigger of AUTHORITY CONFLICT #1 / BLOCKER 2.

```
states: pending, inprogress, done
        (task_status enum members [LIVE: 001_schema.sql:26])
initial: the column default is 'pending' [LIVE: 001_schema.sql:200]

pending     --start[admin|manager-team-workphase]----> inprogress
              entry: set started_at := now()
inprogress  --complete[admin|manager-team-workphase]-> done
              entry: set completed_at := now(); set completed_by := actor
done        --reopen[admin|manager-team-workphase]---> inprogress
              exit: clear completed_at := NULL; clear completed_by := NULL
pending     --complete[admin|manager-team-workphase]-> done   # direct-tick fast path
              entry: set completed_at := now(); set completed_by := actor
inprogress  --reset[admin|manager-team-workphase]----> pending
              exit: clear started_at/completed_at/completed_by := NULL
done        --reset[admin|manager-team-workphase]----> pending
              exit: clear started_at/completed_at/completed_by := NULL

guard(all transitions): pulse_is_admin()
  OR (pulse_role()='manager' AND the EXISTS team+work-phase join through
      onboarding_workflows + onboarding_tasks: pulse_is_team_member(w.employee_id)
      AND tk.manager_hidden = false AND tk.phase_id <> 'hr')
  [LIVE-read: 002_rls.sql:181-185; manager write TARGET via ots_manager_ins /
   ots_manager_upd, BLOCKER 2]
```

**Manager-writable allowlist (column-level, enforced by the BLOCKER 2 trigger,
not by RLS):** a manager may write **only** `status, started_at, completed_at,
completed_by` on a qualifying row. `assigned_to, workflow_id, task_id` are
**frozen** to managers; `assigned_to` is admin-only ("assign task owners"
[LIVE: HANDOFF.md:42]).

**BEFORE-trigger freeze (the security-definer trigger of AUTHORITY CONFLICT #1 /
BLOCKER 2, separate INSERT and UPDATE arms; the INSERT arm never references
`OLD`):**
- **`BEFORE INSERT` arm:** raise if `pulse_role()` is manager AND
  `new.assigned_to IS NOT NULL` — a manager INSERT forces `assigned_to` to NULL.
- **`BEFORE UPDATE` arm:** raise if `pulse_role()` is manager AND
  (`new.assigned_to IS DISTINCT FROM old.assigned_to` OR
  `new.workflow_id IS DISTINCT FROM old.workflow_id` OR
  `new.task_id IS DISTINCT FROM old.task_id`).

Pair table (the deterministic target the build must enforce; a blank cell =
illegal) **[TARGET — to build]**. **The LIVE write path is event-less** —
`frontend/app/workflow/WorkflowBoard.tsx:126-147` calls
`setTaskStatus(task.id, status)` with no event token, so this machine keys on the
`(old.status, new.status)` **pair**, not on `(old, event, new)` triples. The
columns below are the *destination* status and each non-blank cell names the event
whose edge that legal pair realizes. **Enforcement vehicle (identical pattern to
§3.1/§3.3):** a `BEFORE UPDATE` trigger — the **GATE-OTS-ORDER** ordering gate —
rejects any `(old.status, new.status)` pair absent from the table below; that
table is the single source — no second copy in app code. On INSERT the seed state
is `pending` (the column default), so an INSERT may only land on `pending` or, on
the direct-tick fast path, `done`.

| from \ to | pending | inprogress | done |
|---|---|---|---|
| pending | — | inprogress (start) | done (complete) |
| inprogress | pending (reset) | — | done (complete) |
| done | pending (reset) | inprogress (reopen) | — |

There are **6 legal pairs** (the non-blank cells) and therefore **3 distinct
illegal pairs** in the full 3×3 pair space: the 3 self-loops `pending→pending`,
`inprogress→inprogress`, `done→done` (a write whose new status equals the old is
not a transition). Every other pair is legal: in particular `done→inprogress` is
the legal `reopen` pair (T-OTS-4) — exactly what live advance emits when a `done`
task is re-activated — and `pending→inprogress` is the legal `start` pair
(T-OTS-1).

Rationale — the only illegal pairs are the self-loops. `start`
(`pending→inprogress`), `complete` (`pending→done`, `inprogress→done`), `reopen`
(`done→inprogress`), and `reset` (`inprogress→pending`, `done→pending`) cover
every off-diagonal pair, so the off-diagonal is fully legal and only the three
identity self-loops remain illegal.

Illegal states (must be unrepresentable) **[TARGET — to build]**:
- A manager write of `assigned_to`/`workflow_id`/`task_id` on any row → forbidden
  by the BEFORE-trigger freeze above (BLOCKER 2).
- A manager write on an `hr`-phase or `manager_hidden` task, or a non-team
  employee's task → forbidden by the EXISTS guard (`ots_manager_ins` /
  `ots_manager_upd`, [LIVE-read: 002_rls.sql:181-185]).
- A same-status self-loop pair (`pending→pending`, `inprogress→inprogress`,
  `done→done`) → forbidden by GATE-OTS-ORDER as a pair absent from the table.

GATE-OTS-ORDER is the named ordering gate this section introduces; the outcome
contract references the single resolved 3.6 edge for each task-status action and
`assigned_to` is routed to its own admin-only write, never folded into the status
edge.

---

## §4 Derived stage machine (one classifier rule)

Every "stage"/"status" a screen shows is **computed from canonical data by
exactly one classifier**, never stored as a second source of truth:

| Derived value | Single classifier | Inputs (canonical) |
|---|---|---|
| Cert expiry traffic-light | `certExpiryInfo` [LIVE: certifications.ts:199] | `certifications.expiry` [LIVE: 001_schema.sql:527] + today |
| Billable stage | `billableStage` [LIVE: training.ts:748] | `training_status` flags [LIVE: 001_schema.sql:500-502] |
| Billable milestone dates | `computeMilestones` [LIVE: training.ts:766] | `employees.start_date` + `training_status.ilt_date` [LIVE: 001_schema.sql:68,499] |
| Onboarding summary counts | `admin_onboarding_summary` view (`security_invoker`) [LIVE: 001_schema.sql:544-556] | form/sop/policy completion tables |
| Pending approvals | `pending_expense_approvals` view (`security_invoker`) [LIVE: 001_schema.sql:564-571] | `expense_claims.status='submitted'` |

Rule: when the backend swap lands, derived values move into SQL/triggers/views
but the **count of classifiers stays one per concept** — no screen recomputes a
stage with its own ad-hoc logic. The mock classifiers above are the reference
specification their SQL replacements must match. **[TARGET — to build:** the
SQL-side derivations for `policies_completed` and `onboarding_completed`, today
plain columns [LIVE: 001_schema.sql:71-72].**]**

**F6 — `policies_completed` and the summary view must compute identically.** The
gate is locked to a single predicate:
`policies_completed := NOT EXISTS (an is_active hr_policy with no acknowledged
hr_policy_acknowledgements row for the employee)`. The view's `policies_done`
[LIVE: 001_schema.sql:551] is redefined to add the **`is_active` join** —
`count(*) from hr_policy_acknowledgements a join hr_policies p on p.id = a.policy_id
where a.employee_id = e.id and a.acknowledged and p.is_active` — so the view and
the gate share one denominator (`policies_total` already counts only
`is_active` policies [LIVE: 001_schema.sql:552]). The **bare
count-of-acknowledged form** (`count(*) where a.acknowledged`, ignoring
`is_active` [LIVE: 001_schema.sql:551]) is **superseded**: it can count acks for
deactivated policies and so disagree with the gate.

---

## §5 One pipeline / single source

- **Canonical store = Postgres.** All authority lives in
  `001_schema.sql` / `002_rls.sql` / `003_seed.sql`
  [LIVE: 001_schema.sql:1-19; 002_rls.sql:1-16].
- **Mock seam swap point = `frontend/lib/mock/index.ts`** — the single place
  where every screen's reads/writes resolve [LIVE: frontend/lib/mock/index.ts
  present; the plan names it the one seam, plan:13 — throughout this contract
  `plan:NN` refers to line NN of
  `docs/plans/2026-06-15-002-feat-pulse-backend-phase-plan.md`]. Swapping the accessor bodies
  to real async queries is the entire B2 workstream
  [TARGET — to build, plan:104].
- **`capabilities.ts` ↔ RLS must agree.** `capabilities.ts` is the UI mirror of
  HANDOFF §2 [LIVE: capabilities.ts:2-7]; RLS is the enforced copy
  [LIVE: 002_rls.sql:3]. This contract records every place they currently
  disagree (AUTHORITY CONFLICT #1; BLOCKER 1) so the disagreement is visible, not
  silently resolved.
- **Mock layer is dev-only and must never engage in production** — behind a
  build-time flag [TARGET — to build, plan:84].

---

## §6 LIVE-STATE LEDGER

Verified at HEAD (2026-06-17) by direct read/grep of the working tree. Each row
is reproducible from the citation.

| Claim | Status | Evidence |
|---|---|---|
| 33 tables in canonical schema | LIVE | `grep -c '^create table' 001_schema.sql` = 33 |
| 7 RLS helper functions (`pulse_*`) | LIVE | 002_rls.sql:30,35,40,46,52,58,68 |
| FORCE RLS on `audit_log` + `hr_policy_ack_events` | LIVE | 002_rls.sql:124-125 |
| 67 RLS policies at runtime (NOT 59) | LIVE | inline recipe: `grep -c '^create policy ' 002_rls.sql` = 55 static (anchored, literal), **plus** the two `do`-block loops that `execute format(...)` create — 3 POPIA satellite tables × 3 policies (`_sel`/`_ins`/`_upd`, templates at 002_rls.sql:144,146,148) + 3 expense-line tables × 1 policy (`_all`, template at 002_rls.sql:252) = 9 + 3 = 12 → **55 + 12 = 67**. The old `grep -ic 'create policy'` = 59 double-counts those 4 indented template lines (case-insensitive, unanchored) and is rejected as the recipe. |
| 33 RLS assertions PASS (the suite's persona assertions; NOT "219", which is the count of frontend unit tests, plan:13) | LIVE | run `bash database/test/verify.sh`; RLS assertions execute at database/test/verify.sh:26; success echo at database/test/verify.sh:27 (script is 27 lines total) |
| 31 `_expect()` assertion calls (plus the helper definition at rls_tests.sql:10 and the teardown drop at rls_tests.sql:141) | LIVE | `grep -c '_expect('` = 33 total − def(:10) − drop(:141) = 31 |
| 6 `RLS FAIL` raises — 5 standalone (rls_tests.sql:52,114,118,126,130) plus the raise inside `_expect` at rls_tests.sql:14 | LIVE | `grep -cE "raise exception 'RLS FAIL" rls_tests.sql` = 6 (the older `grep -c 'RLS FAIL '` with a trailing space returns 1 and is rejected as the recipe); :53,:116,:128 are `like 'RLS FAIL%'` re-raise *checks*, not raises |
| 24 HR policies (HR001–HR024); NOT 20 | LIVE | `grep -oE 'HR0[0-9][0-9]' 003_seed.sql \| sort -u \| wc -l` = 24 |
| Unauthenticated `/api/email` route DELETED | LIVE | `frontend/app/api/email/` absent |
| `frontend/lib/resend.ts` DELETED | LIVE | file absent |
| Owner protection trigger | LIVE | 002_rls.sql:75-109; rls_tests.sql:110-138 |
| No-self-approve trigger | LIVE | 002_rls.sql:321-334 |
| Single mock seam `frontend/lib/mock/index.ts` | LIVE | file present |
| M365 SSO / sign-in | TARGET — to build | plan:103 (B1) |
| Microsoft Graph email | TARGET — to build | plan:106 (B4) |
| SharePoint / OneDrive storage | TARGET — to build | plan:107 (B5) |
| Real Ask-HR LLM (on-prem) | TARGET — to build | plan:109 (B7) |
| Live deploy at pulse.jera.co.za | TARGET — to build | plan:9, B8 |
| Manager **read** scope on `training_status`/`training_progress` is **team** | **TARGET — RLS currently org-wide** | see BLOCKER 1 below |
| `expense_claims → paid` guarded to Admin/Owner | TARGET — unguarded at HEAD | see BLOCKER 5b / 1.2 |
| SQL transition tables for onboarding + expense ordering | TARGET — to build | §3.1, §3.3 / BLOCKER 5a |

### §6.1 Surfaced board findings (carried as governance items)

**BLOCKER 1 — Manager read scope on `training_status` / `training_progress`.**
The matrix would naively tag Manager read as `R (team)`, but `ts_sel` and
`tp_sel` use `pulse_is_staff()` (= admin/owner/manager **org-wide**)
[LIVE: 002_rls.sql:292-293,298-299], unlike every sibling team table
(`cert_sel`, `claim_sel`, `ack_sel`, `wf_sel` all use `pulse_is_team_member`)
[LIVE: 002_rls.sql:208-209,231-233,306-308,170-172]. HANDOFF §2 (source-of-truth
#1) intends team [LIVE: HANDOFF.md:35]. **Therefore the matrix tags these two
cells `[TARGET — RLS currently org-wide]`, not LIVE team.**
**Mandated resolution [TARGET — to build]:** HANDOFF §2 locks team intent, so
this is a required change, not a pending decision. In `ts_sel`
[LIVE: 002_rls.sql:293] and `tp_sel` [LIVE: 002_rls.sql:299], **REPLACE** the
`pulse_is_staff()` disjunct with
`pulse_is_admin() OR (pulse_role()='manager' and pulse_is_team_member(employee_id))`,
so the USING reads
`employee_id = pulse_current_employee() OR pulse_is_admin() OR (pulse_role()='manager' and pulse_is_team_member(employee_id))`,
mirroring `cert_sel` [LIVE: 002_rls.sql:306-308]. Appending the manager disjunct
instead of replacing would leave the org-wide `pulse_is_staff()` leak intact (it
already returns true for every manager org-wide), so the fix is a **replace, not
an append**. The self-or-admin write policies `ts_self` / `tp_self`
[LIVE: 002_rls.sql:294-296,300-302] are unchanged. Add a **cross-team-manager
negative assertion** to `rls_tests.sql` (see the F7 correction immediately below
for why the current suite cannot detect the org-wide leak).

**F7 — corrected blocker premise (the "Kevin only manages Werner" claim is
FALSE).** Kevin (emp `…05`) manages **7 reports** — Werner, Liberty, Riette,
Ruth, Leon, Michael, Sikolwethu (emp `…07`–`…0d`)
[LIVE: 003_seed.sql:18-24] — not just Werner. The true reason the org-wide leak
goes undetected is **data, not topology**: only Werner has a `training_status`
row [LIVE: database/test/010_fixtures.sql:25], and **no assertion queries `training_status` as
a different team's manager**, so a manager who reads every row in the table looks
identical to one correctly scoped to his own team. **Pinned negative test:** seed
a `training_status` row for **Melicke** (emp `…06`, who reports to **Charl** emp
`…04`, NOT Kevin [LIVE: 003_seed.sql:15,17]); then assert that **Kevin** sees a
`training_status` count of **1** (his own team only). At HEAD this fails — the
org-wide `pulse_is_staff()` disjunct returns **2** (Werner + Melicke) — and it
**passes after the F2 replace** (Melicke is not on Kevin's team, so
`pulse_is_team_member` excludes her).

**BLOCKER 2 — `scheduleOnboarding` (Manager) source-of-truth contradiction.**
See AUTHORITY CONFLICT #1 in §1.4. Capability is LIVE in the UI mirror
[LIVE: capabilities.ts:53-58] but DENIED by RLS
[LIVE: 002_rls.sql:173-174,187-188]. Resolved by locked precedence (HANDOFF §2
wins) with **two distinct policies**, because the mandated flat predicate
references columns absent from both target tables — `onboarding_workflows` has
only `employee_id` [LIVE: 001_schema.sql:186-192], and `onboarding_task_status`
has none of `employee_id`/`phase_id`/`manager_hidden`
[LIVE: 001_schema.sql:196-203]:
(1) `wf_manager_ins` — an **INSERT** policy on `onboarding_workflows` with
`with check (pulse_role() = 'manager' AND pulse_is_team_member(employee_id))`;
(2) `ots_manager_ins` (INSERT) **and** `ots_manager_upd` (UPDATE) — two policies
on `onboarding_task_status` (split per HANDOFF §2 "track its work tasks"), both
gated by the same EXISTS join through `onboarding_workflows` + `onboarding_tasks`
(`pulse_role() = 'manager' AND ... pulse_is_team_member(w.employee_id) AND
tk.manager_hidden = false AND tk.phase_id <> 'hr'`), mirroring
[LIVE: 002_rls.sql:181-185]; (3) a security-definer trigger on
`onboarding_task_status` with **separate INSERT and UPDATE arms** (the INSERT arm
never references `OLD`), because RLS is row-level and cannot stop a manager from
writing the non-writable columns — "assign task owners" is **admin-only**
[LIVE: HANDOFF.md:42]. The manager-writable allowlist is
`{status, started_at, completed_at, completed_by}`, so the trigger must freeze
the **entire** non-writable set, not only `assigned_to`:
- **`BEFORE INSERT` arm:** raise if `pulse_role()` is manager AND
  `new.assigned_to IS NOT NULL` (a manager insert forces `assigned_to` to NULL).
- **`BEFORE UPDATE` arm:** raise if `pulse_role()` is manager AND
  (`new.assigned_to IS DISTINCT FROM old.assigned_to` OR
  `new.workflow_id IS DISTINCT FROM old.workflow_id` OR
  `new.task_id IS DISTINCT FROM old.task_id`).

Set the matrix manager onboarding cell to `status = W(team, work-phase)`,
`assigned_to = admin-only`; add positive, negative-phase, negative-insert (a
manager INSERT with a non-null `assigned_to` is BLOCKED), negative-assign
(manager BLOCKED from setting `assigned_to`), and negative-repoint (a manager
re-pointing `task_id` or `workflow_id` is BLOCKED) tests. The "strip capability /
correct HANDOFF §2" path is the rejected alternative. **[TARGET — to build]**

**BLOCKER 3 — `claim_upd` grants managers full-column UPDATE of team claims.**
The §1.3 matrix presents the manager expense write surface as only submit
`W(self)` plus approve/return `W(team)`, but `claim_upd`'s USING **and** WITH
CHECK both grant a manager UPDATE of *every column* of a team claim, including
monetary fields [LIVE: 002_rls.sql:237-241]; the transition trigger
(`enforce_expense_transition`) guards only `status`→`approved`/`returned` and
`reviewed_by` [LIVE: 002_rls.sql:324-329], so a manager may rewrite line totals
on a team claim. Same gap class as BLOCKER 5b (paid). **Mandated resolution —
single mechanism [TARGET — to build]:** remove the manager branch
(`or (pulse_role() = 'manager' and pulse_is_team_member(employee_id))`) from
both the USING and WITH CHECK of `claim_upd` [LIVE: 002_rls.sql:237-241], so a
manager acts on a team claim's status **only** through the guarded
`enforce_expense_transition` trigger [LIVE: 002_rls.sql:324-329]; add a
manager-rewrites-amount negative assertion to `rls_tests.sql`. The
"non-monetary column allowlist" approach is **explicitly REJECTED** (it
duplicates the freeze logic outside the trigger and leaves the field set as a
second drift surface).
>
> **F4 — post-submit monetary/line-total freeze has ONE owner.** The complement
> of removing the manager branch is freezing monetary fields once a claim leaves
> `draft`. This is enforced by **one added branch inside
> `enforce_expense_transition`** [LIVE: 002_rls.sql:321-334], NOT a second
> trigger, NOT a CHECK constraint, NOT an RLS column allowlist: when
> `old.status NOT IN ('draft','returned')`, the branch raises if any monetary
> field (`total_other`, `total_travel`, `total_advances`, `grand_total`) is
> distinct from its old value. Line-table totals are reached the same way (the
> line `_self` policy from F3 already blocks non-self/admin line writes once the
> parent is locked; the trigger owns the parent-claim monetary freeze). All other
> freeze references in this contract (§1.2 `paid` row, §3.3 monetary-after-submit
> illegal state) are descriptive call-outs that point back to this single owner.

**BLOCKER 5 — non-total / non-deterministic statecharts.** `expense_status` and
`employee_status` are bare enums [LIVE: 001_schema.sql:25,28] with no SQL
transition table; only `enforce_expense_transition` constrains *who*, not *order*
[LIVE: 002_rls.sql:321-334]. (5a) state×event tables added to §3.1/§3.3 with
"out-of-sequence transition" listed illegal [TARGET]. (5b) `mark_paid` has no
single-writer row/guard — added as `[TARGET — unguarded at HEAD]` in 1.2/§3.3.
(5c) onboarding `reinstate` is now the deterministic `suspended → active`, and
`terminated → active` resurrection / skip-ahead are listed illegal in §3.1.

### §6.2 Minor citation-hygiene & scope corrections (M1–M7)

- **M1 — verify.sh citation:** RLS assertions run at `database/test/verify.sh:26`
  and the success echo is at `database/test/verify.sh:27` (the script is 27
  lines; there is no line 28) [LIVE: database/test/verify.sh:27].
- **M2 — capabilities.ts "UI is not a security boundary":** the canonical line is
  `capabilities.ts:7` [LIVE: frontend/lib/capabilities.ts:7].
- **M3 — `CERT_PREP_DAYS`:** cite the **definition** at `training.ts:35`
  [LIVE: frontend/lib/mock/training.ts:35], not the use site at :777.
- **M4 — Manager-set capabilities:** cite `capabilities.ts:53-58`
  [LIVE: frontend/lib/capabilities.ts:53-58] (the `MANAGER_CAPABILITIES` array),
  not :53-73.
- **M5 — AR-4 over-broad ("never read personal data for anyone") is false.**
  `employees.phone` is POPIA personal [LIVE: 001_schema.sql:65] yet `emp_select`
  is `using(true)` [LIVE: 002_rls.sql:130], so a manager *can* read the work
  directory including `phone`. The manager POPIA exclusion is therefore scoped to
  the **POPIA satellite tables** (`employee_personal_info`,
  `employee_medical_info`, `employee_tax_banking`, `emergency_contacts`,
  `contract_uploads`) [LIVE: 002_rls.sql:137-161,197-201]. **`phone` is tagged
  [TARGET — B0.5 masked view / column move] (F8):** it is read-exposed org-wide
  in the work directory today, and the RLS comment flags that a fix is owed — a
  masked view or column move in B0.5 [LIVE: 002_rls.sql:128-129].
- **M6 — `audit_log` "insert by authenticated" is looser than reality.** The
  comment at 002_rls.sql:282-283 says "insert by anyone authenticated", but
  `audit_ins`'s `WITH CHECK` is
  `employee_id = pulse_current_employee() or pulse_is_admin()`
  [LIVE: 002_rls.sql:284-285] — a non-admin may insert **only self-attributed**
  audit rows. The matrix (1.3) and 1.2 reflect the WITH CHECK, not the looser
  comment.
- **M7 — `messages` "R (all)" undersells Admin/Owner reach.** `msg_self` is
  `for all` with `using (author_id = self or pulse_is_admin())`
  [LIVE: 002_rls.sql:268-270], so Admin/Owner can **DELETE** others' Ask-HR
  messages, not merely read them. The matrix (1.3) notes the `for all` (delete)
  reach explicitly.

---

## §7 Demolition-of-record (what the build deletes / supersedes)

| Removed / superseded | Replaced by | Status |
|---|---|---|
| `database/pulse_v5_schema.sql` (stale: 2-role enum, 20 policies, `declined` not `returned`, no certs/training/aa_rate) | `001_schema.sql` canonical (3-role, 24-policy, `returned`, full cert/training/aa_rate) | file DELETED (LIVE) — absent at HEAD; supersession documented at [LIVE: 001_schema.sql:4-5] |
| Unauthenticated `/api/email` route | M365 Graph `sendMail` (authenticated, role-checked, sender-constrained) | route DELETED (LIVE); replacement TARGET (plan:106, B4) |
| `frontend/lib/resend.ts` + `RESEND_API_KEY` | Graph email; `email_log.resend_id` retained for the typed contract, semantics now "provider message id" | resend.ts DELETED (LIVE); rename TARGET [LIVE note: 001_schema.sql:441-443; plan:106] |
| 20-policy / flat-ack model | 24 versioned policies + append-only `hr_policy_ack_events` | LIVE [001_schema.sql:270-279; 003_seed.sql] |
| Mock synchronous accessors (`frontend/lib/mock/*`) | Real async queries through the same `index.ts` seam; mock kept behind a dev-only build flag, never in prod | TARGET — to build (plan:84,104) |
| Client-set derived fields (`policies_completed`, `onboarding_completed`) | Trigger/SQL/view-maintained derivations | TARGET — to build (today plain columns [LIVE: 001_schema.sql:71-72]); expense totals already CHECK-enforced [LIVE: 001_schema.sql:335-337] |
| "View as" role toggle as authority | M365 identity → `employees.role` resolved server-side per request, fail-closed on no row | TARGET — to build (plan:45, B1); the `capabilities.ts` toggle is dev-only [LIVE: capabilities.ts:5-6] |

---

*End of contract. All prior forks are resolved by the locked precedence
(HANDOFF §2 wins) into single mandated [TARGET] implementations: BLOCKER 1
(training read team-scope), BLOCKER 2 / AUTHORITY CONFLICT #1 (manager
scheduleOnboarding work-phase grant), BLOCKER 3 (manager claim UPDATE collapses
to the guarded transition trigger), BLOCKER 5b (`paid` writer = admin-only via a
distinct branch). No open decision is deferred to confirmation, and no claim
above is LIVE-tagged without a reproducible citation at HEAD.*
