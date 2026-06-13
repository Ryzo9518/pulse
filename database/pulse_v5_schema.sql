-- ============================================================================
-- PULSE v5 — Supabase Database Schema (Updated)
-- Jera Consulting (Pty) Ltd
-- Version: 2.0.0 | April 2026
-- Changes from v1: Removed leave & meetings. Added policy walkthrough
-- tracking with mandatory gate. Added expense approver workflow.
-- Split onboarding tasks into employee-visible vs admin-only.
-- Run: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE employee_status AS ENUM ('active', 'onboarding', 'probation', 'suspended', 'terminated');
CREATE TYPE task_status AS ENUM ('pending', 'inprogress', 'done');
CREATE TYPE task_visibility AS ENUM ('employee', 'admin', 'both');
CREATE TYPE expense_status AS ENUM ('draft', 'submitted', 'approved', 'declined', 'paid');
CREATE TYPE expense_role AS ENUM ('submitter', 'approver', 'both');
CREATE TYPE sop_key AS ENUM ('projects', 'desk', 'timekeeping', 'client_access');
CREATE TYPE form_key AS ENUM ('personal', 'emergency', 'tax', 'policies', 'goals');
CREATE TYPE notification_type AS ENUM ('info', 'urgent', 'celebration', 'reminder');
CREATE TYPE message_type AS ENUM ('announcement', 'chat');
CREATE TYPE document_category AS ENUM ('contracts_policies', 'timesheets_invoicing', 'job_descriptions', 'sops_procedures', 'employee_forms', 'hr_policies', 'other');
CREATE TYPE policy_status AS ENUM ('not_started', 'in_progress', 'completed');

-- ============================================================================
-- 2. EMPLOYEES
-- ============================================================================
CREATE TABLE employees (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email               TEXT UNIQUE NOT NULL,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    display_name        TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_initials     TEXT GENERATED ALWAYS AS (UPPER(LEFT(first_name, 1) || LEFT(last_name, 1))) STORED,
    role                user_role NOT NULL DEFAULT 'employee',
    status              employee_status NOT NULL DEFAULT 'onboarding',
    job_title           TEXT,
    department          TEXT,
    phone               TEXT,
    avatar_color        TEXT DEFAULT '#911431',
    manager_id          UUID REFERENCES employees(id),
    start_date          DATE,
    two_factor_enabled  BOOLEAN DEFAULT FALSE,
    expense_role        expense_role NOT NULL DEFAULT 'submitter',  -- can submit, approve, or both
    policies_completed  BOOLEAN DEFAULT FALSE,  -- gate: all 20 HR policies acknowledged
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. EMPLOYEE PERSONAL DATA (Forms 1-3)
-- ============================================================================
CREATE TABLE employee_personal_info (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    id_number       TEXT,
    date_of_birth   DATE,
    gender          TEXT,
    nationality     TEXT,
    home_language   TEXT,
    home_address    TEXT,
    city            TEXT,
    province        TEXT,
    postal_code     TEXT,
    cell_phone      TEXT,
    personal_email  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emergency_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contact_order   SMALLINT NOT NULL DEFAULT 1,
    full_name       TEXT NOT NULL,
    relationship    TEXT,
    address         TEXT,
    cell_phone      TEXT,
    home_phone      TEXT,
    work_phone      TEXT,
    employer        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, contact_order)
);

CREATE TABLE employee_medical_info (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    doctor_name         TEXT,
    doctor_phone        TEXT,
    medical_aid         TEXT,
    medical_aid_number  TEXT,
    allergies           TEXT,
    consent_given       BOOLEAN DEFAULT FALSE,
    consent_date        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_tax_banking (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    tax_ref_number  TEXT,
    tax_status      TEXT,
    bank_name       TEXT,
    account_holder  TEXT,
    account_number  TEXT,
    branch_code     TEXT,
    account_type    TEXT,
    consent_given   BOOLEAN DEFAULT FALSE,
    consent_date    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. ONBOARDING (with visibility split)
-- ============================================================================
CREATE TABLE onboarding_phases (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT,
    days_label  TEXT,
    visibility  task_visibility NOT NULL DEFAULT 'both',  -- who sees this phase
    sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE onboarding_tasks (
    id              TEXT PRIMARY KEY,
    phase_id        TEXT NOT NULL REFERENCES onboarding_phases(id),
    title           TEXT NOT NULL,
    default_owner   TEXT,
    priority        TEXT DEFAULT 'medium',
    system          TEXT,
    days_offset     SMALLINT DEFAULT 0,
    visibility      task_visibility NOT NULL DEFAULT 'both',  -- employee / admin / both
    sort_order      SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE onboarding_workflows (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    created_by      UUID REFERENCES employees(id)
);

CREATE TABLE onboarding_task_status (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id     UUID NOT NULL REFERENCES onboarding_workflows(id) ON DELETE CASCADE,
    task_id         TEXT NOT NULL REFERENCES onboarding_tasks(id),
    assigned_to     UUID REFERENCES employees(id),
    status          task_status NOT NULL DEFAULT 'pending',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES employees(id),
    UNIQUE(workflow_id, task_id)
);

CREATE TABLE onboarding_form_completions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    form_key        form_key NOT NULL,
    completed_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, form_key)
);

CREATE TABLE employee_goals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period          TEXT NOT NULL,
    goal_number     SMALLINT NOT NULL,
    goal_text       TEXT,
    is_achieved     BOOLEAN DEFAULT FALSE,
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     UUID REFERENCES employees(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, period, goal_number)
);

-- Employment contract upload
CREATE TABLE contract_uploads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    file_url        TEXT NOT NULL,          -- Supabase storage path
    file_name       TEXT,
    uploaded_by     UUID REFERENCES employees(id),
    uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
    signed          BOOLEAN DEFAULT FALSE,
    signed_at       TIMESTAMPTZ
);

