import { defineConfig, devices } from '@playwright/test'

export const APP_URL = new URL('http://localhost:5091')

// Mobile-focused configuration
export default defineConfig({
  expect: { timeout: 15_000 },
  globalSetup: './mock-setup.ts',
  projects: [
    {
      name: 'iphone-13',
      use: {
        ...devices['iPhone 13'],
        launchOptions: {
          slowMo: 100
        }
      }
    }
  ],
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: 'playwright-report-mobile'
      }
    ],
    ['junit', { outputFile: 'test-results/mobile-results.xml' }]
  ],
  retries: process.env['CI'] ? 2 : 0,
  testDir: '.',
  testMatch: ['specs/mobile-responsiveness.spec.ts'],
  timeout: 90_000, // Longer timeout for mobile
  use: {
    actionTimeout: 20_000, // Slower interactions on mobile
    baseURL: APP_URL.origin,
    navigationTimeout: 45_000, // Network may be slower
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',

    // Mobile-specific settings
    bypassCSP: false // Ensure CSP works on mobile
  },
  workers: 2 // Can run more workers for mobile-only tests
})
