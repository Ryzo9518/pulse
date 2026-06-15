-- Test-only fixtures for RLS verification. Werner (…07) is a consultant who
-- reports to Kevin (…05, manager). Liberty (…08) is a peer (same manager) who
-- must NOT see Werner's private data.

-- POPIA: Werner's tax/banking (managers must never see this).
insert into employee_tax_banking (employee_id, bank_name, account_number, consent_given)
values ('00000000-0000-0000-0000-000000000007','FNB','62001234567',true);

-- Werner's submitted expense claim (manager Kevin should see; peer Liberty should not).
insert into expense_claims (id, employee_id, claim_period, status, total_other, total_travel, total_advances, grand_total, timesheet_filename, submitted_at)
values ('00000000-0000-0000-0000-0000000c1a17','00000000-0000-0000-0000-000000000007','June 2026','submitted',0,459.00,0,459.00,'timesheet-june.pdf',now());
insert into expense_travel_lines (claim_id, client_name, invoiced, rate_basis, rate_per_km, km_traveled, amount)
values ('00000000-0000-0000-0000-0000000c1a17','Acme Ltd',false,'fixed_cost',4.59,100,459.00);

-- Werner's training status + a product cert.
insert into training_status (employee_id, product, ilt_date, getting_started_done)
values ('00000000-0000-0000-0000-000000000007','x3','2026-07-15',true);
insert into certifications (employee_id, cclass, vendor, product, name, issued, expiry)
values ('00000000-0000-0000-0000-000000000007','product','Sage','Sage X3','Sage X3 Certified Consultant','2025-03-01','2027-03-01');

-- Werner's onboarding workflow + task statuses (normal / contract / hr-phase).
insert into onboarding_workflows (id, employee_id)
values ('00000000-0000-0000-0000-0000000f0007','00000000-0000-0000-0000-000000000007');
insert into onboarding_task_status (workflow_id, task_id, status) values
 ('00000000-0000-0000-0000-0000000f0007','t6','done'),    -- normal day-1 task (manager may see)
 ('00000000-0000-0000-0000-0000000f0007','t7','pending'), -- contract/NDA (manager_hidden — manager must NOT see)
 ('00000000-0000-0000-0000-0000000f0007','t20','pending');-- hr-phase (manager must NOT see)

-- An active company document.
insert into documents (title, category, file_type, is_active)
values ('Leave Application Form','employee_forms','pdf',true);
