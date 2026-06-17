-- ════════════════════════════════════════════════════════════════════════════
-- Pulse — Governance/RLS CONFORMANCE (004)
-- Closes the gaps between the shipped SQL (001/002/003) and the RATIFIED
-- certified contracts:
--   docs/governance/PULSE-GOVERNANCE-CONTRACT.md
--   docs/governance/PULSE-OUTCOME-CONTRACT.md
--
-- Each section below is mandated by those contracts (GOV references inline).
-- This migration is IDEMPOTENT: re-running it is safe. Every policy is dropped
-- with DROP POLICY IF EXISTS before CREATE; every trigger with DROP TRIGGER IF
-- EXISTS; functions/views use CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- 1. EXPENSE LINE manager-delete hole (GOV §1.3 F3, A7)
--    At HEAD each expense_*_lines `_all` policy carries the manager-team branch
--    in its USING, which governs DELETE — a manager can delete a team line and
--    mutate the parent claim totals (A7 violation). Fix: split each `_all` into
--      * `_sel`  : FOR SELECT — self-or-admin OR manager-team (read-only reach)
--      * `_self` : FOR ALL    — self-or-admin ONLY in BOTH using + with check
--    Net effect: managers READ team lines, never write/delete them.
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['expense_travel_lines','expense_other_lines','expense_advance_lines']
  loop
    execute format('drop policy if exists %1$s_all  on %1$s;', t);
    execute format('drop policy if exists %1$s_sel  on %1$s;', t);
    execute format('drop policy if exists %1$s_self on %1$s;', t);
    execute format($f$
      -- Read: self / admin / team-manager (manager reach is SELECT-only).
      create policy %1$s_sel on %1$s for select to authenticated
        using (exists (select 1 from expense_claims c where c.id = %1$s.claim_id
                       and (c.employee_id = pulse_current_employee() or pulse_is_admin()
                            or (pulse_role() = 'manager' and pulse_is_team_member(c.employee_id)))));
      -- Write (insert/update/delete): self or admin ONLY — NO manager branch.
      create policy %1$s_self on %1$s for all to authenticated
        using (exists (select 1 from expense_claims c where c.id = %1$s.claim_id
                       and (c.employee_id = pulse_current_employee() or pulse_is_admin())))
        with check (exists (select 1 from expense_claims c where c.id = %1$s.claim_id
                       and (c.employee_id = pulse_current_employee() or pulse_is_admin())));
    $f$, t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. MANAGER ONBOARDING-TASK write (GOV §1.3, §1.4 AUTHORITY CONFLICT #1, §3.6,
--    BLOCKER 2). Today onboarding_task_status write is admin-only (ots_write).
--    HANDOFF §2 (locked precedence) grants a manager the ability to create and
--    track a team member's WORK-phase onboarding tasks. RLS is row-level only,
--    so the column-freeze ("assign task owners" is admin-only) lives in a
--    security-definer trigger.
-- ════════════════════════════════════════════════════════════════════════════

-- 2a. RLS: manager INSERT + UPDATE on a team member's non-hr, non-hidden task.
drop policy if exists ots_manager_ins on onboarding_task_status;
create policy ots_manager_ins on onboarding_task_status for insert to authenticated
  with check (
    pulse_role() = 'manager' and exists (
      select 1 from onboarding_workflows w
      join onboarding_tasks tk on tk.id = onboarding_task_status.task_id
      where w.id = workflow_id and pulse_is_team_member(w.employee_id)
        and tk.manager_hidden = false and tk.phase_id <> 'hr')
  );

drop policy if exists ots_manager_upd on onboarding_task_status;
create policy ots_manager_upd on onboarding_task_status for update to authenticated
  using (
    pulse_role() = 'manager' and exists (
      select 1 from onboarding_workflows w
      join onboarding_tasks tk on tk.id = onboarding_task_status.task_id
      where w.id = workflow_id and pulse_is_team_member(w.employee_id)
        and tk.manager_hidden = false and tk.phase_id <> 'hr')
  )
  with check (
    pulse_role() = 'manager' and exists (
      select 1 from onboarding_workflows w
      join onboarding_tasks tk on tk.id = onboarding_task_status.task_id
      where w.id = workflow_id and pulse_is_team_member(w.employee_id)
        and tk.manager_hidden = false and tk.phase_id <> 'hr')
  );

-- 2b. Schedule-onboarding: manager may INSERT a workflow for a team member
--     (GATE-MGR-WF, GOV §1.4 wf_manager_ins). admin keeps wf_admin (all).
drop policy if exists wf_manager_ins on onboarding_workflows;
create policy wf_manager_ins on onboarding_workflows for insert to authenticated
  with check (pulse_role() = 'manager' and pulse_is_team_member(employee_id));

-- 2c. Column-freeze trigger (GATE-OTS-FREEZE). RLS cannot restrict which columns
--     a manager writes; this security-definer trigger enforces the manager
--     allowlist {status, started_at, completed_at, completed_by}. Separate INSERT
--     and UPDATE arms; the INSERT arm never references OLD.
create or replace function enforce_ots_manager_freeze() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if pulse_role() = 'manager' then
    if tg_op = 'INSERT' then
      -- a manager may never choose a task owner at creation.
      if new.assigned_to is not null then
        raise exception 'A manager may not assign a task owner (assigned_to is admin-only)';
      end if;
    elsif tg_op = 'UPDATE' then
      if (new.assigned_to is distinct from old.assigned_to) then
        raise exception 'A manager may not change assigned_to (assign task owners is admin-only)';
      end if;
      if (new.workflow_id is distinct from old.workflow_id)
         or (new.task_id is distinct from old.task_id) then
        raise exception 'A manager may not re-point an onboarding task (workflow_id/task_id are frozen)';
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists ots_manager_freeze on onboarding_task_status;
create trigger ots_manager_freeze before insert or update on onboarding_task_status
  for each row execute function enforce_ots_manager_freeze();

-- ════════════════════════════════════════════════════════════════════════════
-- 7. onboarding_task_status ORDERING (GOV §3.6, GATE-OTS-ORDER).
--    BEFORE UPDATE trigger rejecting any (old.status, new.status) pair absent
--    from the §3.6 legal-pair set. The model is pair-keyed; the only illegal
--    pairs are the three self-loops. (Placed here so it lives alongside the OTS
--    manager-freeze trigger; both fire on onboarding_task_status.)
--    Legal pairs (§3.6):
--      pending    -> inprogress (start)   | pending    -> done (complete)
--      inprogress -> pending    (reset)   | inprogress -> done (complete)
--      done       -> pending    (reset)   | done       -> inprogress (reopen)
--    Illegal: pending->pending, inprogress->inprogress, done->done (self-loops).
-- ════════════════════════════════════════════════════════════════════════════
create or replace function enforce_ots_order() returns trigger
  language plpgsql as $$
begin
  if new.status is not distinct from old.status then
    raise exception 'Illegal onboarding task transition: % -> % (a status write must change the status)',
      old.status, new.status;
  end if;
  -- every off-diagonal pair is legal per §3.6; only self-loops are rejected,
  -- handled above. (3x3 space: 6 legal off-diagonal pairs, 3 illegal self-loops.)
  return new;
end $$;
drop trigger if exists ots_order on onboarding_task_status;
create trigger ots_order before update on onboarding_task_status
  for each row execute function enforce_ots_order();

-- ════════════════════════════════════════════════════════════════════════════
-- 3. TRAINING read team-scope (GOV F2 / BLOCKER 1, DAT-TRAIN-READ).
--    ts_sel and tp_sel use pulse_is_staff() (= admin/owner/manager ORG-WIDE) —
--    a manager can read EVERY employee's training, not just their team. REPLACE
--    the pulse_is_staff() disjunct with
--      pulse_is_admin() OR (manager AND pulse_is_team_member(employee_id)).
--    (Appending would leave the org-wide leak; this is a REPLACE.)
--    The self-or-admin write policies ts_self / tp_self are unchanged.
-- ════════════════════════════════════════════════════════════════════════════
drop policy if exists ts_sel on training_status;
create policy ts_sel on training_status for select to authenticated
  using (employee_id = pulse_current_employee()
         or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)));

