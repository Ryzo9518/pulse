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
5. Create Ryan's auth account in **Authentication → Users → Add User** (`ryan@jera.co.za`)
6. Copy Ryan's UUID from the auth user list
7. Uncomment the seed INSERT in section 18 of the SQL file, replace the UUID, and run it
8. Create Storage buckets: `documents` and `receipts` in **Storage → New Bucket**

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
| 20 | `messages` | Chat & announcements (two channels) | All read, announcements admin-only write |
| 21 | `meeting_requests` | Meeting requests between employees | Requester + recipient + admin |
| 22 | `admin_notifications` | Broadcast notifications from admin | All read, admin write |
| 23 | `documents` | Document library files (contracts, SOPs, templates) | All read active, admin manage |
| 24 | `document_acknowledgements` | Tracks who has viewed/acknowledged a document | Own + admin |
| 25 | `policy_acknowledgements` | Tracks who has acknowledged company policies | Own + admin |
| 26 | `audit_log` | All important actions for admin dashboard | Admin read only |

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
Three-table structure matching Jera's actual expense claim form. Claims have a status workflow (draft → submitted → approved → declined → paid). Travel lines include the SARS km rate (R4.64/km default). **Admin sees submitted claims awaiting approval.**

### messages
Two channels: `announcements` (admin-only posting) and `general` (open chat). RLS ensures only admins can post announcements.

### meeting_requests
Employee-initiated meeting requests. Both the requester and recipient can see them. Admin sees all. Status workflow: pending → confirmed/declined/cancelled.

### documents / document_acknowledgements
The document library. Files stored in Supabase Storage, metadata in this table. Categories match the frontend: contracts & policies, timesheets & invoicing, job descriptions, SOPs & procedures, employee forms. Acknowledgements track who has opened/reviewed each document.

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

Every table has RLS enabled. The pattern is:

| Who | Can See | Can Write |
|-----|---------|-----------|
| **Employee** | Own records only | Own records (insert/update where applicable) |
| **Admin** | All records | All records + exclusive actions (create employees, approve leave, broadcast notifications) |

A helper function `is_admin()` checks the current user's role from the `employees` table. This is used in almost every RLS policy.

**Key restrictions:**
- Employees cannot see other employees' personal info, tax details, or medical records
- Only admins can post announcements
- Only admins can approve/decline leave and expense claims
- Only admins can read the audit log
- Employees can read the people directory (name, role, department, status only)
- Template tables (phases, tasks, SOPs, SOP steps) are readable by everyone

---

## Admin Dashboard Views

Two pre-built SQL views for the admin dashboard:

### admin_onboarding_summary
One row per employee with counts of: forms completed, SOPs completed, leave requests (total + pending), expense claims (total + pending), policies acknowledged. Perfect for an at-a-glance admin overview.

### admin_activity_feed
Last 100 actions from the audit log, joined with employee names and avatars. Shows real-time activity: who completed what, when.

---

## Storage Buckets (create manually in Supabase)

| Bucket | Purpose | Access |
|--------|---------|--------|
| `documents` | Company documents (contracts, SOPs, templates, job descriptions) | Public read for authenticated users |
| `receipts` | Expense claim receipt uploads | Private — own + admin |

---

## Next Steps After Schema Deployment

1. **Create employee accounts** in Supabase Auth for each team member
2. **Insert employee records** in the `employees` table with their auth UUIDs
3. **Create leave balances** for 2026 for each employee
4. **Upload documents** to the `documents` Storage bucket and create records in the `documents` table
5. **Wire PULSE frontend** to Supabase JS client (`@supabase/supabase-js`)
6. **Set up Resend** for transactional emails (password reset, leave approved, etc.)
