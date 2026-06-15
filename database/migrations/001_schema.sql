-- ════════════════════════════════════════════════════════════════════════════
-- Pulse — canonical schema (001)
-- Backend phase B0a. Authoritative DDL; matches frontend/types/database.ts (the
-- app's typed contract). Supersedes database/pulse_v5_schema.sql (stale: 2-role,
-- 20 policies, no certifications/training/aa-rate, `declined` not `returned`).
--
-- Governance requirements baked in (see docs/plans/2026-06-15-002 §Data protection,
-- §Security, §Performance):
--   * NUMERIC(12,2) money / NUMERIC(6,2) rates — never floats.
--   * CHECK constraints (non-negative amounts/km; invoiced⇒full_aa; grand-total
--     consistency) so derived/financial values can't silently drift.
--   * Financial + audit records use ON DELETE RESTRICT; staff are never hard-
--     deleted (termination is a status change). Child claim lines cascade to
--     their claim only.
--   * Append-only acknowledgement EVIDENCE (hr_policy_ack_events) so republishing
--     a policy version never erases proof a prior version was acknowledged.
--   * is_owner flag (super-admin) — see 002_rls.sql for enforcement.
--   * Indexes on every FK / scoping column RLS will filter on.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ── Enums (mirror the TS union types) ────────────────────────────────────────
create type user_role          as enum ('admin','manager','employee');
create type employee_status    as enum ('active','onboarding','probation','suspended','terminated');
create type task_status        as enum ('pending','inprogress','done');
create type task_visibility    as enum ('employee','admin','both');
create type expense_status     as enum ('draft','submitted','approved','returned','paid');
create type travel_rate_basis  as enum ('full_aa','fixed_cost');
create type expense_role       as enum ('submitter','approver','both');
create type sop_key            as enum ('projects','desk','timekeeping','client_access');
create type form_key           as enum ('personal','emergency','tax','policies','goals');
create type notification_type  as enum ('info','urgent','celebration','reminder');
create type message_type       as enum ('announcement','chat');
create type document_category  as enum ('contracts_policies','timesheets_invoicing','job_descriptions','sops_procedures','employee_forms','hr_policies','other');
create type cert_class         as enum ('product','graduate');
create type cert_vendor        as enum ('Sage','Nectari','Microsoft','Yooz','AWS','Other');
create type product_id         as enum ('intacct','x3','300people','200evo','pastel','payroll');

