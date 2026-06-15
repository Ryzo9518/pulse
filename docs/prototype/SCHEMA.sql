-- Pulse — proposed Postgres schema (Supabase)
-- Derived from the Pulse.dc.html prototype datasets. Adjust types/constraints to taste.
-- RLS policies sketched in comments; enforce the role matrix in HANDOFF.md §2 at the DB layer.

-- ── Roles & people ──────────────────────────────────────────────
create type employee_status as enum ('onboarding', 'probation', 'active', 'inactive');
create type app_role        as enum ('employee', 'manager', 'admin');

create table employees (
  id            uuid primary key default gen_random_uuid(),
  m365_user_id  text unique,                       -- maps to Microsoft 365 identity
  full_name     text not null,
  title         text,
  department    text,
  email         text unique not null,
  status        employee_status not null default 'onboarding',
  role          app_role        not null default 'employee',
  manager_id    uuid references employees(id),     -- for "my team" scoping
  start_date    date,
  avatar_color  text,
  created_at    timestamptz default now()
);
-- RLS: employee sees self; manager sees self + where manager_id = auth.uid()'s employee id
--      (work fields only — expose a view that omits tax/banking/POPIA columns to managers);
--      admin sees all.

-- POPIA-sensitive personal data kept in a separate table, admin-only.
create table employee_private (
  employee_id   uuid primary key references employees(id) on delete cascade,
  sa_id_number  text,
  tax_number    text,
  bank_name     text,
  bank_account  text,
  residential   text,
  emergency_contact jsonb
);
-- RLS: admin only (managers must NOT read this).

-- ── Onboarding workflow ─────────────────────────────────────────
create type task_status as enum ('pending', 'inprogress', 'done');

create table onboarding_phases (    -- template: Pre-Arrival, Day 1, IT Setup, HR Admin, Orientation
  id        text primary key,       -- 'pre','day1','it','hr','training'
  name      text not null,
  icon      text,
  days_label text,
  visibility text not null,         -- 'admin' | 'both' | 'employee'
  sort      int
);

create table onboarding_tasks (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete cascade,
  phase_id     text not null references onboarding_phases(id),
  title        text not null,
  owner_id     uuid references employees(id),       -- assigned responsibility (admin assigns)
  status       task_status not null default 'pending',
  sensitive    boolean not null default false,      -- contract / payroll / POPIA → hidden from managers
  sort         int,
  created_at   timestamptz default now()
);
-- On owner assignment → send Graph email to owner.

-- ── Policies ────────────────────────────────────────────────────
create table policies (
  id          text primary key,        -- 'HR001'
  code        text not null,           -- 'JERA-POL-HR001'
  icon        text,
  title       text not null,
  summary     text,
  current_version_id uuid,
  created_at  timestamptz default now()
);

create table policy_versions (
  id          uuid primary key default gen_random_uuid(),
  policy_id   text not null references policies(id) on delete cascade,
  version     text not null,           -- 'v2026.1'
  effective   date,
  body_html   text,                    -- Word → sanitised HTML
  source_file text,                    -- SharePoint ref to original .docx/PDF
  published_at timestamptz default now()
);

create table policy_acknowledgements (
  employee_id uuid references employees(id) on delete cascade,
  version_id  uuid references policy_versions(id) on delete cascade,
  ack_at      timestamptz default now(),
  primary key (employee_id, version_id)
);
-- Publishing a new version supersedes old acks → employees must re-acknowledge.

-- ── Training ────────────────────────────────────────────────────
create table products (              -- Sage Intacct, X3, 300 People, Payroll Advanced, ...
  id    text primary key,            -- 'intacct'
  name  text not null,
  cert_name text,
  course    text
);

create table training_paths (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null references products(id),
  path_key   text not null,          -- 'core','projects','contracts', ...
  name       text not null,
  tag        text,
  note       text,
  sort       int
);

create table training_modules (
  id        uuid primary key default gen_random_uuid(),
  path_id   uuid not null references training_paths(id) on delete cascade,
  group_label text,                  -- 'Core Learning','Get Certified', ...
  name      text not null,
  type      text,                    -- video|ilt|assessment|link|stage
  tag       text,                    -- 'required'|'recommended'|null
  sort      int
);

