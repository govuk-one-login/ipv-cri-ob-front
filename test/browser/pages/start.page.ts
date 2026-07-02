import type { Page } from '@playwright/test'

import { start } from '../constants'

export class StartPage {
  constructor(private readonly page: Page) {}

  continue() {
    return this.page.getByRole('button', { name: 'Continue' }).click()
  }

  fcaLink() {
    return this.page.getByRole('link', {
      name: 'Financial Conduct Authority (opens in a new tab)'
    })
  }

  goto() {
    return this.page.goto(start)
  }

  openDetails() {
    return this.page.locator('details summary').click()
  }

  privacyNoticeLink() {
    return this.page.getByRole('link', { name: 'Our privacy notice (opens in new tab)' })
  }

  proveAnotherWayLink() {
    return this.page.getByRole('link', { name: 'Prove your identity another way' })
  }
}
