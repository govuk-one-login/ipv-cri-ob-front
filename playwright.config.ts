import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const testDir = defineBddConfig({
  features: 'test/browser/features/**/*.feature',
  steps: 'test/browser/steps/**/*.ts'
})

export default defineConfig({
  globalSetup: 'test/browser/global-setup.ts',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { open: 'never' }]],
  testDir,
  use: { baseURL: 'http://localhost:5091', screenshot: 'on' } // don't forget to change me in global-setup.ts
})
