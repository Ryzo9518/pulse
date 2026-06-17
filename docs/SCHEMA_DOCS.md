> ⚠️ **SUPERSEDED — DO NOT USE (tombstoned by Fable P0, 2026-06-17).**
> Describes the obsolete `pulse_v5_schema.sql` (2 roles, 20 policies, 3 SOPs, no certifications/training/aa-rate tables). The **canonical schema is now `database/migrations/001_schema.sql` + `002_rls.sql` + `003_seed.sql`** (33 tables, three roles + owner, 24 policies, RLS-enforced). See `database/README.md`. Kept only for historical reference.

# PULSE Database Schema Documentation

**Platform:** Supabase (PostgreSQL)
**Version:** 1.0.0
**Date:** April 2026
**Author:** Built collaboratively with Claude for Jera Consulting (Pty) Ltd

---

## How to Deploy

1. Open your Supabase project dashboard
2. Go to **SQL Editor → New Query**
3. Paste the entire contents of `pulse_supabase_schema.sql`
4. Click **Run** — this creates all tables, indexes, RLS policies, triggers, and seed data in one go
5. Create Ryan's auth account (Microsoft 365 SSO is the production sign-in; map the M365 identity to the `admin` role)
6. Copy Ryan's UUID from the auth user list
7. Uncomment the seed INSERT in section 18 of the SQL file, replace the UUID, and run it

> **File storage:** PULSE stores files (documents, receipt slips, certificate PDFs, AA Rate Certificates, policy source files) in **SharePoint / OneDrive (Microsoft 365)**, not Supabase Storage buckets. Tables hold the SharePoint item references, not bucket paths.

---

## Table Overview

| # | Table | Purpose | RLS |
|---|-------|---------|-----|
| 1 | `employees` | Core employee directory — extends Supabase auth.users | All read, admin write |
| 2 | `employee_personal_info` | SA ID, address, contact details (Form 1) | Own + admin |
| 3 | `emergency_contacts` | Primary + secondary emergency contacts (Form 2) | Own + admin |
| 4 | `employee_medical_info` | Doctor, medical aid, allergies (Form 2) | Own + admin |
| 5 | `employee_tax_banking` | SARS tax ref, bank details for payroll (Form 3) | Own + admin |
| 6 | `onboarding_workflows` | One workflow instance per new employee | Own + admin |
| 7 | `onboarding_phases` | Template: 5 phases (Pre-Arrival → Orientation) | All read |
| 8 | `onboarding_tasks` | Template: 28 tasks across phases | All read |
| 9 | `onboarding_task_status` | Per-employee task progress (pending/inprogress/done) | Own + admin |
| 10 | `onboarding_form_completions` | Tracks which of the 5 forms an employee has completed | Own + admin |
| 11 | `employee_goals` | 30-60-90 day goals (Form 5) | Own + admin |
| 12 | `sops` | Template: 3 SOPs (Projects, Desk, Timekeeping) | All read |
| 13 | `sop_steps` | Template: all SOP steps with content | All read |
| 14 | `sop_completions` | Per-employee SOP progress + completion status | Own + admin |
| 15 | `leave_balances` | Per-employee per-year leave allocation (BCEA compliant) | Own + admin |
| 16 | `leave_requests` | Leave applications with approval workflow | Own + admin |
| 17 | `expense_claims` | Expense claim headers with status tracking | Own + admin |
| 18 | `expense_travel_lines` | Travel claim line items (km rate, distance, amount) | Via parent claim |
| 19 | `expense_other_lines` | Other expense line items with receipt URLs | Via parent claim |
| 20 | `messages` | Ask HR Pulse Assistant conversation history (AI helper, not team chat — Teams handles messaging) | Own + admin |
| 21 | `meeting_requests` | Meeting requests between employees | Requester + recipient + admin |
| 22 | `admin_notifications` | Broadcast notifications from admin | All read, admin write |
| 23 | `documents` | Document library files (contracts, SOPs, templates) | All read active, admin manage |
| 24 | `document_acknowledgements` | Tracks who has viewed/acknowledged a document | Own + admin |
| 25 | `policy_acknowledgements` | Tracks who has acknowledged each of the 24 HR policies | Own + admin |
| 26 | `audit_log` | All important actions for admin dashboard | Admin read only |
| 27 | `training_paths` / `training_modules` / `training_progress` | Per-product Sage U learning paths, typed modules, and per-consultant progress + ILT date (drives the 4-stage billable ladder) | Own read; manager/admin team read |
| 28 | `certifications` | Product + NQF qualification certs with expiry; feeds recertification alerts + tender packs | Own + manager/admin team read; own upload, admin uploads for others |
| 29 | `aa_rate_certificates` | Per-person AA Vehicle Rates Certificate setting travel reimbursement rates | Own + admin |