-- ============================================================================
-- 5. HR POLICY WALKTHROUGHS (the 20 policies with mandatory acknowledgement)
-- ============================================================================
CREATE TABLE hr_policies (
    id              TEXT PRIMARY KEY,       -- e.g. 'HR001'
    code            TEXT NOT NULL,          -- e.g. 'JERA-POL-HR001'
    title           TEXT NOT NULL,
    icon            TEXT,
    summary         TEXT,                   -- short description
    full_text       TEXT,                   -- full policy content (or key sections)
    document_url    TEXT,                   -- link to full PDF in storage
    sort_order      SMALLINT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Per-employee acknowledgement with timestamp (the audit trail)
CREATE TABLE hr_policy_acknowledgements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    policy_id       TEXT NOT NULL REFERENCES hr_policies(id),
    acknowledged    BOOLEAN DEFAULT FALSE,
    read_started_at TIMESTAMPTZ,            -- when they opened it
    acknowledged_at TIMESTAMPTZ,            -- when they ticked "I have read and understood"
    UNIQUE(employee_id, policy_id)
);

-- ============================================================================
-- 6. SOPs (with client_access SOP added)
-- ============================================================================
CREATE TABLE sops (
    key             sop_key PRIMARY KEY,
    name            TEXT NOT NULL,
    icon            TEXT,
    total_steps     SMALLINT NOT NULL
);

CREATE TABLE sop_steps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sop_key         sop_key NOT NULL REFERENCES sops(key),
    step_number     SMALLINT NOT NULL,
    icon            TEXT,
    title           TEXT NOT NULL,
    description     TEXT,
    detail          TEXT,
    action_text     TEXT,
    tip_text        TEXT,
    UNIQUE(sop_key, step_number)
);

CREATE TABLE sop_completions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    sop_key         sop_key NOT NULL REFERENCES sops(key),
    current_step    SMALLINT NOT NULL DEFAULT 0,
    completed       BOOLEAN DEFAULT FALSE,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    UNIQUE(employee_id, sop_key)
);

-- ============================================================================
-- 7. EXPENSE CLAIMS (with approver workflow)
-- ============================================================================
CREATE TABLE expense_claims (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    claim_period    TEXT,
    status          expense_status NOT NULL DEFAULT 'draft',
    total_travel    NUMERIC(12,2) DEFAULT 0,
    total_other     NUMERIC(12,2) DEFAULT 0,
    grand_total     NUMERIC(12,2) DEFAULT 0,
    submitted_at    TIMESTAMPTZ,
    approver_id     UUID REFERENCES employees(id),  -- who must approve
    reviewed_by     UUID REFERENCES employees(id),
    reviewed_at     TIMESTAMPTZ,
    review_notes    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_travel_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id        UUID NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
    client_name     TEXT NOT NULL,           -- mandatory client name
    travel_date     DATE,
    reason          TEXT,
    rate_per_km     NUMERIC(6,2) DEFAULT 1.50,  -- SARS 2026 rate
    km_traveled     NUMERIC(8,1),
    amount          NUMERIC(12,2),
    sort_order      SMALLINT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_other_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id        UUID NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
    client_name     TEXT NOT NULL,           -- mandatory client name
    expense_date    DATE,
    description     TEXT,
    amount          NUMERIC(12,2),
    receipt_url     TEXT,
    sort_order      SMALLINT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. CHAT & ANNOUNCEMENTS
-- ============================================================================
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel         TEXT NOT NULL DEFAULT 'general',
    message_type    message_type NOT NULL DEFAULT 'chat',
    author_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. ADMIN NOTIFICATIONS & EMAIL LOG
-- ============================================================================
CREATE TABLE admin_notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sent_by             UUID NOT NULL REFERENCES employees(id),
    notification_type   notification_type NOT NULL DEFAULT 'info',
    subject             TEXT NOT NULL,
    body                TEXT NOT NULL,
    target              TEXT DEFAULT 'all',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Email log for ping/notification emails sent via Resend
CREATE TABLE email_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_employee   UUID REFERENCES employees(id),
    to_email        TEXT NOT NULL,
    to_employee     UUID REFERENCES employees(id),
    subject         TEXT NOT NULL,
    body            TEXT,
    email_type      TEXT,                   -- 'ping', 'notification', 'leave_approved', etc.
    resend_id       TEXT,                   -- Resend API response ID
    sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. DOCUMENT LIBRARY
-- ============================================================================
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    description     TEXT,
    category        document_category NOT NULL DEFAULT 'other',
    file_type       TEXT,
    file_url        TEXT,
    file_size_bytes BIGINT,
    uploaded_by     UUID REFERENCES employees(id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_acknowledgements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, employee_id)
);