drop policy if exists tp_sel on training_progress;
create policy tp_sel on training_progress for select to authenticated
  using (employee_id = pulse_current_employee()
         or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)));

-- ════════════════════════════════════════════════════════════════════════════
-- 6. policies_completed predicate (GOV F6 / §3.2 / §4, DAT-POL-DONE).
--    Canonical predicate:
--      policies_completed := NOT EXISTS (an is_active hr_policy with no
--                            acknowledged hr_policy_acknowledgements row for emp)
--    Maintained by a trigger on hr_policy_acknowledgements (insert/update/delete).
--    Defined BEFORE the ack-reset trigger (section 4) which calls it.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function pulse_compute_policies_completed(emp uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select not exists (
    select 1 from hr_policies p
    where p.is_active
      and not exists (
        select 1 from hr_policy_acknowledgements a
        where a.policy_id = p.id and a.employee_id = emp and a.acknowledged));
$$;

create or replace function maintain_policies_completed() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
declare emp uuid;
begin
  emp := coalesce(new.employee_id, old.employee_id);
  update employees
     set policies_completed = pulse_compute_policies_completed(emp)
   where id = emp;
  return coalesce(new, old);
end $$;
drop trigger if exists ack_maintain_completed on hr_policy_acknowledgements;
create trigger ack_maintain_completed
  after insert or update or delete on hr_policy_acknowledgements
  for each row execute function maintain_policies_completed();

-- admin_onboarding_summary: policies_done must count ONLY acks of is_active
-- policies (add the is_active join), so the view and the gate share one
-- denominator (policies_total already counts only is_active policies).
create or replace view admin_onboarding_summary with (security_invoker = true) as
select
  e.id, e.display_name, e.email, e.status, e.start_date, e.department, e.job_title,
  coalesce((select count(*) from onboarding_form_completions f where f.employee_id = e.id),0)::int as forms_done,
  5 as forms_total,
  coalesce((select count(*) from sop_completions s where s.employee_id = e.id and s.completed),0)::int as sops_done,
  (select count(*) from sops)::int as sops_total,
  coalesce((select count(*) from hr_policy_acknowledgements a
            join hr_policies p on p.id = a.policy_id
            where a.employee_id = e.id and a.acknowledged and p.is_active),0)::int as policies_done,
  (select count(*) from hr_policies where is_active)::int as policies_total,
  e.policies_completed,
  coalesce((select count(*) from expense_claims c where c.employee_id = e.id),0)::int as expense_claims_total,
  coalesce((select count(*) from expense_claims c where c.employee_id = e.id and c.status = 'submitted'),0)::int as expense_claims_pending
from employees e;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. POLICY ACK RESET (GOV §3.2 F5, DAT-ACK-RESET).
--    AFTER UPDATE OF version ON hr_policies (security definer) — for every
--    hr_policy_acknowledgements of that policy set acknowledged=false,
--    read_started_at=NULL, acknowledged_at=NULL; then recompute the affected
--    employees' policies_completed. The append-only hr_policy_ack_events
--    evidence rows are UNTOUCHED (A6).
-- ════════════════════════════════════════════════════════════════════════════
create or replace function reset_acks_on_publish() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update hr_policy_acknowledgements
     set acknowledged = false, read_started_at = null, acknowledged_at = null
   where policy_id = new.id;
  -- recompute policies_completed for every employee that had an ack of this policy.
  update employees e
     set policies_completed = pulse_compute_policies_completed(e.id)
   where exists (select 1 from hr_policy_acknowledgements a
                 where a.policy_id = new.id and a.employee_id = e.id);
  return new;
end $$;
drop trigger if exists hr_policies_reset_acks on hr_policies;
create trigger hr_policies_reset_acks
  after update of version on hr_policies
  for each row when (new.version is distinct from old.version)
  execute function reset_acks_on_publish();

-- ════════════════════════════════════════════════════════════════════════════
-- 5. EXPENSE transition guards (GOV §3.3 F4 / BLOCKER 3, GATE-PAID,
--    GATE-EXP-FREEZE, GATE-EXP-ORDER). Extend enforce_expense_transition:
--    (a) a status change to 'paid' requires pulse_is_admin() (NOT the
--        admin-or-team-manager approver set); legal predecessor approved->paid.
--    (b) freeze monetary fields: raise if total_other/total_travel/
--        total_advances/grand_total change while old.status NOT IN
--        ('draft','returned').
--    Plus: remove the manager full-column write branch from claim_upd so a
--    manager acts on a team claim's status ONLY via this guarded trigger
--    (BLOCKER 3).
-- ════════════════════════════════════════════════════════════════════════════

-- 5-RLS: claim_upd loses the manager-team branch (no full-column manager write).
drop policy if exists claim_upd on expense_claims;
create policy claim_upd on expense_claims for update to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());

