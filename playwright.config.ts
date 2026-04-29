import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

export const APP_URL = new URL('http://localhost:5091')

const mockDir = defineBddConfig({
  features: 'test/browser/features/**/*.feature',
  outputDir: 'test/browser/.features-gen/mock',
  steps: ['test/browser/step-definitions/**/*.steps.ts', 'test/browser/fixtures.ts'],
  tags: 'not @smoke'
})

const smokeDir = defineBddConfig({
  features: 'test/browser/features/**/*.feature',
  outputDir: 'test/browser/.features-gen/smoke',
  steps: ['test/browser/step-definitions/**/*.steps.ts', 'test/browser/fixtures.ts'],
  tags: '@smoke'
})

export default defineConfig({
  expect: { timeout: 5_000 },
  globalSetup: './test/browser/mock-setup.ts',
  projects: [
    {
      name: 'mock',
      retries: process.env['CI'] ? 2 : 0,
      testDir: mockDir,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URL.origin,
        screenshot: 'on'
      }
    },
    {
      name: 'smoke',
      retries: 2,
      testDir: smokeDir,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['APP_URL']!,
        screenshot: 'off'
      }
    }
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 15_000
  },
  workers: 1
})
