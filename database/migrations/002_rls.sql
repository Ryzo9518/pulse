-- ════════════════════════════════════════════════════════════════════════════
-- Pulse — Row-Level Security (002)
-- Encodes the capability matrix (frontend/lib/capabilities.ts + HANDOFF §2) at
-- the DATABASE layer — the real authorization boundary (the UI is not).
--
--   * DEFAULT-DENY: RLS is enabled on every table; a table with no matching
--     permissive policy returns nothing.
--   * Roles: employee / manager / admin, plus the OWNER super-admin flag
--     (unrestricted + protected: only an owner manages admins, and an owner
--     can't be demoted/deleted by a non-owner — enforced by trigger).
--   * Manager = work-related team oversight ONLY — never payroll/POPIA/personal
--     data or the contract/HR-admin onboarding tasks.
--
-- auth.uid() is provided by Supabase in production. For local verification a
-- shim (database/test/000_auth_shim.sql) defines it from a session GUC.
-- ════════════════════════════════════════════════════════════════════════════

-- Supabase's app role. (No-op if it already exists, e.g. real Supabase.)
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on admin_onboarding_summary, admin_activity_feed, pending_expense_approvals to authenticated;

-- ── Identity / role helpers (SECURITY DEFINER → bypass RLS, no recursion) ─────
create or replace function pulse_current_employee() returns uuid
  language sql stable security definer set search_path = public, pg_temp as $$
  select id from employees where auth_user_id = auth.uid();
$$;

create or replace function pulse_role() returns user_role
  language sql stable security definer set search_path = public, pg_temp as $$
  select role from employees where auth_user_id = auth.uid();
$$;

create or replace function pulse_is_owner() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select is_owner from employees where auth_user_id = auth.uid()), false);
$$;

-- Admin OR owner (owner is unrestricted — always passes admin checks).
create or replace function pulse_is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select pulse_is_owner() or coalesce(pulse_role() = 'admin', false);
$$;

-- Manager/admin/owner — has team-oversight standing.
create or replace function pulse_is_staff() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select pulse_is_admin() or coalesce(pulse_role() = 'manager', false);
$$;

-- Is `emp` the current user, or (for staff) within their remit?
create or replace function pulse_manages(emp uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select pulse_is_admin()
      or emp = pulse_current_employee()
      or (coalesce(pulse_role() = 'manager', false)
          and exists (select 1 from employees e
                      where e.id = emp and e.manager_id = pulse_current_employee()));
$$;

-- Team membership only (excludes self) — for manager team rosters.
create or replace function pulse_is_team_member(emp uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from employees e
                 where e.id = emp and e.manager_id = pulse_current_employee());
$$;

-- ── Protect the owner + privileged columns (role / is_owner) ─────────────────
create or replace function protect_privileged_employee_changes() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    if old.is_owner and not pulse_is_owner() then
      raise exception 'Only an owner may remove an owner';
    end if;
    return old;
  end if;
  -- role or owner-flag changes require owner privilege
  if (new.role is distinct from old.role) or (new.is_owner is distinct from old.is_owner) then
    if not pulse_is_owner() then
      raise exception 'Only an owner may change role or owner status';
    end if;
  end if;
  -- an owner cannot be demoted/disabled by a non-owner
  if old.is_owner and not new.is_owner and not pulse_is_owner() then
    raise exception 'An owner cannot be demoted by a non-owner';
  end if;
  -- only an admin/owner may change employment fields; a user can't self-promote
  -- (reactivate, reassign their manager, grant themselves approver, etc.).
  if not pulse_is_admin() then
    if (new.status is distinct from old.status)
       or (new.manager_id is distinct from old.manager_id)
       or (new.expense_role is distinct from old.expense_role)
       or (new.department is distinct from old.department)
       or (new.job_title is distinct from old.job_title) then
      raise exception 'Only an admin may change employment fields (status/manager/expense role/department/title)';
    end if;
  end if;
  return new;
end $$;
create trigger employees_protect_privileged
  before update or delete on employees
  for each row execute function protect_privileged_employee_changes();

-- ════════════════════════════════════════════════════════════════════════════
-- Enable RLS everywhere (default-deny) then add policies
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop execute format('alter table %I enable row level security;', t); end loop;
end $$;

-- Tamper-evidence: append-only tables must resist even owner/definer-context
-- mutation, not just the `authenticated` role. FORCE applies RLS to the table
-- owner too (superuser still bypasses, which is only the migration/break-glass path).
alter table audit_log force row level security;
alter table hr_policy_ack_events force row level security;

-- ── employees: work directory readable by all authenticated; writes gated ────
-- (phone is the one borderline column — managers must not see it; enforced at the
--  app projection today, flagged for a masked view / column move in B0.5.)
create policy emp_select on employees for select to authenticated using (true);
create policy emp_insert on employees for insert to authenticated with check (pulse_is_admin());
create policy emp_update on employees for update to authenticated
  using (pulse_is_admin() or id = pulse_current_employee())
  with check (pulse_is_admin() or id = pulse_current_employee());
create policy emp_delete on employees for delete to authenticated using (pulse_is_admin());

-- ── POPIA satellites: self or admin/owner ONLY (never managers) ──────────────
do $$
declare t text;
begin
  foreach t in array array['employee_personal_info','employee_medical_info','employee_tax_banking']
  loop
    execute format($f$
      create policy %1$s_sel on %1$s for select to authenticated
        using (employee_id = pulse_current_employee() or pulse_is_admin());
      create policy %1$s_ins on %1$s for insert to authenticated
        with check (employee_id = pulse_current_employee() or pulse_is_admin());
      create policy %1$s_upd on %1$s for update to authenticated
        using (employee_id = pulse_current_employee() or pulse_is_admin())
        with check (employee_id = pulse_current_employee() or pulse_is_admin());
    $f$, t);
  end loop;
end $$;

create policy emc_sel on emergency_contacts for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin());
create policy emc_ins on emergency_contacts for insert to authenticated
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
create policy emc_upd on emergency_contacts for update to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());

