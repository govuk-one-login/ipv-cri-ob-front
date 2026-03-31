import { APP_PORT } from './test/browser/config'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  expect: { timeout: 5_000 },
  globalSetup: 'test/browser/global-setup.ts',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: process.env['CI'] ? 2 : 0,
  testDir: 'test/browser',
  testMatch: ['**/specs/**/*.spec.ts', '**/journeys/**/*.journey.ts'],
  timeout: 30_000,
  use: {
    actionTimeout: 10_000,
    baseURL: `http://localhost:${APP_PORT}`,
    navigationTimeout: 15_000,
    screenshot: 'on'
  },
  workers: 1
})
