# PULSE

PULSE is Jera's HR and onboarding portal frontend.

## Run it (zero config)

No accounts, keys, or setup files are needed to run the app.

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## What phase this is

This is the **frontend-first, mock-data phase**. Everything you see on screen
is driven by built-in sample data. There is **no Supabase, no Microsoft 365,
and no environment variables required** to run it. The real backend — Supabase
(Postgres + RLS), Microsoft 365 SSO + Outlook/Graph email, and SharePoint /
OneDrive file storage — gets wired in during a later phase.

- The mock data lives in `lib/mock/`, behind a single accessor "seam"
  (`lib/mock/index.ts`). Screens only read through that seam, so the future
  backend can be swapped in without changing the screens.
- The mock state is held **in memory**. Anything you change in the app (ticking
  off a task, acknowledging a policy, posting a message) **resets on a full page
  reload**. That is by design for this phase — it is not a bug.

## Trying things out

- **`/showcase`** — a component gallery showing the building blocks (buttons,
  cards, badges, etc.) in one place.
- **The 🔧 dev role-switch** — a small developer control that lets you flip
  between the **employee** view and the **admin** view, so you can see both
  sides of the portal without separate logins.

## Running the tests

```bash
npm run test
```

This runs the automated checks over the mock data and accessor layer.

## Handy scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development mode on port 3000 |
| `npm run build` | Build the production bundle |
| `npm run start` | Run the production build on port 3000 |
| `npm run lint` | Check code style |
| `npm run type-check` | Check TypeScript types |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests and re-run on changes |
