import { defineConfig, devices } from '@playwright/test'

export const APP_URL = new URL('http://localhost:5091')
export default defineConfig({
  expect: { timeout: 10_000 },
  globalSetup: './mock-setup.ts',
  projects: [
    { grep: /@desktop/, name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { grep: /@mobile/, name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
    { grep: /@desktop/, name: 'chromium-tablet', use: { ...devices['iPad Pro'] } }
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: process.env['CI'] ? 3 : 1,
  testDir: '.',
  testMatch: ['journeys/mock/**/*.journey.ts', 'specs/**/*.spec.ts'],
  timeout: 60_000,
  use: {
    actionTimeout: 15_000,
    baseURL: APP_URL.origin,
    navigationTimeout: 30_000,
    screenshot: 'on'
  },
  workers: 1
})
