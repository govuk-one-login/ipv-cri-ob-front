import { defineConfig, devices } from '@playwright/test'

const BROWSER = process.env['BROWSER'] ?? 'chromium'

const projects = {
  all: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } }
  ],
  chromium: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  edge: [{ name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } }],
  firefox: [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }]
} satisfies Record<string, { name: string; use: object }[]>

if (!(BROWSER in projects)) {
  throw new Error(
    `Unknown BROWSER "${BROWSER}". Valid options: ${Object.keys(projects).join(', ')}`
  )
}

export default defineConfig({
  expect: { timeout: 5_000 },
  projects: projects[BROWSER as keyof typeof projects],
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: 1,
  testDir: '.',
  testMatch: ['specs/**/*.spec.ts'],
  timeout: 30_000,
  use: {
    actionTimeout: 10_000,
    baseURL: 'http://localhost:5090',
    navigationTimeout: 15_000,
    screenshot: 'only-on-failure'
  },
  workers: 1
})