-- ── Shared helpers ───────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- Employees + POPIA-sensitive satellite tables
-- ════════════════════════════════════════════════════════════════════════════
create table employees (
  id                   uuid primary key default gen_random_uuid(),
  -- Supabase auth mapping: the signed-in M365 user's auth.users id. Roles are
  -- NOT taken from M365 — see role below (managed in Pulse). Nullable for
  -- seeded/non-auth rows.
  auth_user_id         uuid unique,
  email                text not null unique,
  first_name           text not null,
  last_name            text not null,
  display_name         text not null,        -- maintained by trigger
  avatar_initials      text not null,        -- maintained by trigger
  role                 user_role not null default 'employee',
  -- Super-admin / owner: unrestricted + protected top authority. Only an owner
  -- may grant/revoke admin/owner, and an owner can't be demoted/locked out.
  is_owner             boolean not null default false,
  status               employee_status not null default 'active',
  job_title            text,
  department           text,
  phone                text,                 -- POPIA personal (work contact)
  avatar_color         text not null default '#911431',
  manager_id           uuid references employees(id) on delete restrict,
  start_date           date,
  two_factor_enabled   boolean not null default false,
  expense_role         expense_role not null default 'submitter',
  policies_completed    boolean not null default false,
  onboarding_completed  boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index employees_manager_id_idx on employees(manager_id);
create index employees_status_idx on employees(status);
create index employees_role_idx on employees(role);

-- display_name / avatar_initials are derived (contract: "auto-generated").
create or replace function employees_derive() returns trigger language plpgsql as $$
begin
  new.display_name := trim(new.first_name || ' ' || new.last_name);
  new.avatar_initials := upper(left(new.first_name,1) || left(new.last_name,1));
  new.updated_at := now();
  return new;
end $$;
create trigger employees_derive_trg before insert or update on employees
  for each row execute function employees_derive();

-- POPIA "special / personal" satellites — separated so RLS + (B0.5) column
-- encryption can lock them down independently of the work-fields row.
create table employee_personal_info (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null unique references employees(id) on delete restrict,
  id_number     text,            -- POPIA special — encrypt at rest (B0.5)
  date_of_birth date,
  gender        text,
  nationality   text,
  home_language text,
  home_address  text,
  city          text,
  province      text,
  postal_code   text,
  cell_phone    text,
  personal_email text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger eptinfo_updated before update on employee_personal_info for each row execute function set_updated_at();

create table emergency_contacts (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references employees(id) on delete restrict,
  contact_order int not null default 1,
  full_name     text not null,
  relationship  text,
  address       text,
  cell_phone    text,
  home_phone    text,
  work_phone    text,
  employer      text,
  created_at    timestamptz not null default now(),
  unique(employee_id, contact_order)
);
create index emergency_contacts_employee_idx on emergency_contacts(employee_id);

create table employee_medical_info (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null unique references employees(id) on delete restrict,
  doctor_name       text,
  doctor_phone      text,
  medical_aid       text,            -- POPIA special — encrypt at rest (B0.5)
  medical_aid_number text,           -- POPIA special — encrypt at rest (B0.5)
  allergies         text,            -- POPIA special
  consent_given     boolean not null default false,
  consent_date      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger emed_updated before update on employee_medical_info for each row execute function set_updated_at();

create table employee_tax_banking (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null unique references employees(id) on delete restrict,
  tax_ref_number text,               -- POPIA special — encrypt at rest (B0.5)
  tax_status     text,
  bank_name      text,
  account_holder text,
  account_number text,               -- POPIA special — encrypt at rest (B0.5)
  branch_code    text,
  account_type   text,
  consent_given  boolean not null default false,
  consent_date   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger etax_updated before update on employee_tax_banking for each row execute function set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- Onboarding
-- ════════════════════════════════════════════════════════════════════════════
create table onboarding_phases (
  id          text primary key,
  name        text not null,
  icon        text,
  days_label  text,
  visibility  task_visibility not null default 'both',
  sort_order  int not null default 0
);

create table onboarding_tasks (
  id             text primary key,
  phase_id       text not null references onboarding_phases(id) on delete restrict,
  title          text not null,
  default_owner  text,
  priority       text not null default 'medium',
  system         text,
  days_offset    int not null default 0,
  visibility     task_visibility not null default 'both',
  manager_hidden boolean not null default false,   -- contract/NDA etc. hidden from managers
  sort_order     int not null default 0
);
create index onboarding_tasks_phase_idx on onboarding_tasks(phase_id);

create table onboarding_workflows (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete restrict,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_by   uuid references employees(id) on delete set null
);
create index onboarding_workflows_employee_idx on onboarding_workflows(employee_id);

create table onboarding_task_status (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid not null references onboarding_workflows(id) on delete cascade,
  task_id      text not null references onboarding_tasks(id) on delete restrict,
  assigned_to  uuid references employees(id) on delete set null,
  status       task_status not null default 'pending',
  started_at   timestamptz,
  completed_at timestamptz,
  completed_by uuid references employees(id) on delete set null,
  unique(workflow_id, task_id)
);
create index onboarding_task_status_workflow_idx on onboarding_task_status(workflow_id);

create table onboarding_form_completions (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete restrict,
  form_key     form_key not null,
  completed_at timestamptz not null default now(),
  unique(employee_id, form_key)
);

create table employee_goals (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete restrict,
  period      text not null,                 -- '30' / '60' / '90'
  goal_number int not null,
  goal_text   text,
  is_achieved boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid references employees(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index employee_goals_employee_idx on employee_goals(employee_id);

create table contract_uploads (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete restrict,
  file_url    text not null,
  file_name   text,
  uploaded_by uuid references employees(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  signed      boolean not null default false,
  signed_at   timestamptz
);
create index contract_uploads_employee_idx on contract_uploads(employee_id);

-- ════════════════════════════════════════════════════════════════════════════
-- Policies (+ append-only acknowledgement evidence)
-- ════════════════════════════════════════════════════════════════════════════
create table hr_policies (
  id           text primary key,             -- 'HR001'
  code         text not null,                -- 'JERA-POL-HR001'
  title        text not null,
  icon         text,
  summary      text,
  full_text    text,
  version      text not null default 'v1.0',
  effective    text not null default '',
  document_url text,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table hr_policy_acknowledgements (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references employees(id) on delete restrict,
  policy_id        text not null references hr_policies(id) on delete restrict,
  acknowledged     boolean not null default false,
  read_started_at  timestamptz,
  acknowledged_at  timestamptz,
  unique(employee_id, policy_id)
);
create index hr_policy_ack_employee_idx on hr_policy_acknowledgements(employee_id);

-- Append-only evidence: each acknowledgement of a specific version, never
-- updated/deleted. Publishing a new version resets the *current* ack above, but
-- the historical proof survives here (POPIA / labour-law defensibility).
create table hr_policy_ack_events (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references employees(id) on delete restrict,
  policy_id       text not null references hr_policies(id) on delete restrict,
  policy_version  text not null,
  acknowledged_at timestamptz not null default now()
);
create index hr_policy_ack_events_emp_idx on hr_policy_ack_events(employee_id);

-- ════════════════════════════════════════════════════════════════════════════
-- SOPs
-- ════════════════════════════════════════════════════════════════════════════
create table sops (
  key         sop_key primary key,
  name        text not null,
  icon        text,
  total_steps int not null default 0
);
create table sop_steps (
  id          uuid primary key default gen_random_uuid(),
  sop_key     sop_key not null references sops(key) on delete cascade,
  step_number int not null,
  icon        text,
  title       text not null,
  description text,
  detail      text,
  action_text text,
  tip_text    text,
  unique(sop_key, step_number)
);
create table sop_completions (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete restrict,
  sop_key      sop_key not null references sops(key) on delete restrict,
  current_step int not null default 0,
  completed    boolean not null default false,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique(employee_id, sop_key)
);

-- ════════════════════════════════════════════════════════════════════════════
-- Expenses (three-part claim; money discipline enforced)
-- ════════════════════════════════════════════════════════════════════════════
create table expense_claims (
  id                 uuid primary key default gen_random_uuid(),
  employee_id        uuid not null references employees(id) on delete restrict,
  claim_period       text,
  status             expense_status not null default 'draft',
  total_other        numeric(12,2) not null default 0 check (total_other >= 0),
  total_travel       numeric(12,2) not null default 0 check (total_travel >= 0),
  total_advances     numeric(12,2) not null default 0 check (total_advances >= 0),
  grand_total        numeric(12,2) not null default 0,
  timesheet_filename text,
  submitted_at       timestamptz,
  approver_id        uuid references employees(id) on delete restrict,
  reviewed_by        uuid references employees(id) on delete restrict,
  reviewed_at        timestamptz,
  review_notes       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- grand total can never drift from its parts.
  constraint expense_grand_total_consistent
    check (grand_total = total_other + total_travel - total_advances)
);
create index expense_claims_employee_idx on expense_claims(employee_id);
create index expense_claims_status_idx on expense_claims(status) where status = 'submitted';
create trigger expense_claims_updated before update on expense_claims for each row execute function set_updated_at();

create table expense_travel_lines (
  id             uuid primary key default gen_random_uuid(),
  claim_id       uuid not null references expense_claims(id) on delete cascade,
  client_name    text not null,
  travel_date    date,
  reason         text,
  invoiced       boolean not null default false,
  invoice_no     text,
  invoice_amount numeric(12,2) check (invoice_amount is null or invoice_amount >= 0),
  rate_basis     travel_rate_basis not null,
  rate_per_km    numeric(6,2) not null check (rate_per_km >= 0),
  km_traveled    numeric(10,2) check (km_traveled is null or km_traveled >= 0),
  amount         numeric(12,2) check (amount is null or amount >= 0),
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  -- invoiced travel is billed at the full AA rate; non-invoiced at fixed cost.
  constraint travel_rate_basis_matches_invoiced
    check ((invoiced and rate_basis = 'full_aa') or (not invoiced and rate_basis = 'fixed_cost')),
  -- an invoiced line must carry its invoice reference.
  constraint travel_invoiced_has_ref
    check (not invoiced or (invoice_no is not null and length(trim(invoice_no)) > 0))
);
create index expense_travel_lines_claim_idx on expense_travel_lines(claim_id);

create table expense_other_lines (
  id          uuid primary key default gen_random_uuid(),
  claim_id    uuid not null references expense_claims(id) on delete cascade,
  client_name text not null,
  expense_date date,
  description text,
  amount      numeric(12,2) check (amount is null or amount >= 0),
  receipt_url text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index expense_other_lines_claim_idx on expense_other_lines(claim_id);

create table expense_advance_lines (
  id           uuid primary key default gen_random_uuid(),
  claim_id     uuid not null references expense_claims(id) on delete cascade,
  advance_date date,
  details      text,
  amount       numeric(12,2) check (amount is null or amount >= 0),
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index expense_advance_lines_claim_idx on expense_advance_lines(claim_id);

create table aa_rate_certificates (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null unique references employees(id) on delete restrict,
  make         text not null default '',
  model        text not null default '',
  year         text not null default '',
  registration text,
  full_rate    numeric(6,2) not null default 0 check (full_rate >= 0),
  fixed_cost   numeric(6,2) not null default 0 check (fixed_cost >= 0),
  running_cost numeric(6,2) not null default 0 check (running_cost >= 0),
  fuel_price   numeric(6,2) not null default 0 check (fuel_price >= 0),
  file_name    text,
  issued_date  date,
  uploaded     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger aa_rate_cert_updated before update on aa_rate_certificates for each row execute function set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- Comms, documents, audit
-- ════════════════════════════════════════════════════════════════════════════
create table messages (
  id           uuid primary key default gen_random_uuid(),
  channel      text not null,
  message_type message_type not null default 'chat',
  author_id    uuid not null references employees(id) on delete restrict,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index messages_channel_idx on messages(channel);
create index messages_author_id_idx on messages(author_id);   -- RLS filters on author_id

create table admin_notifications (
  id                uuid primary key default gen_random_uuid(),
  sent_by           uuid not null references employees(id) on delete restrict,
  notification_type notification_type not null default 'info',
  subject           text not null,
  body              text not null,
  target            text not null,
  created_at        timestamptz not null default now()
);

create table email_log (
  id                  uuid primary key default gen_random_uuid(),
  from_employee       uuid references employees(id) on delete set null,
  to_email            text not null,
  to_employee         uuid references employees(id) on delete set null,
  subject             text not null,
  body                text,
  email_type          text,
  -- provider message id (M365 Graph sendMail returns no id; kept nullable).
  -- Column name retained for the typed contract (resend_id) — see B4 note.
  resend_id           text,
  sent_at             timestamptz not null default now()
);

create table documents (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  category        document_category not null default 'other',
  file_type       text,
  file_url        text,
  file_size_bytes bigint,
  uploaded_by     uuid references employees(id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index documents_active_idx on documents(category) where is_active;
create trigger documents_updated before update on documents for each row execute function set_updated_at();

create table document_acknowledgements (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete restrict,
  employee_id     uuid not null references employees(id) on delete restrict,
  acknowledged_at timestamptz not null default now(),
  unique(document_id, employee_id)
);
create index document_acknowledgements_employee_idx on document_acknowledgements(employee_id);   -- RLS filters on employee_id

-- Append-only audit log (no UPDATE/DELETE granted; see 002_rls.sql).
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete restrict,
  action      text not null,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_employee_idx on audit_log(employee_id);
create index audit_log_created_idx on audit_log(created_at desc);

-- ════════════════════════════════════════════════════════════════════════════
-- Training / certifications
-- ════════════════════════════════════════════════════════════════════════════
create table products (
  id     product_id primary key,
  name   text not null,
  cert   text not null default '',
  course text not null default '',
  hours  int not null default 0
);

-- Per-consultant billable-readiness status (maps TrainingEnrolment / training_status).
create table training_status (
  employee_id         uuid primary key references employees(id) on delete restrict,
  product             product_id not null,
  cert_path           text not null default 'implementation',
  ilt_date            date,
  getting_started_done boolean not null default false,
  ilt_done            boolean not null default false,
  certified           boolean not null default false,
  updated_at          timestamptz not null default now()
);
create trigger training_status_updated before update on training_status for each row execute function set_updated_at();

-- Per-module completion (maps modules_done / training_progress).
create table training_progress (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete restrict,
  module_key  text not null,     -- ${product}:${pathId}:${moduleSlug}
  done        boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique(employee_id, module_key)
);
create index training_progress_employee_idx on training_progress(employee_id);

create table certifications (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete restrict,
  cclass      cert_class not null,
  vendor      cert_vendor,
  product     text,
  name        text not null,
  nqf_level   text,
  issued      date,
  expiry      date,                -- product certs only; drives recert alerts
  file_ref    text,
  created_at  timestamptz not null default now(),
  -- product certs carry vendor/product; qualifications carry nqf_level.
  constraint cert_class_fields check (
    (cclass = 'product'  and nqf_level is null) or
    (cclass = 'graduate' and vendor is null and product is null and expiry is null)
  )
);
create index certifications_employee_idx on certifications(employee_id);
create index certifications_expiry_idx on certifications(expiry) where expiry is not null;

-- ════════════════════════════════════════════════════════════════════════════
-- Views (admin dashboard) — match the 3 contract view types
-- ════════════════════════════════════════════════════════════════════════════
-- security_invoker: the view runs with the CALLER's rights so base-table RLS
-- applies (without it, views run as owner and bypass RLS — leaking PII/financials).
create view admin_onboarding_summary with (security_invoker = true) as
select
  e.id, e.display_name, e.email, e.status, e.start_date, e.department, e.job_title,
  coalesce((select count(*) from onboarding_form_completions f where f.employee_id = e.id),0)::int as forms_done,
  5 as forms_total,
  coalesce((select count(*) from sop_completions s where s.employee_id = e.id and s.completed),0)::int as sops_done,
  (select count(*) from sops)::int as sops_total,
  coalesce((select count(*) from hr_policy_acknowledgements a where a.employee_id = e.id and a.acknowledged),0)::int as policies_done,
  (select count(*) from hr_policies where is_active)::int as policies_total,
  e.policies_completed,
  coalesce((select count(*) from expense_claims c where c.employee_id = e.id),0)::int as expense_claims_total,
  coalesce((select count(*) from expense_claims c where c.employee_id = e.id and c.status = 'submitted'),0)::int as expense_claims_pending
from employees e;

create view admin_activity_feed with (security_invoker = true) as
select a.id, a.employee_id, e.display_name, e.avatar_initials, e.avatar_color,
       a.action, a.detail, a.created_at
from audit_log a join employees e on e.id = a.employee_id
order by a.created_at desc;

create view pending_expense_approvals with (security_invoker = true) as
select c.id as claim_id, c.claim_period, c.grand_total, c.submitted_at,
       s.display_name as submitter_name, s.email as submitter_email,
       ap.display_name as approver_name
from expense_claims c
join employees s on s.id = c.employee_id
left join employees ap on ap.id = c.approver_id
where c.status = 'submitted';