-- ============================================================================
-- 11. AUDIT LOG
-- ============================================================================
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    action          TEXT NOT NULL,
    detail          JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_employee ON audit_log(employee_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================================
-- 12. INDEXES
-- ============================================================================
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_expense_claims_employee ON expense_claims(employee_id);
CREATE INDEX idx_expense_claims_status ON expense_claims(status);
CREATE INDEX idx_expense_claims_approver ON expense_claims(approver_id);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_sop_completions_employee ON sop_completions(employee_id);
CREATE INDEX idx_policy_ack_employee ON hr_policy_acknowledgements(employee_id);
CREATE INDEX idx_onboarding_ts_workflow ON onboarding_task_status(workflow_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_email_log_to ON email_log(to_employee);

-- ============================================================================
-- 13. UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_personal_updated BEFORE UPDATE ON employee_personal_info FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_medical_updated BEFORE UPDATE ON employee_medical_info FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tax_updated BEFORE UPDATE ON employee_tax_banking FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_expense_updated BEFORE UPDATE ON expense_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 14. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tax_banking ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_form_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_travel_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_other_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is current user an expense approver?
CREATE OR REPLACE FUNCTION is_expense_approver()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND expense_role IN ('approver', 'both'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── EMPLOYEES ──
CREATE POLICY "emp_select" ON employees FOR SELECT USING (true);
CREATE POLICY "emp_insert" ON employees FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "emp_update" ON employees FOR UPDATE USING (id = auth.uid() OR is_admin());

-- ── PERSONAL / EMERGENCY / MEDICAL / TAX ──
CREATE POLICY "pi_sel" ON employee_personal_info FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "pi_ins" ON employee_personal_info FOR INSERT WITH CHECK (employee_id = auth.uid() OR is_admin());
CREATE POLICY "pi_upd" ON employee_personal_info FOR UPDATE USING (employee_id = auth.uid() OR is_admin());

CREATE POLICY "ec_sel" ON emergency_contacts FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "ec_ins" ON emergency_contacts FOR INSERT WITH CHECK (employee_id = auth.uid() OR is_admin());
CREATE POLICY "ec_upd" ON emergency_contacts FOR UPDATE USING (employee_id = auth.uid() OR is_admin());

CREATE POLICY "mi_sel" ON employee_medical_info FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "mi_ins" ON employee_medical_info FOR INSERT WITH CHECK (employee_id = auth.uid() OR is_admin());
CREATE POLICY "mi_upd" ON employee_medical_info FOR UPDATE USING (employee_id = auth.uid() OR is_admin());

CREATE POLICY "tb_sel" ON employee_tax_banking FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "tb_ins" ON employee_tax_banking FOR INSERT WITH CHECK (employee_id = auth.uid() OR is_admin());
CREATE POLICY "tb_upd" ON employee_tax_banking FOR UPDATE USING (employee_id = auth.uid() OR is_admin());

-- ── ONBOARDING ──
-- Phases/tasks: visible based on visibility field
CREATE POLICY "phase_sel" ON onboarding_phases FOR SELECT USING (true);
CREATE POLICY "task_sel" ON onboarding_tasks FOR SELECT USING (
    visibility = 'both' OR
    (visibility = 'employee' AND NOT is_admin()) OR
    (visibility = 'admin' AND is_admin()) OR
    is_admin()  -- admin always sees all
);
CREATE POLICY "wf_sel" ON onboarding_workflows FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "wf_ins" ON onboarding_workflows FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "ts_sel" ON onboarding_task_status FOR SELECT USING (
    EXISTS (SELECT 1 FROM onboarding_workflows w WHERE w.id = workflow_id AND (w.employee_id = auth.uid() OR is_admin()))
    OR assigned_to = auth.uid()  -- responsible person can see tasks assigned to them
);
CREATE POLICY "ts_upd" ON onboarding_task_status FOR UPDATE USING (assigned_to = auth.uid() OR is_admin());
CREATE POLICY "ts_ins" ON onboarding_task_status FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "fc_sel" ON onboarding_form_completions FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "fc_ins" ON onboarding_form_completions FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "gl_sel" ON employee_goals FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "gl_ins" ON employee_goals FOR INSERT WITH CHECK (employee_id = auth.uid() OR is_admin());
CREATE POLICY "gl_upd" ON employee_goals FOR UPDATE USING (employee_id = auth.uid() OR is_admin());

CREATE POLICY "cu_sel" ON contract_uploads FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "cu_ins" ON contract_uploads FOR INSERT WITH CHECK (is_admin());

-- ── HR POLICIES ──
CREATE POLICY "hp_sel" ON hr_policies FOR SELECT USING (is_active = true);
CREATE POLICY "hp_ins" ON hr_policies FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "hpa_sel" ON hr_policy_acknowledgements FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "hpa_ins" ON hr_policy_acknowledgements FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "hpa_upd" ON hr_policy_acknowledgements FOR UPDATE USING (employee_id = auth.uid());

-- ── SOPs ──
CREATE POLICY "sop_sel" ON sops FOR SELECT USING (true);
CREATE POLICY "ss_sel" ON sop_steps FOR SELECT USING (true);
CREATE POLICY "sc_sel" ON sop_completions FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "sc_ins" ON sop_completions FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "sc_upd" ON sop_completions FOR UPDATE USING (employee_id = auth.uid());

-- ── EXPENSES (submitter sees own, approver sees claims assigned to them, admin sees all) ──
CREATE POLICY "ex_sel" ON expense_claims FOR SELECT USING (
    employee_id = auth.uid() OR approver_id = auth.uid() OR is_admin()
);
CREATE POLICY "ex_ins" ON expense_claims FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "ex_upd" ON expense_claims FOR UPDATE USING (
    employee_id = auth.uid() OR approver_id = auth.uid() OR is_admin()
);

CREATE POLICY "etl_sel" ON expense_travel_lines FOR SELECT USING (
    EXISTS (SELECT 1 FROM expense_claims c WHERE c.id = claim_id AND (c.employee_id = auth.uid() OR c.approver_id = auth.uid() OR is_admin()))
);
CREATE POLICY "etl_ins" ON expense_travel_lines FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM expense_claims c WHERE c.id = claim_id AND c.employee_id = auth.uid())
);

CREATE POLICY "eol_sel" ON expense_other_lines FOR SELECT USING (
    EXISTS (SELECT 1 FROM expense_claims c WHERE c.id = claim_id AND (c.employee_id = auth.uid() OR c.approver_id = auth.uid() OR is_admin()))
);
CREATE POLICY "eol_ins" ON expense_other_lines FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM expense_claims c WHERE c.id = claim_id AND c.employee_id = auth.uid())
);

