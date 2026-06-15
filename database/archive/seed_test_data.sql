-- ============================================================================
-- PULSE — Test Data for Development
-- Only run this in development/staging, not production
-- Requires auth users to be created first in Supabase Auth
-- Replace UUIDs with actual auth user IDs
-- ============================================================================

-- Sample employees (create auth users first, then insert here)
-- INSERT INTO employees (id, email, first_name, last_name, role, status, job_title, department, phone, avatar_color, expense_role) VALUES
-- ('UUID_SIKO',    'sikod@jera.co.za',     'Siko',    'D',         'employee', 'active',     'IT Support',          'IT',         '+27 11 913 3321', '#2b72b9', 'submitter'),
-- ('UUID_RAYMOND', 'raymond@jera.co.za',   'Raymond', 'M',         'employee', 'active',     'IT / Microsoft 365',  'IT',         '+27 11 913 3322', '#C4880C', 'submitter'),
-- ('UUID_JOANN',   'joann@jera.co.za',     'Jo-Ann',  'V',         'employee', 'active',     'Admin / Clothing',    'Admin',      '+27 11 913 3323', '#db4fb2', 'submitter'),
-- ('UUID_BEN',     'ben@jera.co.za',       'Ben',     'Oosthuizen','employee', 'active',     'HR & Compliance',     'HR',         '+27 11 913 3324', '#2D8A56', 'approver'),
-- ('UUID_SARAH',   'sarah@jera.co.za',     'Sarah',   'van der Berg','employee','onboarding','Junior Developer',    'Development',NULL,               '#911431', 'submitter');

-- Sample messages
-- INSERT INTO messages (channel, message_type, author_id, body) VALUES
-- ('announcements', 'announcement', 'UUID_RYAN', '🏓 Paddle on Friday @ Boksburg Paddle Club! 3pm start. Everyone welcome.'),
-- ('announcements', 'announcement', 'UUID_BEN',  '📋 Monthly timesheets due by 25 March. Please submit via Zoho Projects.'),
-- ('general',       'chat',         'UUID_SIKO',  'Anyone else having issues with the VPN this morning?'),
-- ('general',       'chat',         'UUID_RAYMOND','Working fine on my end. Try disconnecting and reconnecting.');

-- Sample expense claim
-- INSERT INTO expense_claims (employee_id, claim_period, status, total_travel, total_other, grand_total, approver_id) VALUES
-- ('UUID_SARAH', '2026-03', 'submitted', 450.00, 120.00, 570.00, 'UUID_RYAN');

-- Sample audit log entries
-- INSERT INTO audit_log (employee_id, action, detail) VALUES
-- ('UUID_SARAH', 'form_completed', '{"form": "personal", "form_title": "Personal Information"}'),
-- ('UUID_SARAH', 'sop_completed',  '{"sop": "projects", "sop_title": "Zoho Projects"}'),
-- ('UUID_SARAH', 'policy_acknowledged', '{"policy": "HR001", "title": "Code of Ethics"}');