create table training_progress (
  employee_id uuid references employees(id) on delete cascade,
  module_id   uuid references training_modules(id) on delete cascade,
  done        boolean default false,
  done_at     timestamptz,
  primary key (employee_id, module_id)
);

-- Billable readiness (dashboard pipeline) derived per employee:
create table training_status (
  employee_id uuid primary key references employees(id) on delete cascade,
  product_id  text references products(id),
  foundations_done boolean default false,   -- 'gs'
  ilt_date    date,                          -- entered by consultant
  ilt_done    boolean default false,
  certified   boolean default false
);
-- supervised ≈ start_date + 7d; ilt_complete = ilt_date; certified ≈ ilt_date + 10d.

-- ── Certifications ──────────────────────────────────────────────
create type cert_class as enum ('product', 'graduate');

create table certifications (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  cclass      cert_class not null,
  vendor      text,                  -- organisation: Sage, Microsoft, Nectari, Yooz, AWS
  product     text,                  -- Sage Intacct, Sage X3, Microsoft Azure, ...
  name        text not null,
  nqf_level   text,                  -- graduate certs only
  issued      date,
  expiry      date,                  -- product certs; drives recertification alerts
  file_ref    text,                  -- SharePoint ref to PDF
  created_at  timestamptz default now()
);
-- Manager: read team certs + tender export. Admin: upload/edit any. Employee: own only.

-- ── Expenses ────────────────────────────────────────────────────
create type claim_status as enum ('draft', 'submitted', 'approved', 'returned');
create type expense_kind as enum ('expense', 'travel', 'advance');

create table aa_rate_certificates (
  employee_id  uuid primary key references employees(id) on delete cascade,
  make text, model text, year text, registration text,
  full_rate    numeric(6,2),         -- invoiced clients
  fixed_cost   numeric(6,2),         -- non-invoiced
  running_cost numeric(6,2),
  fuel_price   numeric(6,2),
  file_ref     text,                 -- SharePoint ref to AA certificate PDF
  issued       date
);

create table expense_claims (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  period      text,                  -- 'June 2026'
  status      claim_status not null default 'draft',
  timesheet_attached boolean default false,
  reviewer_id uuid references employees(id),
  reviewed_at timestamptz,
  review_note text,
  created_at  timestamptz default now()
);

create table expense_lines (
  id          uuid primary key default gen_random_uuid(),
  claim_id    uuid not null references expense_claims(id) on delete cascade,
  kind        expense_kind not null,
  line_date   date,
  client      text,
  description text,
  -- travel-only:
  invoiced    boolean,
  invoice_no  text,
  invoice_amount numeric(12,2),
  km          numeric(8,1),
  rate        numeric(6,2),          -- snapshot of AA rate applied
  -- expense / advance:
  amount      numeric(12,2)
);
-- Grand total payable = Σ expense + Σ(travel km*rate) − Σ advance.
-- Manager or admin approves; approval/return → Graph email to employee.

-- ── Documents & announcements ───────────────────────────────────
create table documents (
  id        uuid primary key default gen_random_uuid(),
  category  text,                    -- 'HR & Compliance','Finance','IT & Systems','Templates & Brand'
  name      text not null,
  doc_type  text,                    -- PDF|DOCX|XLSX|LINK
  size_label text,
  url       text,                    -- SharePoint link or storage ref
  uploaded_by uuid references employees(id),
  created_at timestamptz default now()
);

create table announcements (
  id         uuid primary key default gen_random_uuid(),
  subject    text not null,
  body       text not null,
  audience   text not null,          -- 'all'|'onboarding'|'probation'|'consulting'
  via_email  boolean default true,
  via_inapp  boolean default true,
  sent_by    uuid references employees(id),
  sent_at    timestamptz default now()
);
-- Admin only. Resolve audience → recipients, send via Graph + create in-app notifications.

create table notifications (         -- in-app delivery of announcements / assignment alerts
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  title       text not null,
  body        text,
  read        boolean default false,
  created_at  timestamptz default now()
);
