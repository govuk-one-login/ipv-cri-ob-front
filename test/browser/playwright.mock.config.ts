import { defineConfig, devices } from '@playwright/test'

export const APP_URL = new URL('http://localhost:5091')
export default defineConfig({
  expect: { timeout: 5_000 },
  globalSetup: './mock-setup.ts',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: process.env['CI'] ? 2 : 0,
  testDir: '.',
  testMatch: ['specs/**/*.spec.ts', 'journeys/mock/**/*.journey.ts'],
  timeout: 30_000,
  use: {
    actionTimeout: 10_000,
    baseURL: APP_URL.origin,
    navigationTimeout: 15_000,
    screenshot: 'on'
  },
  workers: 1
})