---

## Detailed Table Descriptions

### employees
The core table. Every Supabase auth user gets a row here. Has auto-generated `display_name` and `avatar_initials` columns. The `role` field controls admin access — only `admin` role users can access admin views and manage other employees. The `manager_id` field creates a self-referencing hierarchy.

### employee_personal_info / emergency_contacts / employee_medical_info / employee_tax_banking
These four tables store the onboarding form data. Each is 1:1 with an employee (except emergency_contacts which allows 2 per employee via `contact_order`). All contain sensitive PII and are locked down to own-record + admin access via RLS.

**SA-specific fields:** SA ID number, province dropdown, SA bank options (ABSA, Capitec, FNB, Nedbank, Standard Bank, etc.), SARS tax reference, medical aid provider.

### onboarding_workflows / onboarding_task_status
The workflow is created by admin when onboarding a new employee. Task status records track each of the 28 tasks per employee. The `assigned_to` field can differ from the template's `default_owner` if needed.

### onboarding_phases / onboarding_tasks
Template tables seeded on deployment. These define the 5-phase, 28-task onboarding structure. Read-only for all users. Admin manages these via direct SQL if the process changes.

### sops / sop_steps / sop_completions
Three SOPs seeded: Zoho Projects (7 steps), Zoho Desk (8 steps), Timekeeping/Memtime (6 steps). `sop_completions` tracks each employee's progress through each SOP — `current_step` and `completed` flag. **This is what admin sees to know if an employee has reviewed SOPs.**

### leave_balances / leave_requests
Balances are created per employee per year with BCEA defaults (15 annual, 15 sick per 36-month cycle, 3 family responsibility). Leave requests flow through an approval workflow: employee submits → admin approves/declines. **Admin dashboard shows pending leave requests.**

### expense_claims / expense_travel_lines / expense_other_lines
Multi-table structure matching Jera's actual expense claim form. Claims have a status workflow (draft → submitted → approved → declined → paid). Travel is reimbursed at the consultant's **AA Vehicle Rates Certificate** rate — **full AA rate** for travel invoiced to a client, **fixed-cost** rate for non-invoiced travel (non-invoiced travel may not be claimed). The grand total payable = expenses incurred + travel − advances. Receipt slips and a timesheet copy are attached per claim (stored in SharePoint / OneDrive). Per-person AA rates come from the uploaded AA Rate Certificate. **Managers and admins see submitted claims awaiting approval.**

### messages
Stores the **Ask HR Pulse Assistant** conversation history (the in-app AI helper grounded on the policy corpus). This is **not** a team chat — team messaging lives in Microsoft Teams, and company-wide announcements use `admin_notifications` / Notify All. Each user sees their own conversation; admins can see all.

### meeting_requests
Employee-initiated meeting requests. Both the requester and recipient can see them. Admin sees all. Status workflow: pending → confirmed/declined/cancelled.

### documents / document_acknowledgements
The document library. Files are stored in **SharePoint / OneDrive (Microsoft 365)**; this table holds the metadata and SharePoint item reference. Categories match the frontend: contracts & policies, timesheets & invoicing, job descriptions, SOPs & procedures, employee forms. Acknowledgements track who has opened/reviewed each document. Only admins upload or delete documents; everyone else has read access.

