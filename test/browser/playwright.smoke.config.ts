import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  expect: { timeout: 5_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list']],
  retries: 2,
  testDir: '.',
  testMatch: ['journeys/smoke/**/*.journey.ts'],
  timeout: 30_000,
  use: {
    actionTimeout: 10_000,
    baseURL: process.env['APP_URL']!,
    navigationTimeout: 30_000,
    screenshot: 'off'
  },
  workers: 1
})
