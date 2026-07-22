import type { Page } from '@playwright/test'

import { wiremock as wiremockAdmin } from './wiremock/admin'
import { test as base, expect } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

interface Fixtures {
  noConsoleErrors: void
  resetLanguage: void
  skipConsoleErrors: boolean
}

const smokeTest = base.extend<Fixtures>({
  noConsoleErrors: [
    async ({ page, skipConsoleErrors }, use) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource'))
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
  skipConsoleErrors: [false, { option: true }]
})

const test = smokeTest.extend<{ wiremock: typeof wiremockAdmin }>({
  wiremock: async ({}, use) => {
    await wiremockAdmin.resetScenarios()
    await wiremockAdmin.resetRequests()
    await use(wiremockAdmin)
  }
})

const runAxe = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag22aa'])
    .exclude('.govuk-footer__inline-list-item') // violates WCAG 2.2 SC 2.5.8 (target-size) on narrow viewports
    .analyze()
  const summary = violations.map((v) => ({
    help: v.helpUrl,
    id: v.id,
    impact: v.impact,
    targets: v.nodes.map((n) => n.target.join(', '))
  }))
  expect(summary, 'Accessibility violations found').toEqual([])
}

export { expect } from '@playwright/test'
export { runAxe, smokeTest, test }