-- ── Onboarding templates: read all; write admin ─────────────────────────────
create policy phases_sel on onboarding_phases for select to authenticated using (true);
create policy phases_admin on onboarding_phases for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());
create policy tasks_sel on onboarding_tasks for select to authenticated using (true);
create policy tasks_admin on onboarding_tasks for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());

-- ── Workflows + per-task status (manager team scope; HR phase + contract hidden)
create policy wf_sel on onboarding_workflows for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)));
create policy wf_admin on onboarding_workflows for all to authenticated
  using (pulse_is_admin()) with check (pulse_is_admin());

-- Manager may see a team member's task only if it is NOT manager_hidden and NOT
-- in the HR-admin phase (payroll/tax/banking/medical). Self + admin see all.
create policy ots_sel on onboarding_task_status for select to authenticated using (
  pulse_is_admin()
  or exists (select 1 from onboarding_workflows w where w.id = workflow_id and w.employee_id = pulse_current_employee())
  or (pulse_role() = 'manager' and exists (
        select 1 from onboarding_workflows w
        join onboarding_tasks tk on tk.id = onboarding_task_status.task_id
        where w.id = workflow_id and pulse_is_team_member(w.employee_id)
          and tk.manager_hidden = false and tk.phase_id <> 'hr'))
);
create policy ots_write on onboarding_task_status for all to authenticated
  using (pulse_is_admin()) with check (pulse_is_admin());

-- ── Self-owned onboarding records ────────────────────────────────────────────
create policy forms_self on onboarding_form_completions for all to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
create policy goals_self on employee_goals for all to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
-- Employment contract: self + admin only — never managers.
create policy contract_sel on contract_uploads for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin());
create policy contract_admin on contract_uploads for all to authenticated
  using (pulse_is_admin()) with check (pulse_is_admin());

-- ── Policies: read all; publish admin. Acks: self + manager(team-read) + admin
create policy pol_sel on hr_policies for select to authenticated using (true);
create policy pol_admin on hr_policies for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());

create policy ack_sel on hr_policy_acknowledgements for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)));
create policy ack_self_ins on hr_policy_acknowledgements for insert to authenticated
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
create policy ack_self_upd on hr_policy_acknowledgements for update to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
-- Append-only ack evidence: insert self/admin, read self/admin, NO update/delete.
create policy ackev_sel on hr_policy_ack_events for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin());
create policy ackev_ins on hr_policy_ack_events for insert to authenticated
  with check (employee_id = pulse_current_employee() or pulse_is_admin());