-- ── MESSAGES ──
CREATE POLICY "msg_sel" ON messages FOR SELECT USING (true);
CREATE POLICY "msg_ins" ON messages FOR INSERT WITH CHECK (
    (channel = 'general') OR (channel = 'announcements' AND is_admin())
);

-- ── ADMIN NOTIFICATIONS ──
CREATE POLICY "an_sel" ON admin_notifications FOR SELECT USING (true);
CREATE POLICY "an_ins" ON admin_notifications FOR INSERT WITH CHECK (is_admin());

-- ── EMAIL LOG ──
CREATE POLICY "el_sel" ON email_log FOR SELECT USING (from_employee = auth.uid() OR to_employee = auth.uid() OR is_admin());
CREATE POLICY "el_ins" ON email_log FOR INSERT WITH CHECK (true);  -- edge function inserts

-- ── DOCUMENTS ──
CREATE POLICY "doc_sel" ON documents FOR SELECT USING (is_active = true);
CREATE POLICY "doc_ins" ON documents FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "doc_upd" ON documents FOR UPDATE USING (is_admin());

CREATE POLICY "da_sel" ON document_acknowledgements FOR SELECT USING (employee_id = auth.uid() OR is_admin());
CREATE POLICY "da_ins" ON document_acknowledgements FOR INSERT WITH CHECK (employee_id = auth.uid());

-- ── AUDIT LOG ──
CREATE POLICY "al_sel" ON audit_log FOR SELECT USING (is_admin() OR employee_id = auth.uid());
CREATE POLICY "al_ins" ON audit_log FOR INSERT WITH CHECK (employee_id = auth.uid());

-- ============================================================================
-- 15. SEED: ONBOARDING PHASES (with visibility)
-- ============================================================================
INSERT INTO onboarding_phases (id, name, icon, days_label, visibility, sort_order) VALUES
('pre',      'Pre-Arrival',       '📋', 'Before Day 1', 'admin',    1),
('day1',     'Day 1 — Welcome',   '🎉', 'Day 1',        'both',     2),
('it',       'IT Setup',          '💻', 'Day 1–2',      'both',     3),
('hr',       'HR Admin',          '📑', 'Day 2–3',      'admin',    4),
('training', 'Orientation',       '🎓', 'Week 1–2',     'employee', 5);

