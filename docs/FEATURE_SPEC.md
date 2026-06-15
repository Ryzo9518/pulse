# PULSE — Feature Specification

## Authentication

Auth is **Microsoft 365 SSO**. Staff sign in with their Jera Microsoft 365 account; the M365 identity is mapped to one of the three roles (Employee, Manager, Admin), and that role drives Supabase Row Level Security. There is no separate PULSE password or PULSE-managed 2FA — sign-in, MFA, and password resets are all handled by Microsoft 365.

> **Current phase:** the app runs on mock data with a dev role-switch standing in for SSO. M365 SSO and the role→RLS mapping are wired in the upcoming backend phase.

### Login (app/auth/login/page.tsx)
- "Sign in with Microsoft 365" — redirects to the Microsoft identity provider
- Restricted to the Jera Microsoft 365 tenant
- On success → role resolved from the M365 identity → redirect to dashboard

### Logout
- Button in sidebar bottom
- Signs the user out of the PULSE session
- Redirects to login

---

## Sidebar Navigation (components/layout/Sidebar.tsx)

### Structure
```
PULSE logo + tagline
─── Main ───
  ◎ Dashboard
  ▦ Workflow [badge: pending task count]
  ◈ SOPs
  📝 My Forms [badge: incomplete count]
  📖 Policies [badge: X/24]
─── Learning ───
  🎓 Training
  🏅 Certifications
─── People ───
  ◉ Directory
─── Finance ───
  💰 Expenses
─── Resources ───
  📂 Documents
─── Help ───
  💬 Ask HR (Pulse Assistant)
─── Team (if role=manager or admin) ───
  👥 My Team / All Employees
  ➕ New Employee
─── Admin (if role=admin) ───
  📣 Notify All
─── Bottom ───
  [User avatar + name + role]
  [Sign Out button]
```

### Role-Based Visibility
- Three roles: **Employee**, **Manager**, **Admin**.
- Team section visible when `role === 'manager'` or `role === 'admin'`. Managers see their own team (work fields only — no payroll/POPIA/contract); admins see the full roster.
- Admin-only items (Notify All, document upload/delete, policy versioning, uploading certificates for others) visible only when `role === 'admin'`.
- Nav highlight follows current route
- Sub-form views (form-personal, form-emergency, etc.) highlight "My Forms"

---

## Dashboard (app/dashboard/page.tsx)

### Employee View
- Welcome header with name, role, department, start date
- 4 stat cards: Total tasks, Completed, In Progress, Pending
- Progress bar with percentage
- Quick action cards: Workflow, SOPs, My Forms, Policies
- Team assignments with per-person progress bars and Ping button

### Admin View (same page, conditional sections)
- All of employee view PLUS:
- "Pending Approvals" section (expense claims awaiting approval)
- "Onboarding Summary" section (from `admin_onboarding_summary` view)
- Activity feed (from `admin_activity_feed` view)

### Ping Button
- Calls the email API route which sends via Microsoft 365 / Outlook (Graph API)
- Email sent FROM the logged-in user's email TO the pinged employee's email
- Subject: "PULSE Reminder from [sender name]"
- Body: "[sender name] has sent you a reminder to review your pending tasks."
- Logged in `email_log` table

---

## Workflow (app/workflow/page.tsx)

### Employee View
Shows ONLY tasks where `visibility = 'employee'` or `'both'`:
- Day 1 — Welcome (both): Welcome & office tour, Sign employment contract
- IT Setup (employee): 6 verification tasks (logged into M365, OneDrive syncing, etc.)
- Orientation (employee): SOPs, policy review, mentor, check-ins

### Admin View
Shows ALL tasks, organised by responsible person:
- Pre-Arrival (admin): welcome letter, IT notification, clothing size, laptop prep
- Day 1 (admin tasks): clothing (week 1-2), email creation
- IT Setup (admin): configure laptop, licences, MFA, VPN, email sig, Teams bg
- HR Admin (admin): tax forms, payroll, medical aid

### Task Interactions
- Click "Start" → status changes to `inprogress`
- Click "✓ Done" → status changes to `done`, logs to `audit_log`
- "→ Zoho" / "→ M365" button opens integration modal
- 🔔 button sends ping email to task owner

### Contract Upload
- Task "Sign employment contract & NDA" has a file upload area
- Accepts PDF only
- Uploads to SharePoint / OneDrive (Microsoft 365); the SharePoint item reference is stored against the record
- Creates record in `contract_uploads` table
- Admin can view uploaded contracts (this is an admin-only task — hidden from managers)

---

## SOPs (app/sop/page.tsx)

