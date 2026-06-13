-- ============================================================================
-- PULSE — Seed Admin User
-- Run this AFTER creating Ryan's account in Supabase Auth
-- Replace the UUID below with Ryan's actual auth.users.id
-- ============================================================================

INSERT INTO employees (
    id, email, first_name, last_name, role, status,
    job_title, department, phone, avatar_color,
    start_date, two_factor_enabled, expense_role,
    policies_completed, onboarding_completed
) VALUES (
    'REPLACE_WITH_RYANS_AUTH_UUID',   -- ← paste UUID here
    'ryan@jera.co.za',
    'Ryan',
    'de Kock',
    'admin',
    'active',
    'Business Development Director',
    'Operations',
    '+27 11 913 3320',
    '#911431',
    '2020-01-01',
    true,
    'both',
    true,
    true
);

-- Create leave balance for 2026
-- (Uncomment when leave feature is re-enabled)
-- INSERT INTO leave_balances (employee_id, year) VALUES ('REPLACE_WITH_RYANS_AUTH_UUID', 2026);
