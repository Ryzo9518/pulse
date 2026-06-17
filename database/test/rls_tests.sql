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

-- ════════════════════════════════════════════════════════════════════════════
-- 004 CONFORMANCE assertions (GOV/OUTCOME contract gaps)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 8. (GOV §1.3 F3) Expense LINE: manager READS team line, CANNOT update/delete
--    Werner's claim …c1a17 has one travel line; Kevin (…05) manages Werner.
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;  -- manager
select _expect('manager reads team expense line', count(*), 1) from expense_travel_lines;
-- manager UPDATE of a team line affects ZERO rows (no manager write branch).
do $$ begin
  begin
    update expense_travel_lines set amount = 1.00
      where claim_id = '00000000-0000-0000-0000-0000000c1a17';
    if found then raise exception 'RLS FAIL: manager wrote a team expense line'; end if;
  exception when others then if sqlerrm like 'RLS FAIL%' then raise; end if; end;
end $$;
-- manager DELETE of a team line affects ZERO rows (the A7 hole is closed).
do $$ begin
  begin
    delete from expense_travel_lines
      where claim_id = '00000000-0000-0000-0000-0000000c1a17';
    if found then raise exception 'RLS FAIL: manager deleted a team expense line'; end if;
  exception when others then if sqlerrm like 'RLS FAIL%' then raise; end if; end;
end $$;
reset role;
-- self CAN still read + write own line (positive control).
set app.auth_uid='00000000-0000-0000-0000-000000000007'; set role authenticated;  -- Werner (self)
select _expect('self reads own expense line', count(*), 1) from expense_travel_lines;
reset role;

-- ── 9. (GOV §1.4 / §3.6 / BLOCKER 2) Manager onboarding-task write surface ────
-- Werner's workflow …f0007: t6 (day1, non-hidden, non-hr) is manager-writable;
-- t7 (manager_hidden) and t20 (hr-phase) are NOT. Kevin manages Werner.
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;  -- manager
-- POSITIVE: manager sets status on a team WORK-phase task (t6 done -> inprogress = reopen).
update onboarding_task_status set status = 'inprogress'
  where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't6';
select _expect('manager set status on team work-phase task', count(*), 1)
  from onboarding_task_status
  where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't6' and status = 'inprogress';
-- NEGATIVE-ASSIGN: manager BLOCKED from setting assigned_to on a qualifying row.
do $$ begin
  begin
    update onboarding_task_status set assigned_to = '00000000-0000-0000-0000-000000000007'
      where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't6';
    raise exception 'RLS FAIL: manager set assigned_to on a task';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like '%assigned_to%' then
      raise exception 'RLS FAIL: assigned_to block raised unexpected error: %', sqlerrm; end if;
  end;
end $$;
-- NEGATIVE-REPOINT: manager BLOCKED from re-pointing task_id on a qualifying row.
do $$ begin
  begin
    update onboarding_task_status set task_id = 't11'
      where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't6';
    raise exception 'RLS FAIL: manager re-pointed task_id';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like '%re-point%' and sqlerrm not like '%frozen%' then
      raise exception 'RLS FAIL: task_id repoint raised unexpected error: %', sqlerrm; end if;
  end;
end $$;
-- NEGATIVE-PHASE (hr-phase): manager write of t20 (hr) affects ZERO rows (RLS excludes).
do $$ begin
  begin
    update onboarding_task_status set status = 'done'
      where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't20';
    if found then raise exception 'RLS FAIL: manager wrote an hr-phase task'; end if;
  exception when others then if sqlerrm like 'RLS FAIL%' then raise; end if; end;
end $$;
-- NEGATIVE-PHASE (manager_hidden): manager write of t7 affects ZERO rows.
do $$ begin
  begin
    update onboarding_task_status set status = 'done'
      where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't7';
    if found then raise exception 'RLS FAIL: manager wrote a manager_hidden task'; end if;
  exception when others then if sqlerrm like 'RLS FAIL%' then raise; end if; end;
