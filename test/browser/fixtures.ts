import { wiremock as wiremockAdmin } from './wiremock/admin'
import { test as base, expect } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

interface Fixtures {
  axeCheck: void
  noConsoleErrors: void
  skipAxe: boolean
  skipConsoleErrors: boolean
}

export const test = base.extend<Fixtures>({
  axeCheck: [
    async ({ page, skipAxe }, use) => {
      await use()
      if (skipAxe) return
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()
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
        if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource'))
          errors.push(msg.text())
      })
      await use()
      if (skipConsoleErrors) return
      expect(errors, 'Unexpected browser console errors').toEqual([])
    },
    { auto: true }
  ],
  skipAxe: [false, { option: true }],
  skipConsoleErrors: [false, { option: true }]
})

const smokeTest = test.extend({})

const mockTest = test.extend<{ wiremock: typeof wiremockAdmin }>({
  wiremock: async ({}, use) => {
    await wiremockAdmin.resetScenarios()
    await wiremockAdmin.resetRequests()
    await use(wiremockAdmin)
  }
})

export { expect } from '@playwright/test'
export { mockTest, smokeTest }
