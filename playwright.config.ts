import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const testDir = defineBddConfig({
  features: 'test/browser/features/**/*.feature',
  steps: 'test/browser/steps/**/*.ts'
})

export default defineConfig({
  globalSetup: 'test/browser/global-setup.ts',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: 'html',
  testDir,
  use: { baseURL: 'http://localhost:3001' }
})