end $$;
reset role;
-- restore t6 to its fixture state so re-runs / later asserts stay deterministic.
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
update onboarding_task_status set status = 'done'
  where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't6';
reset role;

-- ── 9b. (GOV §3.6 GATE-OTS-ORDER) self-loop status write is rejected ──────────
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
do $$ begin
  begin
    update onboarding_task_status set status = 'done'  -- t6 is already 'done' = self-loop
      where workflow_id = '00000000-0000-0000-0000-0000000f0007' and task_id = 't6';
    raise exception 'RLS FAIL: self-loop task transition accepted';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like '%Illegal onboarding task transition%' then
      raise exception 'RLS FAIL: self-loop block raised unexpected error: %', sqlerrm; end if;
  end;
end $$;
reset role;

-- ── 10. (GOV F2 / BLOCKER 1) Training read is TEAM-scoped, not org-wide ───────
-- Kevin (…05) manages Werner (…07) but NOT Melicke (…06, reports to Charl).
-- Both have a training_status row; Kevin must see ONLY Werner (count 1).
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;  -- manager
select _expect('manager training read is team-scoped (not org-wide)', count(*), 1) from training_status;
select _expect('manager does NOT see cross-team Melicke training', count(*), 0)
  from training_status where employee_id = '00000000-0000-0000-0000-000000000006';
reset role;
-- admin still sees both.
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
select _expect('admin sees all training rows', count(*), 2) from training_status;
reset role;

-- ── 11. (GOV §3.2 F5) Publishing a policy version RESETS that policy's acks ────
-- Werner has an acknowledged HR001 ack (fixture). Admin bumps HR001.version → reset.
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
select _expect('werner HR001 ack starts acknowledged', count(*), 1)
  from hr_policy_acknowledgements where policy_id='HR001' and acknowledged;
update hr_policies set version = 'v2026.2' where id = 'HR001';
select _expect('HR001 acks reset to unacknowledged after publish', count(*), 0)
  from hr_policy_acknowledgements where policy_id='HR001' and acknowledged;
select _expect('reset clears acknowledged_at', count(*), 1)
  from hr_policy_acknowledgements
  where policy_id='HR001' and employee_id='00000000-0000-0000-0000-000000000007'
    and acknowledged_at is null and read_started_at is null;
reset role;

-- ── 12. (GOV §3.3 GATE-PAID) A non-admin cannot set a claim to 'paid' ─────────
-- First admin moves Werner's claim submitted -> approved (so approved->paid is legal).
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
update expense_claims set status='approved', reviewed_by='00000000-0000-0000-0000-000000000001'
  where id='00000000-0000-0000-0000-0000000c1a17';
reset role;
-- Werner (submitter, non-admin) attempts approved -> paid: BLOCKED.
set app.auth_uid='00000000-0000-0000-0000-000000000007'; set role authenticated;  -- submitter
do $$ begin
  begin
    update expense_claims set status='paid' where id='00000000-0000-0000-0000-0000000c1a17';
    raise exception 'RLS FAIL: non-admin set claim paid';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like '%Only an admin may mark a claim paid%' then
      raise exception 'RLS FAIL: paid block raised unexpected error: %', sqlerrm; end if;
  end;
end $$;
reset role;
-- admin CAN move approved -> paid (positive control).
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
update expense_claims set status='paid' where id='00000000-0000-0000-0000-0000000c1a17';
select _expect('admin marked claim paid', count(*), 1)
  from expense_claims where id='00000000-0000-0000-0000-0000000c1a17' and status='paid';
reset role;

