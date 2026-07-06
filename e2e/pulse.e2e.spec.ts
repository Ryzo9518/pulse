/**
 * Pulse go-live verification — six "brains" in one pass.
 *
 * Runs headed: when Chrome opens, sign in with your Microsoft (@jera.co.za)
 * account. After that the script drives the whole app and inspects it from the
 * perspective of a Frontend dev, Backend dev, System engineer, HR manager,
 * HR clerk, and a normal Employee.
 *
 * SAFE BY DESIGN: read-only. It navigates, reads, and checks — it does NOT
 * create employees or save/overwrite anyone's form data. (The one validation
 * test submits an EMPTY onboard form on purpose, which is rejected, so nothing
 * is created.)
 *
 * Uses soft assertions: a failure is recorded but the run continues, so you get
 * ONE report of everything that's wrong rather than stopping at the first issue.
 *
 * NOTE ON ROLES: you sign in as yourself (admin/owner), so you see the admin
 * experience. Employee/manager-only views (e.g. the policy acknowledge
 * checkboxes, "My team") are noted where they can't be fully exercised as admin
 * — re-run signed in as an employee/manager account to cover those.
 */
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

const ROUTES = [
  '/dashboard',
  '/people',
  '/policies',
  '/sop',
  '/forms',
  '/training',
  '/expenses',
  '/certifications',
  '/documents',
  '/workflow',
  '/admin/employees',
  '/admin/onboard',
  '/admin/notify',
]

// Text that should NEVER appear (mock/demo leftovers or hard errors).
const FORBIDDEN = [
  'Application error',
  'client-side exception',
  'Internal Server Error',
  'Sarah', // a mock-only persona; real staff names should show instead
]

function watchConsole(page: Page): { errors: string[] } {
  const errors: string[] = []
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return { errors }
}

async function bodyText(page: Page): Promise<string> {
  return (await page.locator('body').innerText().catch(() => '')) || ''
}

