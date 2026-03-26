import { expect } from '@playwright/test'
import { test as base } from 'playwright-bdd'

export const noConsoleErrors = base.extend<{ noConsoleErrors: void }>({
  noConsoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await use()
      expect(errors, 'Unexpected browser console errors').toEqual([])
    },
    { auto: false }
  ]
})