-- ── SOPs: read all; write admin. Completions: self + admin ──────────────────
create policy sops_sel on sops for select to authenticated using (true);
create policy sops_admin on sops for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());
create policy sopsteps_sel on sop_steps for select to authenticated using (true);
create policy sopsteps_admin on sop_steps for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());
create policy sopc_self on sop_completions for all to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());

-- ── Expenses: submit own; approve = manager(team)/admin ──────────────────────
create policy claim_sel on expense_claims for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)));
create policy claim_ins on expense_claims for insert to authenticated
  with check (employee_id = pulse_current_employee());
-- submitter edits own; approver (manager-of-team / admin) may review/return/approve.
create policy claim_upd on expense_claims for update to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)))
  with check (employee_id = pulse_current_employee() or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)));
create policy claim_del on expense_claims for delete to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin());

-- claim lines inherit access from their parent claim.
do $$
declare t text;
begin
  foreach t in array array['expense_travel_lines','expense_other_lines','expense_advance_lines']
  loop
    execute format($f$
      create policy %1$s_all on %1$s for all to authenticated
        using (exists (select 1 from expense_claims c where c.id = %1$s.claim_id
                       and (c.employee_id = pulse_current_employee() or pulse_is_admin()
                            or (pulse_role() = 'manager' and pulse_is_team_member(c.employee_id)))))
        with check (exists (select 1 from expense_claims c where c.id = %1$s.claim_id
                       and (c.employee_id = pulse_current_employee() or pulse_is_admin())));
    $f$, t);
  end loop;
end $$;

create policy aacert_self on aa_rate_certificates for all to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());

-- ── Comms / documents / audit ───────────────────────────────────────────────
-- Ask-HR assistant history is private to the asker.
create policy msg_self on messages for all to authenticated
  using (author_id = pulse_current_employee() or pulse_is_admin())
  with check (author_id = pulse_current_employee());
-- Announcements: everyone reads; only admins (notifyAll) send.
create policy notif_sel on admin_notifications for select to authenticated using (true);
create policy notif_ins on admin_notifications for insert to authenticated with check (pulse_is_admin());
-- Email log: admin/system only.
create policy email_admin on email_log for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());
-- Documents: read active by all; manage = admin (uploadDocuments).
create policy doc_sel on documents for select to authenticated using (is_active or pulse_is_admin());
create policy doc_admin on documents for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());
create policy docack_self on document_acknowledgements for all to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
-- Audit log: append-only; readable by admins only. (insert by anyone authenticated;
-- no update/delete policy → denied.)
create policy audit_ins on audit_log for insert to authenticated
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
create policy audit_sel on audit_log for select to authenticated using (pulse_is_admin());

-- ── Training / certifications ───────────────────────────────────────────────
create policy prod_sel on products for select to authenticated using (true);
create policy prod_admin on products for all to authenticated using (pulse_is_admin()) with check (pulse_is_admin());

create policy ts_sel on training_status for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_staff());
create policy ts_self on training_status for all to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());

create policy tp_sel on training_progress for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_staff());
create policy tp_self on training_progress for all to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());

-- Certs: own (self) + team (manager read, for tender export) + admin (all).
-- Upload own (uploadOwnCertificates: every role) OR any (uploadCertificates: admin).
create policy cert_sel on certifications for select to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin()
         or (pulse_role() = 'manager' and pulse_is_team_member(employee_id)));
create policy cert_ins on certifications for insert to authenticated
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
create policy cert_upd on certifications for update to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin())
  with check (employee_id = pulse_current_employee() or pulse_is_admin());
create policy cert_del on certifications for delete to authenticated
  using (employee_id = pulse_current_employee() or pulse_is_admin());

-- ── Expense approval integrity: a submitter cannot self-approve ──────────────
-- Moving a claim to approved/returned, or setting the reviewer, requires an
-- approver (admin, or the submitter's team manager). RLS lets the owner edit
-- their own draft; this trigger stops them rubber-stamping it.
create or replace function enforce_expense_transition() returns trigger
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (new.status is distinct from old.status and new.status in ('approved','returned'))
     or (new.reviewed_by is distinct from old.reviewed_by) then
    if not (pulse_is_admin()
            or (pulse_role() = 'manager' and pulse_is_team_member(new.employee_id))) then
      raise exception 'Only an approver (admin or the team manager) may approve/return a claim';
    end if;
  end if;
  return new;
end $$;
create trigger expense_claims_transition before update on expense_claims
  for each row execute function enforce_expense_transition();
