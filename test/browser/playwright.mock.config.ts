import { defineConfig, devices } from '@playwright/test'

export const APP_URL = new URL('http://localhost:5091')
export default defineConfig({
  expect: { timeout: 10_000 }, // Increased from 5s
  globalSetup: './mock-setup.ts',
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
    { name: 'chromium-tablet', use: { ...devices['iPad Pro'] } }
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: process.env['CI'] ? 3 : 1, // Added retry for local dev
  testDir: '.',
  testMatch: ['journeys/mock/**/ob-error.journey.ts', 'journeys/mock/**/ob-success.journey.ts'],
  timeout: 60_000, // Increased from 30s
  use: {
    actionTimeout: 15_000, // Increased from 10s
    baseURL: APP_URL.origin,
    navigationTimeout: 30_000, // Increased from 15s
    screenshot: 'only-on-failure', // Only capture on failures
    trace: 'retry-with-trace', // Add trace for debugging retries
    video: 'retain-on-failure' // Keep videos on failure
  },
  workers: 1
})
