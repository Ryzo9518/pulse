-- ════════════════════════════════════════════════════════════════════════════
-- Pulse — reference + org seed (003)
-- Org from docs/org-structure-seed.md (confirmed roles, Ryan = Owner). For dev,
-- auth_user_id is pre-linked to the row id so sessions resolve; in production it
-- is set at first M365 sign-in. Reference data uses ON CONFLICT DO NOTHING so
-- re-seeding is safe. Full policy bodies (24) + SOP steps are imported from
-- policies-content.js / source-policies at B6 — this seed carries metadata stubs.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Employees (work fields). Owner: Ryan. Admin: Raymond, Ben. Manager: Charl, Kevin. ──
insert into employees (id, auth_user_id, email, first_name, last_name, role, is_owner, status, job_title, department, manager_id, expense_role) values
 ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','ryan@jera.co.za','Ryan','de Kock','admin',true,'active','Business Development Manager','Management',null,'approver'),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','raymond@jera.co.za','Raymond','De Kock','admin',false,'active','Managing Director','Management',null,'approver'),
 ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','ben@jera.co.za','Ben','Oosthuizen','admin',false,'active','Finance Manager','Finance','00000000-0000-0000-0000-000000000002','approver'),
 ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','charl@jera.co.za','Charl','Haasbroek','manager',false,'active','Operations Director','Management','00000000-0000-0000-0000-000000000002','approver'),
 ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000005','kevin@jera.co.za','Kevin','Maroveke','manager',false,'active','ERP Systems Manager','Consulting','00000000-0000-0000-0000-000000000002','approver'),
 ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000006','melicke@jera.co.za','Melicke','Olivier','employee',false,'active','Payroll & HR Software Consultant','HR','00000000-0000-0000-0000-000000000004','submitter'),
 ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000007','werner@jera.co.za','Werner','Taute','employee',false,'active','Sage X3 Senior Consultant','Consulting','00000000-0000-0000-0000-000000000005','submitter'),
 ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000008','liberty@jera.co.za','Liberty','Maworera','employee',false,'active','Sage X3 Senior Consultant','Consulting','00000000-0000-0000-0000-000000000005','submitter'),
 ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000009','riette@jera.co.za','Riette','Du Toit','employee',false,'active','Sage X3 Senior Consultant','Consulting','00000000-0000-0000-0000-000000000005','submitter'),
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a','ruth@jera.co.za','Ruth','Elston','employee',false,'active','Sage X3 Senior Consultant','Consulting','00000000-0000-0000-0000-000000000005','submitter'),
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000b','leon@jera.co.za','Leon','De Kock','employee',false,'active','Retail Consultant','Consulting','00000000-0000-0000-0000-000000000005','submitter'),
 ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000c','michael@jera.co.za','Michael','Olivier','employee',false,'onboarding','Junior Consultant','Consulting','00000000-0000-0000-0000-000000000005','submitter'),
 ('00000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-00000000000d','sikolwethu@jera.co.za','Sikolwethu','Dlamini','employee',false,'probation','IT & Sage Junior Consultant','Consulting','00000000-0000-0000-0000-000000000005','submitter'),
 ('00000000-0000-0000-0000-00000000000e','00000000-0000-0000-0000-00000000000e','jo-ann@jera.co.za','Jo-ann','Witten','employee',false,'active','Receptionist','Admin','00000000-0000-0000-0000-000000000003','submitter')
on conflict (id) do nothing;

-- ── Products (Sage catalogue) ────────────────────────────────────────────────
insert into products (id, name, cert, course, hours) values
 ('intacct','Sage Intacct','Sage Intacct Implementation Specialist','Implementing Sage Intacct',25),
 ('x3','Sage X3','Sage X3 Certified Consultant','Sage X3 Implementation',40),
 ('300people','Sage 300 People','Sage 300 People Certified','Sage 300 People Payroll',24),
 ('200evo','Sage 200 Evolution','Sage 200 Evolution Certified','Sage 200 Evolution',24),
 ('pastel','Sage Pastel / Accounting','Sage Accounting Certified','Sage Accounting',16),
 ('payroll','Payroll Advanced','Payroll Advanced Certified','Advanced Payroll',16)
on conflict (id) do nothing;

