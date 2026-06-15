-- ════════════════════════════════════════════════════════════════════════════
-- RLS verification — per-role positive + negative assertions.
-- Personas: Ryan …01 (owner/admin), Ben …03 (admin, NOT owner),
--           Kevin …05 (manager of Werner), Werner …07 (employee),
--           Liberty …08 (peer employee, same manager).
-- Any failed expectation RAISEs → psql ON_ERROR_STOP aborts the run.
-- ════════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on

create or replace function _expect(label text, got bigint, want bigint)
  returns void language plpgsql as $$
begin
  if got is distinct from want then
    raise exception 'RLS FAIL [%]: got %, want %', label, got, want;
  end if;
end $$;

-- ── 1. POPIA: tax/banking — self yes, peer no, MANAGER NO, admin yes ─────────
set role authenticated; set app.auth_uid='00000000-0000-0000-0000-000000000007';
select _expect('werner sees own tax_banking', count(*), 1) from employee_tax_banking;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000008';
set role authenticated;
select _expect('peer sees no tax_banking', count(*), 0) from employee_tax_banking;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000005';
set role authenticated;
select _expect('MANAGER sees no tax_banking (POPIA)', count(*), 0) from employee_tax_banking;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000001';
set role authenticated;
select _expect('admin sees all tax_banking', count(*), 1) from employee_tax_banking;
reset role;

-- ── 1b. Other POPIA satellites + contract: manager NO, self yes, admin yes ───
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;  -- manager
select _expect('MANAGER no personal_info (POPIA)', count(*), 0) from employee_personal_info;
select _expect('MANAGER no medical_info (POPIA)', count(*), 0) from employee_medical_info;
select _expect('MANAGER no emergency_contacts', count(*), 0) from emergency_contacts;
select _expect('MANAGER no contract_uploads', count(*), 0) from contract_uploads;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000007'; set role authenticated;  -- self
select _expect('self sees own personal_info', count(*), 1) from employee_personal_info;
select _expect('self sees own medical_info', count(*), 1) from employee_medical_info;
select _expect('self sees own emergency_contacts', count(*), 1) from emergency_contacts;
select _expect('self sees own contract', count(*), 1) from contract_uploads;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
select _expect('admin sees medical_info', count(*), 1) from employee_medical_info;
select _expect('admin sees contract', count(*), 1) from contract_uploads;
reset role;
-- Write-path: a manager may NOT write a team member's tax/banking.
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;
do $$ begin
  begin
    update employee_tax_banking set bank_name='X' where employee_id='00000000-0000-0000-0000-000000000007';
    if found then raise exception 'RLS FAIL: manager wrote team tax_banking'; end if;
  exception when others then if sqlerrm like 'RLS FAIL%' then raise; end if; end;
end $$;
reset role;

-- ── 2. Expense claims: self / team-manager yes, peer no ──────────────────────
set app.auth_uid='00000000-0000-0000-0000-000000000007'; set role authenticated;
select _expect('werner sees own claim', count(*), 1) from expense_claims;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000008'; set role authenticated;
select _expect('peer sees no claim', count(*), 0) from expense_claims;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;
select _expect('manager sees team claim', count(*), 1) from expense_claims;
reset role;

-- ── 3. Training status: team-manager yes, peer no ────────────────────────────
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;
select _expect('manager sees team training', count(*), 1) from training_status;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000008'; set role authenticated;
select _expect('peer sees no training', count(*), 0) from training_status;
reset role;

-- ── 4. Certifications: team-manager yes (tender), peer no ────────────────────
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;
select _expect('manager sees team cert', count(*), 1) from certifications;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000008'; set role authenticated;
select _expect('peer sees no cert', count(*), 0) from certifications;
reset role;

-- ── 5. Onboarding task status: manager sees normal task ONLY (not contract/hr)
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;
select _expect('manager sees only non-hidden, non-hr task', count(*), 1) from onboarding_task_status;
select _expect('manager sees t6 specifically', count(*), 1) from onboarding_task_status where task_id='t6';
select _expect('manager does NOT see contract t7', count(*), 0) from onboarding_task_status where task_id='t7';
select _expect('manager does NOT see hr task t20', count(*), 0) from onboarding_task_status where task_id='t20';
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000007'; set role authenticated;
select _expect('werner sees all own task statuses', count(*), 3) from onboarding_task_status;
reset role;

-- ── 6. Policies readable by all; documents (active) readable by all ──────────
set app.auth_uid='00000000-0000-0000-0000-000000000007'; set role authenticated;
select _expect('employee can read policies', (count(*) > 0)::int::bigint, 1) from hr_policies;
select _expect('employee can read active docs', (count(*) > 0)::int::bigint, 1) from documents;
reset role;

-- ── 6b. Views respect RLS (security_invoker) ─────────────────────────────────
set app.auth_uid='00000000-0000-0000-0000-000000000008'; set role authenticated;  -- peer
select _expect('peer sees no pending-approval rows (view RLS)', count(*), 0) from pending_expense_approvals;
reset role; set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
select _expect('admin sees the pending approval (view RLS)', count(*), 1) from pending_expense_approvals;
reset role;

-- ── 6c. Default-deny invariant: every public base table has RLS enabled ──────
select _expect('all public base tables have RLS', count(*), 0)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- ── 7. Owner protection (trigger) ────────────────────────────────────────────
-- Non-owner admin (Ben) cannot change a role.
set app.auth_uid='00000000-0000-0000-0000-000000000003'; set role authenticated;
do $$ begin
  begin
    update employees set role='admin' where id='00000000-0000-0000-0000-000000000007';
    raise exception 'RLS FAIL: non-owner admin changed a role';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like 'Only an owner%' then
      raise exception 'RLS FAIL: role change blocked by unexpected error: %', sqlerrm;
    end if;
  end;
end $$;
-- Non-owner cannot demote the owner.
do $$ begin
  begin
    update employees set is_owner=false where id='00000000-0000-0000-0000-000000000001';
    raise exception 'RLS FAIL: non-owner demoted the owner';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like 'Only an owner%' then
      raise exception 'RLS FAIL: owner-demote blocked by unexpected error: %', sqlerrm;
    end if;
  end;
end $$;
reset role;
-- Owner (Ryan) CAN change a role.
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;
update employees set role='manager' where id='00000000-0000-0000-0000-000000000007';
update employees set role='employee' where id='00000000-0000-0000-0000-000000000007';
reset role;

drop function _expect(text,bigint,bigint);
\echo '════════════════════════════════════════════'
\echo '  ALL RLS TESTS PASSED'
\echo '════════════════════════════════════════════'