-- ============================================================================
-- 16. SEED: ONBOARDING TASKS (with visibility per task)
-- ============================================================================
INSERT INTO onboarding_tasks (id, phase_id, title, default_owner, priority, system, days_offset, visibility, sort_order) VALUES
-- Pre-Arrival (admin only)
('t1',  'pre',  'Send welcome letter & arrival info',          'hr',      'high',   NULL,        -3, 'admin', 1),
('t2',  'pre',  'Notify IT to prepare equipment',              'hr',      'high',   'zoho',      -3, 'admin', 2),
('t3',  'pre',  'Collect clothing size from new employee',     'joann',   'medium', NULL,        -2, 'admin', 3),
('t4',  'pre',  'Prepare laptop / workstation',                'siko',    'high',   NULL,        -1, 'admin', 4),
-- Day 1 (mixed visibility)
('t6',  'day1', 'Welcome & office tour',                       'ryan',    'high',   NULL,         0, 'both',  1),
('t7',  'day1', 'Sign employment contract & NDA',              'hr',      'high',   NULL,         0, 'both',  2),
('t9',  'day1', 'Issue Jera clothing (Week 1-2)',              'joann',   'medium', NULL,         7, 'admin', 3),
('t10', 'day1', 'Create Jera email address',                   'siko',    'high',   'microsoft',  0, 'admin', 4),
-- IT Setup (mixed — employee sees verification items, admin sees setup)
('t11', 'it',   'Configure laptop & install software',         'siko',    'high',   'microsoft',  1, 'admin',    1),
('t12', 'it',   'Assign Microsoft 365 licence',                'raymond', 'high',   'microsoft',  1, 'admin',    2),
('t13', 'it',   'Setup Outlook, Teams, SharePoint',            'raymond', 'high',   'microsoft',  1, 'admin',    3),
('t14', 'it',   'Activate MFA on all accounts',                'siko',    'high',   'microsoft',  1, 'admin',    4),
('t15', 'it',   'Assign Zoho One licence (Projects + Desk)',   'ryan',    'high',   'zoho',       1, 'admin',    5),
('t16', 'it',   'Create Memtime account',                      'raymond', 'medium', 'microsoft',  1, 'admin',    6),
('t17', 'it',   'Setup VPN access',                            'siko',    'medium', NULL,         1, 'admin',    7),
('t18', 'it',   'Setup email signature (template from Ryan)',  'siko',    'medium', 'microsoft',  2, 'admin',    8),
('t19', 'it',   'Setup Teams background (from Ryan)',          'siko',    'low',    'microsoft',  2, 'admin',    9),
-- IT verification (employee sees these)
('t30', 'it',   'Verify: Logged into Microsoft 365 (Outlook, Teams)',  NULL, 'high',  'microsoft', 1, 'employee', 10),
('t31', 'it',   'Verify: OneDrive syncing & accessible',              NULL, 'high',  'microsoft', 1, 'employee', 11),
('t32', 'it',   'Verify: Logged into Zoho Projects',                  NULL, 'high',  'zoho',      1, 'employee', 12),
('t33', 'it',   'Verify: Logged into Zoho Desk',                      NULL, 'high',  'zoho',      1, 'employee', 13),
('t34', 'it',   'Verify: Memtime installed & tracking',               NULL, 'medium','microsoft', 1, 'employee', 14),
('t35', 'it',   'Verify: VPN connected successfully',                 NULL, 'medium', NULL,       1, 'employee', 15),
-- HR Admin (admin/Ben only)
('t20', 'hr',   'Complete tax & banking detail forms',         'hr',      'high',   NULL,         2, 'admin', 1),
('t21', 'hr',   'Register on payroll system',                  'hr',      'high',   NULL,         2, 'admin', 2),
('t22', 'hr',   'Medical aid & pension registration',          'hr',      'medium', NULL,         3, 'admin', 3),
-- Orientation (employee)
('t24', 'training', '1-on-1 with manager: role & goals',       'ryan',    'high',   NULL,         3, 'employee', 1),
('t25', 'training', 'Complete Zoho Projects SOP walkthrough',  'ryan',    'high',   'zoho',       4, 'employee', 2),
('t26', 'training', 'Complete Zoho Desk SOP walkthrough',      'ryan',    'high',   'zoho',       4, 'employee', 3),
('t36', 'training', 'Complete Timekeeping SOP walkthrough',    'ryan',    'high',   NULL,         4, 'employee', 4),
('t37', 'training', 'Complete Client Access SOP',              'ryan',    'high',   NULL,         4, 'employee', 5),
('t38', 'training', 'Read & acknowledge all 20 HR policies',  'ryan',    'high',   NULL,         5, 'employee', 6),
('t27', 'training', 'Assign mentor for first 30 days',        'ryan',    'medium', NULL,         5, 'admin',    7),
('t28', 'training', 'Schedule weekly check-ins (Month 1)',     'hr',      'medium', 'zoho',       5, 'admin',    8);

-- ============================================================================
-- 17. SEED: SOPs (with client_access added)
-- ============================================================================
INSERT INTO sops (key, name, icon, total_steps) VALUES
('projects',      'Zoho Projects',     '📁', 7),
('desk',          'Zoho Desk',         '🎫', 8),
('timekeeping',   'Timekeeping',       '⏱️', 6),
('client_access', 'Client Access',     '🔑', 5);