create or replace function enforce_expense_transition() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- approve / return / set reviewer: approver (admin or the team manager) only.
  if (new.status is distinct from old.status and new.status in ('approved','returned'))
     or (new.reviewed_by is distinct from old.reviewed_by) then
    if not (pulse_is_admin()
            or (pulse_role() = 'manager' and pulse_is_team_member(new.employee_id))) then
      raise exception 'Only an approver (admin or the team manager) may approve/return a claim';
    end if;
  end if;

  -- (a) mark_paid is admin/owner ONLY (NOT the approver set); only approved->paid.
  if (new.status is distinct from old.status and new.status = 'paid') then
    if not pulse_is_admin() then
      raise exception 'Only an admin may mark a claim paid';
    end if;
    if old.status <> 'approved' then
      raise exception 'Illegal expense transition: % -> paid (only approved -> paid)', old.status;
    end if;
  end if;

  -- (b) monetary freeze: once a claim leaves draft/returned, totals are immutable.
  if old.status not in ('draft','returned') then
    if (new.total_other    is distinct from old.total_other)
       or (new.total_travel   is distinct from old.total_travel)
       or (new.total_advances is distinct from old.total_advances)
       or (new.grand_total    is distinct from old.grand_total) then
      raise exception 'Monetary fields are frozen once a claim is submitted (status %)', old.status;
    end if;
  end if;

  return new;
end $$;
-- trigger already created in 002; re-create idempotently in case 002 changes.
drop trigger if exists expense_claims_transition on expense_claims;
create trigger expense_claims_transition before update on expense_claims
  for each row execute function enforce_expense_transition();

-- ════════════════════════════════════════════════════════════════════════════
-- End 004. Re-runnable: all policies use DROP POLICY IF EXISTS, triggers use
-- DROP TRIGGER IF EXISTS, functions/views use CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════════════
