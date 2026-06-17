> ⚠️ **SUPERSEDED — DO NOT USE FOR THE BACKEND BUILD (tombstoned by Fable P0, 2026-06-17).**
> This guide pre-dates the locked decisions and shipped code. It is **stale and a re-poison risk**: it references Resend (now **Microsoft 365 Graph**), "20 HR policies as uploaded files" (now **24, seeded as metadata** — see `database/migrations/003_seed.sql`), the archived `pulse_v5_schema.sql` (now `database/migrations/001/002/003`), and has no M365 SSO setup.
> **Authoritative sources:** `docs/plans/2026-06-15-002-feat-pulse-backend-phase-plan.md` (deploy/runbook), `docs/prototype/HANDOFF.md` (stack), `database/README.md` (schema/RLS). Kept only for historical reference.

# PULSE — Launch Guide
### From Zero to Live at pulse.jera.co.za

**For:** Ryan de Kock, Jera Consulting  
**Date:** April 2026  
**Target:** Solo testing → Pilot → Full rollout

---

## What You're Deploying

| Component | Technology | Where |
|-----------|-----------|-------|
| **Database** | Supabase (PostgreSQL + Auth + Storage) | Supabase Cloud (free tier is fine to start) |
| **Frontend** | Next.js (React) | Jera Linux server at pulse.jera.co.za |
| **Email** | Resend (for pings & notifications) | Resend Cloud (free tier: 100 emails/day) |
| **DNS** | A record for pulse.jera.co.za | Your DNS provider (probably where jera.co.za is managed) |

---

## Phase 1: Supabase Setup (30 minutes)

### Step 1.1 — Create Supabase Account & Project

1. Go to **https://supabase.com** → Sign up (use your ryan@jera.co.za Google/GitHub account)
2. Click **New Project**
3. Fill in:
   - **Organisation:** Jera Consulting
   - **Project name:** pulse-jera
   - **Database password:** generate a strong one and **save it in your password manager**
   - **Region:** Choose **West Europe (London)** — closest to SA with good latency
4. Click **Create new project** — wait ~2 minutes for provisioning

### Step 1.2 — Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `pulse_v5_schema.sql` (the file I gave you)
4. Paste the **entire** contents into the editor
5. Click **Run** (bottom right)
6. You should see "Success. No rows returned" — that means all tables, indexes, RLS policies, and seed data were created
7. Verify: go to **Table Editor** in the sidebar — you should see all the tables listed

### Step 1.3 — Create Your Admin Account