-- Zoho Projects SOP
INSERT INTO sop_steps (sop_key, step_number, icon, title, description, detail, action_text, tip_text) VALUES
('projects', 1, '🔐', 'Log In to Zoho Projects', 'Access your Zoho Projects account using your Jera company email credentials.', 'Go to projects.zoho.com/portal/jeradotcodotza and sign in with your @jera.co.za email.', 'Open projects.zoho.com', 'Bookmark this URL — you''ll use it every day.'),
('projects', 2, '🗂️', 'Understand the Dashboard', 'The dashboard shows your assigned tasks, deadlines and project activity.', 'On the left sidebar: My Work, Projects, Timesheets and Reports. Start your day on ''My Work''.', 'Click ''My Work'' in the sidebar', 'Use the ''Due Today'' filter to focus.'),
('projects', 3, '📁', 'Select Your Project', 'Navigate to the project(s) you''ve been assigned to.', 'Click ''Projects'' → select your project. Inside: Tasks, Milestones, Files, Feed, Timesheets.', 'Click ''Projects'' → select your project', 'Ask your manager which projects are priority.'),
('projects', 4, '✅', 'Update Task Statuses', 'Keep your task statuses accurate — critical for project visibility.', 'Open a task → change status: Open → In Progress → Completed. Add comments.', 'Open a task → change status → add comment', 'Status updates replace status meetings.'),
('projects', 5, '⏱️', 'Log Time Daily', 'Time logging feeds directly into billing and payroll — non-negotiable.', 'Timesheets → Log Time. Select project/task, enter hours, add a note. Sync Memtime daily.', 'Timesheets → Log Time → enter hours', 'Log at end of each day. Never wait until Friday.'),
('projects', 6, '💬', 'Use the Project Feed', 'The Feed is your team communication channel inside each project.', 'Use @mentions. Post updates, flag blockers. Avoid email for project updates.', 'Open project → ''Feed'' → post update', 'Tag your manager on client-facing updates.'),
('projects', 7, '📤', 'Upload Files to SharePoint', 'All deliverables must be stored in SharePoint — not locally.', 'Upload to SharePoint first, then attach link to Zoho task.', 'Upload to SharePoint → paste link', 'Never store docs on local drive only.');