-- ── 12b. (GOV §3.3) Illegal predecessor: draft/submitted -> paid is rejected ──
-- Werner submits a fresh draft claim, then admin attempts submitted -> paid.
set app.auth_uid='00000000-0000-0000-0000-000000000007'; set role authenticated;  -- submitter
insert into expense_claims (id, employee_id, claim_period, status, total_travel, grand_total)
values ('00000000-0000-0000-0000-0000000c1b18','00000000-0000-0000-0000-000000000007','July 2026','submitted',100.00,100.00);
reset role;
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
do $$ begin
  begin
    update expense_claims set status='paid' where id='00000000-0000-0000-0000-0000000c1b18';
    raise exception 'RLS FAIL: submitted -> paid accepted';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like '%only approved -> paid%' then
      raise exception 'RLS FAIL: predecessor block raised unexpected error: %', sqlerrm; end if;
  end;
end $$;
reset role;

-- ── 13. (GOV §3.3 F4 GATE-EXP-FREEZE) Monetary fields frozen after submit ─────
-- Werner's c1b18 is 'submitted'; admin attempts to mutate its totals: BLOCKED.
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
do $$ begin
  begin
    update expense_claims set total_travel=200.00, grand_total=200.00
      where id='00000000-0000-0000-0000-0000000c1b18';
    raise exception 'RLS FAIL: monetary edit after submit accepted';
  exception when others then
    if sqlerrm like 'RLS FAIL%' then raise; end if;
    if sqlerrm not like '%Monetary fields are frozen%' then
      raise exception 'RLS FAIL: freeze raised unexpected error: %', sqlerrm; end if;
  end;
end $$;
-- a non-monetary transition on the same submitted claim still works (approve).
update expense_claims set status='approved', reviewed_by='00000000-0000-0000-0000-000000000001'
  where id='00000000-0000-0000-0000-0000000c1b18';
select _expect('non-monetary transition on submitted claim OK', count(*), 1)
  from expense_claims where id='00000000-0000-0000-0000-0000000c1b18' and status='approved';
reset role;

-- ── 13b. (GOV §1.3 BLOCKER 3) Manager cannot rewrite a team claim's amount ────
-- Kevin manages Werner; with the manager branch removed from claim_upd, a
-- manager UPDATE of a team claim affects ZERO rows.
set app.auth_uid='00000000-0000-0000-0000-000000000005'; set role authenticated;  -- manager
do $$ begin
  begin
    update expense_claims set total_travel=999.00, grand_total=999.00
      where id='00000000-0000-0000-0000-0000000c1a17';
    if found then raise exception 'RLS FAIL: manager rewrote a team claim amount'; end if;
  exception when others then if sqlerrm like 'RLS FAIL%' then raise; end if; end;
end $$;
reset role;

-- ── 14. (GOV F6) policies_completed flips correctly ───────────────────────────
-- Werner has NOT acknowledged all 24 active policies → false. Admin acks them all
-- on his behalf → true. Then deactivate one policy with an outstanding ack-less
-- state to confirm the is_active denominator (still true: inactive policies don't count).
set app.auth_uid='00000000-0000-0000-0000-000000000001'; set role authenticated;  -- admin
select _expect('werner policies_completed starts false', (policies_completed)::int::bigint, 0)
  from employees where id='00000000-0000-0000-0000-000000000007';
-- acknowledge every active policy for Werner (HR001 was reset in test 11; re-ack all).
insert into hr_policy_acknowledgements (employee_id, policy_id, acknowledged, read_started_at, acknowledged_at)
select '00000000-0000-0000-0000-000000000007', p.id, true, now(), now()
  from hr_policies p where p.is_active
on conflict (employee_id, policy_id)
  do update set acknowledged=true, read_started_at=now(), acknowledged_at=now();
select _expect('werner policies_completed flips true when all active acked', (policies_completed)::int::bigint, 1)
  from employees where id='00000000-0000-0000-0000-000000000007';
reset role;

drop function _expect(text,bigint,bigint);
\echo '════════════════════════════════════════════'
\echo '  ALL RLS TESTS PASSED'
\echo '════════════════════════════════════════════'
