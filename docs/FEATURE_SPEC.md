# PULSE — Feature Specification

## Authentication

### Login (app/auth/login/page.tsx)
- Email + password form
- Validates @jera.co.za domain
- On success → redirect to 2FA screen
- "Forgot password?" link → forgot password flow
- Uses Supabase Auth `signInWithPassword()`

### 2FA (app/auth/twofactor/page.tsx)
- 6-digit TOTP code input (Google/Microsoft Authenticator)
- Auto-advance between input fields
- Paste support for full 6-digit code
- On success → redirect to dashboard
- Uses Supabase Auth MFA: `auth.mfa.verify()`
- "Back to login" link

### Forgot Password (app/auth/forgot/page.tsx)
- Step 1: Enter email → sends reset link via Supabase Auth
- Step 2: User clicks link in email → enters new password
- Uses Supabase Auth `resetPasswordForEmail()`

### Logout
- Button in sidebar bottom
- Calls `supabase.auth.signOut()`
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
  📖 Policies [badge: X/20]
─── People ───
  ◉ Directory
─── Finance ───
  💰 Expenses
─── Resources ───
  📂 Documents
─── Comms ───
  💬 Chat [badge: unread count]
─── Admin (if role=admin) ───
  👥 All Employees
  ➕ New Employee
  🔑 Passwords
  📣 Notify All
─── Bottom ───
  [User avatar + name + role]
  [Sign Out button]
```

### Role-Based Visibility
- Admin section only visible when `employee.role === 'admin'`
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
- Calls API route `/api/email` which uses Resend to send email
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
- Uploads to Supabase Storage `contracts` bucket
- Creates record in `contract_uploads` table
- Admin can view uploaded contracts

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
4. **Policies** — redirects to Policies page (must complete all 20)
5. **30-60-90 Day Goals** — 3 goals per period (30/60/90 days), colour-coded cards

### Progress Tracking
- Progress bar showing X of 5 forms completed
- Badge in sidebar shows remaining
- Each form saved to respective DB table + entry in `onboarding_form_completions`

---

## Policies (app/policies/page.tsx) — CRITICAL GATE

### 20 HR Policies with mandatory walkthrough
- List view showing all 20 policies with status (not started / in progress / completed)
- Overall progress bar (X/20 acknowledged)
- Click a policy → expands to show summary + key content
- Each policy has: "I have read and understood this policy" checkbox
- Checkbox saves to `hr_policy_acknowledgements` with timestamp
- **GATE: Employee cannot navigate to other onboarding sections until ALL 20 are acknowledged**
- When all 20 complete → `employees.policies_completed` set to `true`
- Audit trail: `read_started_at` (when opened) and `acknowledged_at` (when ticked)

### Policy Data
All 20 policies seeded in `hr_policies` table with summaries. Full documents in Supabase Storage.

---

## Expenses (app/expenses/page.tsx)

### Expense Claim Form
- Claimant details: name (auto-filled), claim period (month picker)
- **Travel Claims** section:
  - Columns: Client Name (REQUIRED), Date, Rate (R1.50/km SARS 2026), KMs, Amount (auto-calc)
  - Add Row button
- **Other Expenses** section:
  - Columns: Client Name (REQUIRED), Date, Description, Amount
  - Receipt upload (Supabase Storage `receipts` bucket)
  - Add Row button
- Grand Total (auto-calculated)
- Submit button → status changes to `submitted`, notification sent to approver

### Approver View
- Approvers see "Pending Approvals" tab
- Shows claims submitted to them
- Can expand to see line items
- Approve / Decline buttons with optional notes
- On approve/decline → notification email sent to submitter

### Policy Warning Banner
- Red banner at top: "A copy of your timesheet must accompany this claim. Claims due by the 25th."

---

## Chat & Announcements (app/chat/page.tsx)

### Two Tabs
1. **Announcements** — admin-only posting, red left border on messages, "ANNOUNCEMENT" tag
2. **General Chat** — open to everyone

### Features
- Message list with avatar, name, timestamp, body
- Compose bar at bottom (input + send button, Enter to send)
- Real-time updates via Supabase Realtime subscriptions
- Admin check: only admins can type in announcements tab

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
- Click → opens/downloads from Supabase Storage
- Tracks view in `document_acknowledgements`

---

## Admin Portal

### All Employees (app/admin/employees/page.tsx)
- Table: avatar, name, email, role, department, status, phone, actions
- "Notify" button per employee (sends ping email)
- Links to view employee's onboarding progress

### New Employee (app/admin/onboard/page.tsx)
- Form: name, role, email, department, start date, manager
- Creates Supabase Auth user + employees record + onboarding workflow + leave balances
- Fires notifications to HR and IT

### Password Management (app/admin/passwords/page.tsx)
- Table: employee, 2FA status, actions
- "Reset Password" → Supabase Auth admin API
- "Enable/Disable 2FA" toggle

### Notify All (app/admin/notify/page.tsx)
- Compose form: type (info/urgent/celebration/reminder), subject, message, target (all/department)
- Send → creates `admin_notifications` record + sends bulk email via Resend
- Sent history below

---

## API Routes

### POST /api/email (app/api/email/route.ts)
Handles all outbound email via Resend:
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
| hr_policies | 20 policies (seeded) |
| hr_policy_acknowledgements | Per-employee per-policy ack |
| sops | 4 SOPs (seeded) |
| sop_steps | All SOP steps (seeded) |
| sop_completions | Per-employee SOP progress |
| expense_claims | Claim headers |
| expense_travel_lines | Travel line items |
| expense_other_lines | Other expense lines |
| messages | Chat messages |
| admin_notifications | Broadcast notifications |
| email_log | All emails sent via Resend |
| documents | Document library |
| document_acknowledgements | Who viewed what |
| audit_log | All trackable actions |