1. Go to **Authentication** → **Users** → **Add User**
2. Fill in:
   - Email: `ryan@jera.co.za`
   - Password: your choice (you'll change this later)
   - Check: **Auto Confirm User**
3. Click **Create User**
4. **Copy the UUID** from the user list (it looks like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
5. Go back to **SQL Editor** → New Query → run:

```sql
INSERT INTO employees (id, email, first_name, last_name, role, status, job_title, department, phone, avatar_color, start_date, two_factor_enabled, expense_role)
VALUES (
    'PASTE_YOUR_UUID_HERE',
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
    'both'
);
```

### Step 1.4 — Grab Your API Keys

1. Go to **Settings** → **API** (in Supabase dashboard)
2. Copy these two values — you'll need them for the frontend:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (the long one)
3. Save both somewhere safe — these go into your `.env` file

### Step 1.5 — Create Storage Buckets

1. Go to **Storage** (left sidebar)
2. Create three buckets:
   - `documents` — toggle **Public** ON (employees need to read these)
   - `receipts` — leave **Public** OFF (private expense receipts)
   - `contracts` — leave **Public** OFF (signed employment contracts)

### Step 1.6 — Upload the 20 HR Policy Documents

1. Go to **Storage** → `documents` bucket
2. Create a folder called `hr-policies`
3. Upload all 20 policy files (JERA_POL-HR_001 through HR_020)
4. Then go to **SQL Editor** and update the `document_url` for each policy:

```sql
-- Example for HR001 (repeat for each):
UPDATE hr_policies 
SET document_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/documents/hr-policies/JERA_POL-_HR_001-_Code_of_Ethics_-_2026.docx'
WHERE id = 'HR001';
```

---

## Phase 2: Resend Setup for Emails (10 minutes)

### Step 2.1 — Create Resend Account

1. Go to **https://resend.com** → Sign up
2. Verify your email

### Step 2.2 — Add Your Domain

1. In Resend dashboard → **Domains** → **Add Domain**
2. Enter: `jera.co.za`
3. Resend will give you **3 DNS records** to add (SPF, DKIM, DMARC-like)
4. Add these to your DNS provider (wherever jera.co.za is hosted — probably your domain registrar or Cloudflare)
5. Wait for verification (usually 5–30 minutes)
6. Once verified, emails from `pulse@jera.co.za` or `noreply@jera.co.za` will work

### Step 2.3 — Get Your API Key

1. In Resend → **API Keys** → **Create API Key**
2. Name it: `pulse-production`
3. Copy the key — save it for your `.env` file

---

## Phase 3: Frontend Setup (45 minutes)

### Step 3.1 — Server Prerequisites

SSH into your Jera Linux server and ensure these are installed:

```bash
# Check Node.js (need v18+)
node --version

# If not installed or too old:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify npm
npm --version

# Install PM2 (keeps the app running after you disconnect)
sudo npm install -g pm2

# Install Nginx (reverse proxy to handle HTTPS)
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### Step 3.2 — Create the Next.js Project

```bash
# Navigate to your web apps directory
cd /var/www

# Create the PULSE app
npx create-next-app@latest pulse --typescript --tailwind --eslint --app --use-npm
cd pulse

# Install Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Install Resend for email
npm install resend
```

### Step 3.3 — Configure Environment Variables

```bash
# Create .env.local
nano .env.local
```

Paste:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key...

# Resend (server-side only — no NEXT_PUBLIC_ prefix)
RESEND_API_KEY=re_xxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=https://pulse.jera.co.za
```

### Step 3.4 — Set Up Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 3.5 — Build and Test Locally

```bash
# Build
npm run build

# Test locally
npm run start
# Visit http://YOUR_SERVER_IP:3000 to verify it loads
```

### Step 3.6 — Set Up PM2 (Keep App Running)

```bash
# Start with PM2
pm2 start npm --name "pulse" -- start

# Set PM2 to auto-start on server reboot
pm2 startup
pm2 save
```

---

## Phase 4: DNS & HTTPS (15 minutes)

### Step 4.1 — Point pulse.jera.co.za to Your Server

In your DNS provider:

1. Add an **A record**:
   - Name: `pulse`
   - Value: `YOUR_SERVER_IP_ADDRESS`
   - TTL: 300 (5 min for testing, increase later)

Wait for propagation (usually 5–15 min). Test with:

```bash
ping pulse.jera.co.za
```

### Step 4.2 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/pulse
```

Paste:

```nginx
server {
    listen 80;
    server_name pulse.jera.co.za;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/pulse /etc/nginx/sites-enabled/
sudo nginx -t          # test config
sudo systemctl restart nginx
```

### Step 4.3 — Add HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d pulse.jera.co.za
```

Follow the prompts. Certbot will:
- Get a free SSL certificate
- Auto-configure Nginx for HTTPS
- Set up auto-renewal

Test: visit **https://pulse.jera.co.za** — you should see the Next.js default page with a padlock.

---

## Phase 5: Your Testing Checklist

Once the frontend is wired up (we'll build the pages together), test these flows:

### Authentication
- [ ] Sign in as ryan@jera.co.za
- [ ] 2FA code entry (TOTP via authenticator app)
- [ ] Forgot password flow
- [ ] Sign out and sign back in

### Admin Functions
- [ ] See admin nav section in sidebar
- [ ] View all employees table
- [ ] Create a test employee account
- [ ] Ping an employee (verify email arrives via Resend)
- [ ] Send a company notification
- [ ] View onboarding summary (forms, SOPs, policies per employee)
- [ ] Reset an employee's password

### Employee Onboarding (log in as test employee)
- [ ] See only employee-visible workflow tasks (Orientation, IT verification)
- [ ] Complete all 5 onboarding forms
- [ ] Walk through all 20 HR policies with "I have read and understood" checkboxes
- [ ] Verify you cannot skip policies — must complete all 20 to proceed
- [ ] Complete all 4 SOPs (Zoho Projects, Zoho Desk, Timekeeping, Client Access)
- [ ] Upload signed employment contract PDF

### Expenses
- [ ] Submit an expense claim with travel lines (R1.50/km) and other expenses
- [ ] Verify client name is required on every line
- [ ] As approver: see pending claims, approve/decline

### Chat
- [ ] Post an announcement (admin only)
- [ ] Post in general chat
- [ ] Verify employees can't post announcements

---

## Phase 6: What I Build Next

Now that infrastructure is sorted, here's the order I'd build the actual frontend pages:

| Priority | Page | Why |
|----------|------|-----|
| 1 | Login + 2FA + Password Reset | Can't do anything without auth |
| 2 | Supabase client wiring | Connect frontend to database |
| 3 | Sidebar + routing | Navigation shell |
| 4 | Dashboard (role-based) | First thing users see |
| 5 | HR Policy walkthroughs (20 policies with gate) | Mandatory for onboarding |
| 6 | SOP walkthroughs (4 SOPs) | Core onboarding content |
| 7 | Onboarding forms (5 forms) | Employee data collection |
| 8 | Workflow (role-based views) | Task management |
| 9 | Expense claims + approver flow | Finance |
| 10 | Chat & Announcements | Comms |
| 11 | Admin portal | Employee management |
| 12 | Document library | Reference materials |
| 13 | Email integration (Resend) | Pings & notifications |

---

## Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Supabase | Free tier (500MB DB, 1GB storage, 50K auth users) | R0 |
| Resend | Free tier (100 emails/day, 3000/month) | R0 |
| Let's Encrypt SSL | Free | R0 |
| Jera Linux server | Already have it | R0 |
| **Total to launch** | | **R0** |

When you outgrow free tiers:
- Supabase Pro: ~$25/month (~R450)
- Resend Pro: ~$20/month (~R360)

---

## Quick Reference

| Item | Value |
|------|-------|
| App URL | https://pulse.jera.co.za |
| Supabase Dashboard | https://supabase.com/dashboard |
| Resend Dashboard | https://resend.com/overview |
| Database schema file | `pulse_v5_schema.sql` |
| Admin login | ryan@jera.co.za |
| Tech stack | Next.js + Supabase + Resend + Nginx + PM2 |

---

**Ready to start?** Begin with Phase 1 — create your Supabase project. Once you've done that and have your API keys, we'll start building the actual Next.js pages together.
