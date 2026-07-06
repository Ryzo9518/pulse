# Pulse go-live verification (Playwright)

A single headed Playwright run that signs in once with Microsoft, then inspects
the whole live app (https://pulse.jera.co.za) through **six testing "brains"**:

- 🎨 **Frontend dev** — every page loads, no errors/console spam, branded, responsive
- 🔧 **Backend dev** — data is LIVE (real Jera names, not demo/"Sarah"); API calls succeed
- 🖥️ **System engineer** — HTTPS, the data API rejects anonymous callers, no secrets leak into the page
- 👔 **HR manager** — roster, onboarding oversight, notify surfaces load
- 📋 **HR clerk** — the onboard form validates (submits empty → rejected, so **nothing is created**)
- 🙋 **Employee** — policies, forms, and SOPs render and are readable

**It is read-only and safe:** it navigates and reads. It does **not** create
employees or save/overwrite anyone's form data.

## Run it (in Claude Cowork or any machine with Chrome)

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test          # Chrome opens headed
```

When the Chrome window opens it lands on the Pulse login. **Complete the
Microsoft sign-in** (your `@jera.co.za` account) — the script waits up to 3
minutes. After that it drives everything automatically and prints a pass/fail
line per check.

See the full report (screenshots/video/trace on any failure):

```bash
npx playwright show-report
```

## Notes

- You sign in as **yourself (admin/owner)**, so you see the admin experience.
  A few employee/manager-only bits (the policy *acknowledge* checkboxes, "My
  team") can't be fully exercised as admin — to cover those, run again signed in
  as an employee or manager account.
- Soft assertions: one failing check does **not** stop the run, so you get a
  single report of everything worth looking at.
- Target is hard-coded to `https://pulse.jera.co.za` in `playwright.config.ts`.