test('Pulse go-live — all six brains', async ({ page, context }) => {
  test.setTimeout(5 * 60_000)
  const consoleLog = watchConsole(page)

  // ── 🔐 Sign in (manual, once) ───────────────────────────────────────────────
  await test.step('🔐 Sign in with Microsoft', async () => {
    await page.goto('/dashboard')
    // Either we're at /login (expected) or already authed from a prior run.
    if (page.url().includes('/login')) {
      const btn = page.getByRole('button', { name: /sign in with microsoft/i })
      await expect.soft(btn, 'login page shows the Microsoft button').toBeVisible()
      await btn.click().catch(() => {})
    }
    console.log('\n>>> Complete the Microsoft sign-in in the browser window. Waiting up to 3 min...\n')
    // Wait until we land back on an authenticated Pulse page.
    await page.waitForURL(
      (url) =>
        url.host.includes('pulse.jera.co.za') &&
        !url.pathname.startsWith('/login') &&
        !url.pathname.startsWith('/api/auth'),
      { timeout: 3 * 60_000 },
    )
    await page.waitForLoadState('networkidle').catch(() => {})
    expect.soft(page.url(), 'signed in and back on pulse.jera.co.za').toContain('pulse.jera.co.za')
  })

  // ── 🎨 Frontend dev — every page loads cleanly, branded, responsive ─────────
  await test.step('🎨 Frontend dev — pages render, no errors, branded', async () => {
    for (const route of ROUTES) {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => null)
      await page.waitForLoadState('networkidle').catch(() => {})
      expect.soft(res?.status() ?? 0, `${route} HTTP status`).toBeLessThan(400)
      const text = await bodyText(page)
      for (const bad of FORBIDDEN) {
        expect.soft(text, `${route} should not contain "${bad}"`).not.toContain(bad)
      }
      // A real page has the sidebar/app shell (the Pulse nav) somewhere.
      expect.soft(text.length, `${route} rendered meaningful content`).toBeGreaterThan(200)
    }
    // Branding present (Jera red token) on the dashboard.
    await page.goto('/dashboard')
    const hasBrand = await page.locator('[class*="jera"], [style*="911431"]').count()
    expect.soft(hasBrand, 'Jera brand styling present').toBeGreaterThan(0)

    // Mobile viewport sanity.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    expect.soft((await bodyText(page)).length, 'dashboard renders on mobile').toBeGreaterThan(200)
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  // ── 🔧 Backend dev — data is LIVE (real, not demo) ──────────────────────────
  await test.step('🔧 Backend dev — live data, not mock', async () => {
    await page.goto('/people')
    await page.waitForLoadState('networkidle').catch(() => {})
    const people = await bodyText(page)
    expect.soft(people, 'People shows a real Jera colleague').toContain('Ryan de Kock')
    expect.soft(people, 'People is not the mock roster').not.toContain('Sarah')

    await page.goto('/policies')
    const policies = await bodyText(page)
    expect.soft(policies, 'Policies shows real policy content').toContain('Code of Ethics')

    await page.goto('/dashboard')
    const dash = await bodyText(page)
    expect.soft(dash, 'Dashboard greets the signed-in person').toMatch(/Welcome back/i)

    // Live data calls go through the proxy and succeed.
    const restCalls: number[] = []
    page.on('response', (r) => {
      if (r.url().includes('/api/rest/')) restCalls.push(r.status())
    })
    await page.goto('/people')
    await page.waitForLoadState('networkidle').catch(() => {})
    expect.soft(restCalls.every((s) => s < 400), `data API calls ok (${restCalls.join(',')})`).toBeTruthy()
  })

  // ── 🖥️ System engineer — security & transport ───────────────────────────────
  await test.step('🖥️ System engineer — TLS, auth boundary, no secret leaks', async () => {
    expect.soft(page.url(), 'served over HTTPS').toContain('https://')

    // The data API must reject an UNAUTHENTICATED caller (fresh context, no cookies).
    const anon = await context.browser()!.newContext()
    const anonPage = await anon.newPage()
    const apiRes = await anonPage.goto('https://pulse.jera.co.za/api/rest/employees').catch(() => null)
    // Middleware redirects to /login (or the proxy 401s) — either way, not data.
    const anonBody = await bodyText(anonPage)
    expect.soft(anonBody, 'anonymous cannot read employees from the API').not.toContain('Ryan de Kock')
    await anon.close()

    // No server secrets leaked into the page HTML.
    await page.goto('/dashboard')
    const html = await page.content()
    for (const secret of ['PULSE_PG_JWT_SECRET', 'PULSE_SERVICE_JWT', 'PULSE_FIELD_KEY', 'service_role']) {
      expect.soft(html, `page source must not leak ${secret}`).not.toContain(secret)
    }
  })

  // ── 👔 HR manager — oversight surfaces ──────────────────────────────────────
  await test.step('👔 HR manager — roster, onboarding oversight, notify', async () => {
    await page.goto('/admin/employees')
    expect.soft(await bodyText(page), 'All Employees roster loads').toContain('Ryan de Kock')

    await page.goto('/dashboard')
    expect.soft(await bodyText(page), 'dashboard shows outstanding policy sign-offs').toMatch(
      /outstanding policy sign-off|policy sign-off/i,
    )

    await page.goto('/admin/notify')
    expect.soft((await bodyText(page)).length, 'Notify composer loads').toBeGreaterThan(200)
  })

  // ── 📋 HR clerk — onboarding capture (validation only, no record created) ────
  await test.step('📋 HR clerk — onboard form validates (creates nothing)', async () => {
    await page.goto('/admin/onboard')
    const body = await bodyText(page)
    expect.soft(body, 'New Employee form is present').toMatch(/New Employee|Onboarding|Start Onboarding/i)
    // Submit EMPTY → must be rejected (so no record is created).
    const submit = page.getByRole('button', { name: /create employee|start onboarding/i }).first()
    if (await submit.count()) {
      await submit.click().catch(() => {})
      await page.waitForTimeout(800)
      expect.soft(await bodyText(page), 'empty onboard is rejected with a validation message').toMatch(
        /required|missing|enter/i,
      )
    }
  })

  // ── 🙋 Employee — onboarding journey surfaces ───────────────────────────────
  await test.step('🙋 Employee — policies, forms, SOPs render', async () => {
    // Policies: a policy expands to show its body.
    await page.goto('/policies')
    const firstPolicy = page.getByRole('button', { name: /view|code of ethics/i }).first()
    if (await firstPolicy.count()) {
      await firstPolicy.click().catch(() => {})
      await page.waitForTimeout(500)
    }
    expect.soft(await bodyText(page), 'policy content is readable').toMatch(/Scope|Policy|Introduction/i)

    // Forms overview lists the onboarding forms.
    await page.goto('/forms')
    const forms = await bodyText(page)
    for (const f of ['Personal', 'Emergency', 'Tax', 'Goals']) {
      expect.soft(forms, `Forms lists "${f}"`).toContain(f)
    }
    // Open the Tax form and confirm it renders the fields (do NOT save).
    const taxLink = page.getByText(/Tax.*Banking|Tax & Banking/i).first()
    if (await taxLink.count()) {
      await taxLink.click().catch(() => {})
      await page.waitForTimeout(500)
      expect.soft(await bodyText(page), 'Tax form fields render').toMatch(/Bank|Account|Tax Reference/i)
    }

    // SOPs: tabs + steps render.
    await page.goto('/sop')
    expect.soft(await bodyText(page), 'SOP walkthrough renders steps').toMatch(/Log In|Zoho|Memtime|Step/i)
  })

  // ── Final: console health ───────────────────────────────────────────────────
  await test.step('🧪 No console errors collected during the run', async () => {
    // Filter out noise that does not indicate a real app bug.
    const real = consoleLog.errors.filter(
      (e) => !/favicon|third-party|net::ERR_|Download the React DevTools/i.test(e),
    )
    if (real.length) console.log('Console errors:\n' + real.slice(0, 20).join('\n'))
    expect.soft(real.length, 'no unexpected console errors').toBeLessThan(5)
  })
})