### 4 SOPs with walkthrough UI
1. **Zoho Projects** (7 steps) — key: `projects`
2. **Zoho Desk** (8 steps) — key: `desk`
3. **Timekeeping / Memtime** (6 steps) — key: `timekeeping`
4. **Client Access** (5 steps) — key: `client_access`

### UI Pattern
- Tab bar at top to switch between SOPs
- Step navigation (numbered buttons, colour-coded: past=green, current=red, future=grey)
- Card with: dark header (icon, step X of Y, title, description) + body (detail, action hint, tip)
- Previous / Next buttons
- Final step: "✓ Complete SOP" button
- On completion: record in `sop_completions`, entry in `audit_log`

### Data Source
- Steps loaded from `sop_steps` table (seeded in schema)
- Progress tracked in `sop_completions` table

---

## My Forms (app/forms/page.tsx)

### 5 Onboarding Forms
1. **Personal Information** — first/last name, SA ID, DOB, gender, nationality, language, address (with SA province dropdown), cell, email
2. **Emergency Contacts** — 2 contacts (name, relationship, address, phones, employer) + medical info (doctor, medical aid, allergies) + consent checkbox
3. **Tax & Banking** — SARS tax ref, tax status, SA bank dropdown, account details + consent checkbox
4. **Policies** — redirects to Policies page (must complete all 24)
5. **30-60-90 Day Goals** — 3 goals per period (30/60/90 days), colour-coded cards

### Progress Tracking
- Progress bar showing X of 5 forms completed
- Badge in sidebar shows remaining
- Each form saved to respective DB table + entry in `onboarding_form_completions`

---

## Policies (app/policies/page.tsx) — CRITICAL GATE

### 24 HR Policies with mandatory walkthrough
- List view showing all 24 policies with status (not started / in progress / completed)
- Overall progress bar (X/24 acknowledged)
- Click a policy → expands to show summary + key content
- Each policy has: "I have read and understood this policy" checkbox
- Checkbox saves to `hr_policy_acknowledgements` with timestamp
- **GATE: Employee cannot navigate to other onboarding sections until ALL 24 are acknowledged**
- When all 24 complete → `employees.policies_completed` set to `true`
- Audit trail: `read_started_at` (when opened) and `acknowledged_at` (when ticked)
- Admin can publish a new policy version, which **resets all acknowledgements** (everyone must re-acknowledge)

### Policy Data
All 24 policies seeded in `hr_policies` table with summaries. Policy source files live in SharePoint / OneDrive (Microsoft 365); the Word body is converted to HTML/rich text for in-app reading, with the original downloadable as PDF.

---

## Training (app/training/page.tsx)

### Per-product learning paths
- Multi-product Sage U learning paths (Intacct, X3, 300 People, Payroll Advanced, …) with nested groups and typed modules
- Progress tracking per module; ILT (instructor-led training) date entry feeds billable readiness
- **4-stage billable ladder:** Pre-supervised → Supervised-billable → ILT complete → Certified
  - Supervised-billable ≈ start date + 7 days (foundations + shadowing done)
  - ILT complete = the consultant-entered instructor-led training date
  - Certified ≈ ILT date + 10 days (after the certification exam)
- Managers and admins can view their team's training status

---

## Certifications (app/certifications/page.tsx)

### Certificate tracking + tender packs
- Upload **product** certs and **NQF qualification** certs, each with an expiry date
- Certificate files stored in SharePoint / OneDrive (Microsoft 365)
- Expiry status: within 60 days → "expiring" (amber), past → "expired" (red); drives recertification alerts
- Organisation → product cascading filters for building **tender packs** (download-all / select certificates for a tender)
- **Employees and managers can upload their OWN certificates; only admins upload/edit certificates for other people.**
- Managers and admins can view their team's certifications + run the tender export

---

## Expenses (app/expenses/page.tsx)

### Expense Claim Form
- Claimant details: name (auto-filled), claim period (month picker)
- **Expenses incurred** section: Client Name (REQUIRED), Date, Description, Amount; receipt slip upload per line (stored in SharePoint / OneDrive)
- **Travel (AA rate)** section:
  - Reimbursed at the consultant's **AA Vehicle Rates Certificate** rate. The AA Rate Certificate upload sets per-person rates.
  - **Full AA rate** for travel **invoiced** to a client; **fixed-cost** rate for **non-invoiced** travel.
  - Travel not invoiced to a client may not be claimed.
- **Advances** — deducted from the total
- **Grand total payable** = expenses incurred + travel − advances (auto-calculated)
- A copy of the **timesheet must accompany every claim** (attachment required)
- Submit button → status changes to `submitted`, notification sent to approver (via M365 Graph). Submit by the 25th.

