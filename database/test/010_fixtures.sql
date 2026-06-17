-- Test-only fixtures for RLS verification. Werner (…07) is a consultant who
-- reports to Kevin (…05, manager). Liberty (…08) is a peer (same manager) who
-- must NOT see Werner's private data.

-- POPIA: Werner's tax/banking + personal + medical + emergency + contract
-- (managers and peers must never see any of these).
insert into employee_tax_banking (employee_id, bank_name, account_number, consent_given)
values ('00000000-0000-0000-0000-000000000007','FNB','62001234567',true);
insert into employee_personal_info (employee_id, id_number)
values ('00000000-0000-0000-0000-000000000007','9001015800087');
insert into employee_medical_info (employee_id, medical_aid, consent_given)
values ('00000000-0000-0000-0000-000000000007','Discovery Health',true);
insert into emergency_contacts (employee_id, contact_order, full_name, relationship)
values ('00000000-0000-0000-0000-000000000007',1,'Jane Taute','Spouse');
insert into contract_uploads (employee_id, file_url, file_name)
values ('00000000-0000-0000-0000-000000000007','sharepoint://hr/werner-contract.pdf','Werner-contract.pdf');

-- Werner's submitted expense claim (manager Kevin should see; peer Liberty should not).
insert into expense_claims (id, employee_id, claim_period, status, total_other, total_travel, total_advances, grand_total, timesheet_filename, submitted_at)
values ('00000000-0000-0000-0000-0000000c1a17','00000000-0000-0000-0000-000000000007','June 2026','submitted',0,459.00,0,459.00,'timesheet-june.pdf',now());
insert into expense_travel_lines (claim_id, client_name, invoiced, rate_basis, rate_per_km, km_traveled, amount)
values ('00000000-0000-0000-0000-0000000c1a17','Acme Ltd',false,'fixed_cost',4.59,100,459.00);

-- Werner's training status + a product cert.
insert into training_status (employee_id, product, ilt_date, getting_started_done)
values ('00000000-0000-0000-0000-000000000007','x3','2026-07-15',true);
-- Melicke (…06) reports to Charl (…04), NOT Kevin (…05). Her training_status row
-- exists so a cross-team-manager leak is detectable: pre-F2, Kevin's org-wide
-- pulse_is_staff() read returns BOTH Werner + Melicke (count 2); post-F2 the
-- team-scoped read returns only Werner (count 1). (GOV F7 pinned negative test.)
insert into training_status (employee_id, product, getting_started_done)
values ('00000000-0000-0000-0000-000000000006','payroll',true);
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

-- Acknowledgement fixtures (for ack-reset + policies_completed tests).
-- Werner has an ACKNOWLEDGED ack of HR001 (so a publish can reset it). The other
-- 23 active policies are unacknowledged, so Werner's policies_completed is false
-- until every active policy is acknowledged.
insert into hr_policy_acknowledgements (employee_id, policy_id, acknowledged, read_started_at, acknowledged_at)
values ('00000000-0000-0000-0000-000000000007','HR001',true,now(),now());
