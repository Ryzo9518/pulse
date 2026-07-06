import { defineConfig } from '@playwright/test'

// Pulse go-live verification — run headed so you can complete the Microsoft
// sign-in when the browser opens. See README.md.
export default defineConfig({
  testDir: '.',
  // Generous: the first step waits for you to sign in with Microsoft.
  timeout: 5 * 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://pulse.jera.co.za',
    headless: false,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
})