### Approver View
- Approvers see "Pending Approvals" tab
- Shows claims submitted to them
- Can expand to see line items
- Approve / Decline buttons with optional notes
- On approve/decline → notification email sent to submitter

### Policy Warning Banner
- Red banner at top: "A copy of your timesheet must accompany this claim. Claims due by the 25th."

---

## Ask HR — Pulse Assistant (app/chat/page.tsx)

This is **not** a team chat. Day-to-day team messaging happens in **Microsoft Teams**, and company-wide announcements go out via **Notify All** (admin). The in-app "chat" route is the **Ask HR Pulse Assistant** — an AI helper grounded on the HR/payroll policy corpus and leave/expense rules.

### Features
- Conversational Q&A grounded on the 24 HR policies + payroll/leave/expense rules
- Never invents figures; defers to HR for binding answers
- **Deferred — built last.** The prototype uses a demo LLM helper; production needs a real model endpoint with retrieval over the policy corpus.

---

## People Directory (app/people/page.tsx)

### Grid of employee cards
- Avatar (colour + initials), name, role, status dot (active/onboarding), department, email
- Includes the onboarding employee

---

## Document Library (app/documents/page.tsx)

### Categorised document browser
Categories: Contracts & Policies, Timesheets & Invoicing, Job Descriptions, SOPs & Procedures, Employee Forms, HR Policies

### Per Document
- File type badge (DOCX, PDF, XLSX, TXT)
- Title, description
- Click → opens/downloads from SharePoint / OneDrive (Microsoft 365)
- Tracks view in `document_acknowledgements`

### Admin document management
- Admins can **upload** files or add SharePoint links (multiple) and **delete** documents
- Employees and managers have read-only access to the library

---

## Admin Portal

### All Employees / My Team (app/admin/employees/page.tsx)
- Admin: full roster. Manager: their own team (work fields only — no POPIA/personal data).
- Table: avatar, name, email, role, department, status, phone, actions
- "Notify" button per employee (sends ping email via M365 Graph)
- Links to view employee's onboarding progress

### New Employee / Schedule onboarding (app/admin/onboard/page.tsx)
- Form: name, role, department, product, start date, email, buddy
- Generates the standard onboarding (30 tasks across 5 phases) + adds to roster, onboarding, and training
- Available to managers and admins — but a manager scheduling a hire cannot see the contract/NDA or payroll/POPIA tasks
- Sign-in itself is via Microsoft 365 SSO; PULSE does not create or manage passwords

### Notify All (app/admin/notify/page.tsx) — admin only
- Compose form: type (info/urgent/celebration/reminder), subject, message, target audience (with live counts), live preview
- Send → creates `admin_notifications` record + sends in-app + bulk email via Microsoft 365 / Outlook (Graph API)
- Sent history below

---

## API Routes

### POST /api/email (app/api/email/route.ts)
Handles all outbound email via Microsoft 365 / Outlook (Graph API):
```typescript
// Request body
{
  type: 'ping' | 'notification' | 'expense_approval' | 'expense_submitted',
  to_email: string,
  to_name: string,
  subject: string,
  body: string,
  from_employee_id: string
}
```

---

## Database Tables Quick Reference

| Table | Records |
|-------|---------|
| employees | All Jera staff |
| employee_personal_info | Form 1 data |
| emergency_contacts | Form 2 contacts (2 per employee) |
| employee_medical_info | Form 2 medical |
| employee_tax_banking | Form 3 data |
| onboarding_phases | 5 phases (seeded) |
| onboarding_tasks | ~30 tasks (seeded, with visibility) |
| onboarding_workflows | 1 per employee |
| onboarding_task_status | Task progress per employee |
| onboarding_form_completions | Which forms are done |
| employee_goals | 30-60-90 goals |
| contract_uploads | Signed contract PDFs |
| hr_policies | 24 policies (seeded) |
| hr_policy_acknowledgements | Per-employee per-policy ack |
| sops | 4 SOPs (seeded) |
| sop_steps | All SOP steps (seeded) |
| sop_completions | Per-employee SOP progress |
| expense_claims | Claim headers |
| expense_travel_lines | Travel line items |
| expense_other_lines | Other expense lines |
| messages | Chat messages |
| admin_notifications | Broadcast notifications |
| email_log | All emails sent via Microsoft 365 / Outlook (Graph API) |
| documents | Document library |
| document_acknowledgements | Who viewed what |
| audit_log | All trackable actions |
