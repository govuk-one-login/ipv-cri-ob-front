import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'
import { APP_PORT } from './test/browser/config'

const testDir = defineBddConfig({
  features: 'test/browser/features/**/*.feature',
  steps: ['test/browser/fixtures.ts', 'test/browser/steps/**/*.ts']
})

export default defineConfig({
  globalSetup: 'test/browser/global-setup.ts',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { open: 'never' }]],
  testDir,
  use: { baseURL: `http://localhost:${APP_PORT}`, screenshot: 'on' }
})