-- ── Onboarding phases + a representative task set (full template generated at B-build) ──
insert into onboarding_phases (id, name, icon, days_label, visibility, sort_order) values
 ('pre','Pre-Arrival','📋','Before Day 1','admin',1),
 ('day1','Day 1 — Welcome','🎉','Day 1','both',2),
 ('it','IT Setup','💻','Day 1–2','both',3),
 ('hr','HR Admin','📑','Day 2–3','admin',4),
 ('training','Orientation','🎓','Week 1–2','employee',5)
on conflict (id) do nothing;

insert into onboarding_tasks (id, phase_id, title, default_owner, priority, system, days_offset, visibility, manager_hidden, sort_order) values
 ('t6','day1','Welcome & office tour','ryan','high',null,0,'both',false,1),
 ('t7','day1','Sign employment contract & NDA','hr','high',null,0,'both',true,2),
 ('t11','it','Configure laptop & install software','siko','high','microsoft',1,'admin',false,3),
 ('t20','hr','Complete tax & banking detail forms','hr','high',null,2,'admin',false,4),
 ('t38','training','Read & acknowledge all HR policies','ryan','high',null,5,'employee',false,5)
on conflict (id) do nothing;

-- ── All 24 HR policies (metadata; full HTML bodies imported at B6 / Word→HTML) ─
insert into hr_policies (id, code, title, version, effective, sort_order, is_active) values
 ('HR001','JERA-POL-HR001','Code of Ethics','v2026.1','April 2026',1,true),
 ('HR002','JERA-POL-HR002','Code of Conduct','v2026.1','April 2026',2,true),
 ('HR003','JERA-POL-HR003','Remuneration Policy','v2026.1','April 2026',3,true),
 ('HR004','JERA-POL-HR004','Performance Management','v2026.1','April 2026',4,true),
 ('HR005','JERA-POL-HR005','Leave Policy','v2026.1','April 2026',5,true),
 ('HR006','JERA-POL-HR006','Recruitment and Selection','v2026.1','April 2026',6,true),
 ('HR007','JERA-POL-HR007','IT Equipment Allowance Policy','v2026.1','April 2026',7,true),
 ('HR008','JERA-POL-HR008','Travel and Subsistence Allowance Policy','v2026.1','April 2026',8,true),
 ('HR009','JERA-POL-HR009','Private Work After Hours Policy','v2026.1','April 2026',9,true),
 ('HR010','JERA-POL-HR010','Contractor Policy','v2026.1','April 2026',10,true),
 ('HR011','JERA-POL-HR011','Overtime Payment Policy','v2026.1','April 2026',11,true),
 ('HR012','JERA-POL-HR012','Smoking Policy','v2026.1','April 2026',12,true),
 ('HR013','JERA-POL-HR013','Employment Equity Policy','v2026.1','April 2026',13,true),
 ('HR014','JERA-POL-HR014','Employee Relations Policy','v2026.1','April 2026',14,true),
 ('HR015','JERA-POL-HR015','Occupational Health and Safety','v2026.1','April 2026',15,true),
 ('HR016','JERA-POL-HR016','Disciplinary Code','v2026.1','April 2026',16,true),
 ('HR017','JERA-POL-HR017','Grievance Policy and Procedure','v2026.1','April 2026',17,true),
 ('HR018','JERA-POL-HR018','Termination of Employment','v2026.1','April 2026',18,true),
 ('HR019','JERA-POL-HR019','Retrenchment Policy','v2026.1','April 2026',19,true),
 ('HR020','JERA-POL-HR020','Workbook for Managing Incapacity','v2026.1','April 2026',20,true),
 ('HR021','JERA-POL-HR021','Service Delivery Framework','v2.0','April 2026',21,true),
 ('HR022','JERA-POL-HR022','Document Management Policy','v1.0','April 2026',22,true),
 ('HR023','JERA-POL-HR023','Time Logging Policy','v1.2','April 2026',23,true),
 ('HR024','JERA-POL-HR024','Paternal Leave','v1.0','April 2026',24,true)
on conflict (id) do nothing;

-- ── SOPs ─────────────────────────────────────────────────────────────────────
insert into sops (key, name, icon, total_steps) values
 ('projects','Zoho Projects','📁',7),
 ('desk','Zoho Desk','🎫',8),
 ('timekeeping','Timekeeping','⏱️',6),
 ('client_access','Client Access','🔐',5)
on conflict (key) do nothing;
