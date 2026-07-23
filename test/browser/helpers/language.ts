import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export type Language = 'cy' | 'en'

export const switchToWelsh = async (page: Page) => {
  await page.locator('nav.language-select').getByRole('link', { name: 'Cymraeg' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'cy')
}