### audit_log
The central tracking table for the admin dashboard. Every important action logs here with a JSONB `detail` field for flexible payloads. Actions include:
- `sop_completed` — employee finished an SOP
- `leave_submitted` — employee submitted a leave request
- `expense_submitted` — employee submitted an expense claim
- `form_completed` — employee completed an onboarding form
- `policy_acknowledged` — employee reviewed a company policy
- `document_viewed` — employee opened a document
- `login` — employee logged in

---

## Row Level Security (RLS) Summary

Every table has RLS enabled. There are **three roles** — Employee, Manager, Admin — resolved from the Microsoft 365 SSO identity. The pattern is:

| Who | Can See | Can Write |
|-----|---------|-----------|
| **Employee** | Own records only | Own records (insert/update where applicable); can upload own certificates |
| **Manager** | Own records + their team's **work-related** data (onboarding work tasks, training, certifications) | Approve expense claims, schedule onboarding for their team |
| **Admin** | All records | All records + exclusive actions (manage employees, approve claims, broadcast notifications, version policies, upload/delete documents, upload certificates for others) |

**Manager rule of thumb:** work-related team oversight only — **never** payroll, **never** POPIA/personal data (tax, banking, medical), **never** the employment contract/NDA. A manager can start an onboarding and track its work tasks, but the HR-admin phase and the contract task are hidden from them. Enforce in RLS, not just the UI.

Helper functions (e.g. `is_admin()` / `is_manager_of()`) check the current user's role and team from the `employees` table. These are used in almost every RLS policy.

**Key restrictions:**
- Employees cannot see other employees' personal info, tax details, or medical records
- Managers cannot see their team's payroll/POPIA data or the contract/NDA task
- Only admins can post announcements (Notify All)
- Managers and admins can approve/decline expense claims; only admins approve leave
- Only admins can read the audit log
- Only admins can upload/delete documents and version policies
- Employees and managers can read the people directory (name, role, department, status only)
- Template tables (phases, tasks, SOPs, SOP steps) are readable by everyone

---

## Admin Dashboard Views

Two pre-built SQL views for the admin dashboard:

### admin_onboarding_summary
One row per employee with counts of: forms completed, SOPs completed, leave requests (total + pending), expense claims (total + pending), policies acknowledged. Perfect for an at-a-glance admin overview.

### admin_activity_feed
Last 100 actions from the audit log, joined with employee names and avatars. Shows real-time activity: who completed what, when.

---

## File Storage (SharePoint / OneDrive — Microsoft 365)

PULSE does **not** use Supabase Storage buckets. All files are stored in SharePoint / OneDrive via the Microsoft Graph API; the relevant table holds the SharePoint item reference.

| Content | Where the reference lives | Access |
|---------|---------------------------|--------|
| Company documents (contracts, SOPs, templates, job descriptions) | `documents` | Read for authenticated users; admin uploads/deletes |
| Expense receipt slips + timesheet copies | `expense_*` lines / claim | Own + approver (manager/admin) |
| Certificate PDFs (product + NQF) and AA Rate Certificates | `certifications` / `aa_rate_certificates` | Own upload; admin uploads for others |
| Policy source files (Word → HTML in-app, PDF download) | `hr_policies` / policy versions | Read for authenticated users; admin versions |

---

## Next Steps After Schema Deployment

1. **Set up Microsoft 365 SSO** and map M365 identities to the three roles (Employee/Manager/Admin)
2. **Insert employee records** in the `employees` table linked to their M365 identities
3. **Create leave balances** for 2026 for each employee
4. **Upload documents** to SharePoint / OneDrive and create records (with the SharePoint item reference) in the `documents` table
5. **Wire PULSE frontend** to Supabase JS client (`@supabase/supabase-js`)
6. **Wire Microsoft 365 / Outlook (Graph API)** for transactional and notification email (task-assigned, announcements, certification-expiry reminders, etc.)