-- Zoho Desk SOP
INSERT INTO sop_steps (sop_key, step_number, icon, title, description, detail, action_text, tip_text) VALUES
('desk', 1, '🔐', 'Log In to Zoho Desk', 'Access Zoho Desk using your Jera credentials.', 'Go to desk.zoho.com and sign in. Same Zoho One credentials.', 'Open desk.zoho.com', 'Same login as Zoho Projects.'),
('desk', 2, '🎫', 'Understand the Ticket Dashboard', 'Dashboard shows open, pending and resolved tickets.', 'Left panel: My Tickets, All Tickets, Views, Reports. Start on ''My Tickets''.', 'Click ''My Tickets''', 'Red = urgent, address within 1 hour.'),
('desk', 3, '➕', 'Create a New Ticket', 'Always log client issues as tickets — never via email.', 'Click ''+ New Ticket''. Fill: Contact, Subject, Description, Department, Priority, Due Date.', '''+ New Ticket'' → fill fields → Submit', 'Good subject: ''Client — Issue Summary''.'),
('desk', 4, '🔄', 'Update Ticket Status', 'Keep statuses accurate for team visibility.', 'Statuses: Open → In Progress → On Hold → Resolved → Closed.', 'Open ticket → change status → comment', 'Waiting on client? Set ''On Hold''.'),
('desk', 5, '↩️', 'Reply to a Ticket', 'All client communication inside Zoho Desk.', 'Click ''Reply''. Use ''Internal Note'' for colleagues.', 'Open ticket → Reply → Send', 'Read full thread before replying.'),
('desk', 6, '🚨', 'Escalate Overdue Tickets', 'Escalate before SLA breach — don''t wait.', 'Three-dot menu → Escalate → Select your manager → Add note.', 'Escalate → Select manager → Add note', 'SLA breach = client trust breach.'),
('desk', 7, '📝', 'Use Internal Notes', 'Internal notes visible only to your team.', 'Click ''Internal Note'' (not Reply) for internal discussions.', '''Internal Note'' → type → Save', 'Never put opinions in Reply field.'),
('desk', 8, '✅', 'Close & Archive Tickets', 'Resolve properly — never delete tickets.', 'Set ''Resolved'', send closing message. Auto-closes after 7 days.', '''Resolved'' → closing message', 'Confirm resolution before closing.');

-- Timekeeping SOP
INSERT INTO sop_steps (sop_key, step_number, icon, title, description, detail, action_text, tip_text) VALUES
('timekeeping', 1, '📥', 'Install Memtime', 'Download and install Memtime on your work laptop.', 'Memtime auto-tracks which apps, documents, and websites you use. Records locally on your machine.', 'Download from memtime.com → install → sign in', 'Memtime runs silently — no need to start/stop.'),
('timekeeping', 2, '📊', 'Review Your Timeline', 'At end of each day, open Memtime and review what it captured.', 'Memtime shows a visual timeline colour-coded by application.', 'Open Memtime → review today''s timeline', 'Do this daily while it''s fresh.'),
('timekeeping', 3, '✍️', 'Create Time Entries', 'Drag on timeline to create entries and assign to Zoho Projects.', 'Select time block, assign to project and task, add description. Memtime syncs to Zoho.', 'Select block → assign project/task → sync', 'Be specific — ''Development work'' is too vague.'),
('timekeeping', 4, '🔄', 'Sync to Zoho Daily', 'Sync Memtime entries to Zoho Projects end of every day.', 'Click ''Sync'' in Memtime. Verify entries in Zoho Timesheets.', 'Memtime → Sync → verify in Zoho', 'Never leave sync until Friday.'),
('timekeeping', 5, '💵', 'Billable vs Non-Billable', 'Mark time correctly — billable time gets invoiced to clients.', 'Billable: client work, client meetings, travel. Non-billable: internal meetings, training, admin.', 'Tag each entry as billable or non-billable', 'When in doubt, ask your manager.'),
('timekeeping', 6, '📋', 'Timesheet Accompanies Expenses', 'A timesheet copy must be attached to any expense claim.', 'Per Jera policy, no expense claim processed without timesheet. Submit by the 25th.', 'Export timesheet → attach to expense claim', 'No timesheet = no reimbursement.');

-- Client Access SOP (new — connect with PM for logins)
INSERT INTO sop_steps (sop_key, step_number, icon, title, description, detail, action_text, tip_text) VALUES
('client_access', 1, '👤', 'Meet Your Project Manager', 'Schedule a handover session with your assigned Project Manager.', 'Your PM will walk you through your client assignments, project scope, and key contacts. This is your first real client-facing step.', 'Message your PM to schedule a 30-min handover', 'Bring a notebook — there will be a lot of names and URLs.'),
('client_access', 2, '🔐', 'Collect Client Login Credentials', 'Get all client system URLs, usernames, and access details from your PM.', 'Your PM will share client VPN details, Sage login URLs, remote desktop credentials, and any client-specific portals. Store these securely in your password manager.', 'Request credentials list from PM → store in password manager', 'Never store passwords in plain text or on sticky notes.'),
('client_access', 3, '🌐', 'Test All Client Connections', 'Log into every client system to verify access before your first task.', 'Test each URL, VPN connection, and login. If anything fails, report it immediately to your PM and IT (Siko). Don''t wait until you need it urgently.', 'Test each login → report any failures to PM + IT', 'Do this on day 1 of each new project assignment.'),
('client_access', 4, '📋', 'Review Client Project Documentation', 'Read the project charter, scope document, and any existing deliverables.', 'Your PM will point you to the SharePoint folder for each project. Read the charter, BRD/FDD, and any progress reports. Understand where the project is before you start contributing.', 'Open SharePoint → Projects folder → read key docs', 'Ask questions early — it''s better than assumptions later.'),
('client_access', 5, '✅', 'Confirm Ready Status', 'Let your PM know you have access, have read the docs, and are ready to start.', 'Send a message to your PM confirming: all logins work, documentation reviewed, and you understand your first deliverable. This closes the client access SOP.', 'Message PM: ''All access confirmed, ready to start''', 'Being proactive builds trust fast.');

-- ============================================================================
-- 18. SEED: HR POLICIES (all 20)
-- ============================================================================
INSERT INTO hr_policies (id, code, title, icon, summary, sort_order) VALUES
('HR001', 'JERA-POL-HR001', 'Code of Ethics',                          '⚖️',  'Principles and values guiding conduct of all Jera members — integrity, accountability, respect, excellence, and confidentiality.', 1),
('HR002', 'JERA-POL-HR002', 'Code of Conduct',                         '📏',  'Standards for professional behaviour — respectful communication, dress code, punctuality, client interactions, and company property use.', 2),
('HR003', 'JERA-POL-HR003', 'Remuneration Policy',                     '💰',  'Fair, competitive, and performance-linked compensation. Annual reviews in February. CTC structures and benefits.', 3),
('HR004', 'JERA-POL-HR004', 'Performance Management Policy',           '📊',  'Framework for assessing and developing employee performance. 30-60-90 day plans, quarterly reviews, annual BSC.', 4),
('HR005', 'JERA-POL-HR005', 'Leave Policy',                            '🏖️',  'Leave entitlements per BCEA: 21 consecutive days annual, sick leave cycles, maternity/paternity, family responsibility, study, and religious leave.', 5),
('HR006', 'JERA-POL-HR006', 'Recruitment and Selection Policy',        '🔍',  'Fair, transparent recruitment compliant with EEA, BCEA, POPIA, and the Children''s Act. Equal opportunity for all candidates.', 6),
('HR007', 'JERA-POL-HR007', 'IT Equipment Allowance Policy',           '💻',  'Provision of IT equipment, technology allowances, tax implications, security requirements, and maintenance responsibilities.', 7),
('HR008', 'JERA-POL-HR008', 'Travel and Subsistence Allowance Policy', '✈️',  'Business travel reimbursement: R1.50/km SARS rate, R522/day per diem, accommodation caps, approval process, and expense claims by the 25th.', 8),
('HR009', 'JERA-POL-HR009', 'Private Work After Hours Policy',         '🌙',  'Guidelines for freelancing and consulting outside work hours. Written approval required. Non-compete and IP protections.', 9),
('HR010', 'JERA-POL-HR010', 'Contractor Policy',                       '🤝',  'Guidelines for engaging, managing, and terminating contractors. Compliance with LRA, tax obligations, and IP protections.', 10),
('HR011', 'JERA-POL-HR011', 'Overtime Payment Policy',                 '⏰',  'Overtime framework per BCEA: 1.5x normal rate, max 3hrs/day, 10hrs/week. Pre-approval required. Sunday and public holiday rates.', 11),
('HR012', 'JERA-POL-HR012', 'Smoke-Free Workplace Policy',             '🚭',  'No smoking or vaping in any Jera premises. Compliant with Tobacco Products Control Act. Designated outdoor areas only.', 12),
('HR013', 'JERA-POL-HR013', 'Employment Equity Policy',                '🤲',  'Commitment to diversity and inclusion. Eliminating unfair discrimination. Representative workforce reflecting SA society.', 13),
('HR014', 'JERA-POL-HR014', 'Employee Relations Policy',               '🤝',  'Framework for discipline, grievances, and disputes. Fair, consistent, and transparent handling of workplace issues.', 14),
('HR015', 'JERA-POL-HR015', 'Occupational Health and Safety Policy',   '🦺',  'Safe working environment per the OHS Act 1993. Risk assessments, incident reporting, emergency procedures, and PPE requirements.', 15),
('HR016', 'JERA-POL-HR016', 'Disciplinary Code and Procedure',         '⚠️',  'Fair disciplinary procedure per LRA. Progressive discipline: verbal warning → written → final → dismissal. Right to fair hearing.', 16),
('HR017', 'JERA-POL-HR017', 'Grievance Policy and Procedure',          '📢',  'Structured mechanism for employees to raise concerns. Confidential, timely investigation and resolution. Escalation to CCMA if needed.', 17),
('HR018', 'JERA-POL-HR018', 'Termination of Employment',               '📋',  'Procedures for resignation, dismissal, retirement. Notice periods per BCEA. Exit interviews, final payments, and handover.', 18),
('HR019', 'JERA-POL-HR019', 'Retrenchment Policy',                     '📉',  'Section 189 LRA compliance. Fair selection criteria, consultation process, severance pay (1 week per completed year), and alternatives.', 19),
('HR020', 'JERA-POL-HR020', 'Workbook for Managing Incapacity',        '📖',  'Practical guide for managing poor performance, temporary ill-health, and permanent incapacity per Schedule 8 of the LRA.', 20);

-- ============================================================================
-- 19. ADMIN DASHBOARD VIEWS
-- ============================================================================

-- Onboarding summary per employee
CREATE OR REPLACE VIEW admin_onboarding_summary AS
SELECT
    e.id, e.display_name, e.email, e.status, e.start_date, e.department, e.job_title,
    (SELECT COUNT(*) FROM onboarding_form_completions f WHERE f.employee_id = e.id) AS forms_done,
    5 AS forms_total,
    (SELECT COUNT(*) FROM sop_completions s WHERE s.employee_id = e.id AND s.completed = true) AS sops_done,
    4 AS sops_total,
    (SELECT COUNT(*) FROM hr_policy_acknowledgements p WHERE p.employee_id = e.id AND p.acknowledged = true) AS policies_done,
    20 AS policies_total,
    e.policies_completed,
    (SELECT COUNT(*) FROM expense_claims x WHERE x.employee_id = e.id) AS expense_claims_total,
    (SELECT COUNT(*) FROM expense_claims x WHERE x.employee_id = e.id AND x.status = 'submitted') AS expense_claims_pending
FROM employees e
ORDER BY e.created_at DESC;

-- Expense claims awaiting approval (for approvers)
CREATE OR REPLACE VIEW pending_expense_approvals AS
SELECT
    ec.id AS claim_id,
    ec.claim_period,
    ec.grand_total,
    ec.submitted_at,
    e.display_name AS submitter_name,
    e.email AS submitter_email,
    a.display_name AS approver_name
FROM expense_claims ec
JOIN employees e ON e.id = ec.employee_id
LEFT JOIN employees a ON a.id = ec.approver_id
WHERE ec.status = 'submitted'
ORDER BY ec.submitted_at ASC;

-- Activity feed
CREATE OR REPLACE VIEW admin_activity_feed AS
SELECT
    a.id, a.employee_id, e.display_name, e.avatar_initials, e.avatar_color,
    a.action, a.detail, a.created_at
FROM audit_log a
JOIN employees e ON e.id = a.employee_id
ORDER BY a.created_at DESC
LIMIT 100;

-- ============================================================================
-- 20. SUPABASE EDGE FUNCTION STUBS (for email via Resend)
-- ============================================================================
-- Create these as Supabase Edge Functions:
--
-- 1. send-ping-email
--    Trigger: called from frontend when admin clicks "Ping"
--    Payload: { from_name, to_email, to_name, subject, body }
--    Action: sends email via Resend API, logs to email_log table
--
-- 2. send-notification-email
--    Trigger: called when admin broadcasts a notification
--    Payload: { subject, body, target_department }
--    Action: fetches all matching employees, sends bulk email via Resend
--
-- 3. send-expense-notification
--    Trigger: called when expense claim submitted or approved/declined
--    Payload: { claim_id, action }
--    Action: notifies approver (on submit) or submitter (on approval/decline)

-- ============================================================================
-- 21. STORAGE BUCKETS (create manually in Supabase dashboard)
-- ============================================================================
-- Bucket: 'documents'     → company docs (SOPs, policies, templates)
-- Bucket: 'receipts'      → expense claim receipt uploads
-- Bucket: 'contracts'     → signed employment contract PDFs

-- ============================================================================
-- DONE! 🎉
-- Next: Create auth accounts, insert employee records, upload policy PDFs
-- ============================================================================
