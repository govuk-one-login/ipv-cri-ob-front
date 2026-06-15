import { wiremock as wiremockAdmin } from './wiremock/admin'
import { test as base, expect } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

interface Fixtures {
  axeCheck: void
  noConsoleErrors: void
  resetLanguage: void
  skipAxe: boolean
  skipConsoleErrors: boolean
}

export const test = base.extend<Fixtures>({
  axeCheck: [
    async ({ page, skipAxe }, use) => {
      await use()
      if (skipAxe) return
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag22aa']).analyze()
      const summary = violations.map((v) => ({
        help: v.helpUrl,
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target.join(', '))
      }))
      expect(summary, 'Accessibility violations found').toEqual([])
    },
    { auto: true }
  ],
  noConsoleErrors: [
    async ({ page, skipConsoleErrors }, use) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (
          msg.type() === 'error' &&
          !msg.text().startsWith('Failed to load resource') &&
          !msg.text().includes('downloadable font:') &&
          !msg.text().includes('[vite] failed to connect to websocket')
        )
          errors.push(msg.text())
      })
      await use()
      if (skipConsoleErrors) return
      expect(errors, 'Unexpected browser console errors').toEqual([])
    },
    { auto: true }
  ],
  resetLanguage: [
    async ({ page }, use) => {
      await page.context().addCookies([
        {
          domain: 'localhost',
          name: 'lng',
          path: '/',
          value: 'en'
        }
      ])
      await use()
    },
    { auto: true }
  ],
  skipAxe: [false, { option: true }],
  skipConsoleErrors: [false, { option: true }]
})

const smokeTest = test

const mockTest = test.extend<{ wiremock: typeof wiremockAdmin }>({
  wiremock: async ({}, use) => {
    await wiremockAdmin.resetScenarios()
    await wiremockAdmin.resetRequests()
    await use(wiremockAdmin)
  }
})

export { expect } from '@playwright/test'
export { mockTest, smokeTest }
