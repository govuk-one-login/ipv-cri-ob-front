import type { Page } from '@playwright/test'

import paths from '../../../src/config/paths'

export class StartPage {
  constructor(private readonly page: Page) {}

  backLink() {
    return this.page.getByRole('link', { exact: true, name: 'Back' })
  }

  continue() {
    return this.continueButton().click()
  }

  continueButton() {
    return this.page.getByRole('button', { name: 'Continue' })
  }

  detailsBody() {
    return this.page.locator('details .govuk-details__text')
  }

  detailsToggle() {
    return this.page.locator('details summary')
  }

  detailsWrapper() {
    return this.page.locator('details')
  }

  fcaLink() {
    return this.page.getByRole('link', {
      name: 'Financial Conduct Authority (opens in a new tab)'
    })
  }

  goto() {
    return this.page.goto(paths.steps.start)
  }

  heading() {
    return this.page.locator('h1')
  }

  openDetails() {
    return this.detailsToggle().click()
  }

  privacyNoticeLink() {
    return this.page.getByRole('link', { name: 'Our privacy notice (opens in new tab)' })
  }

  proveAnotherWayLink() {
    return this.page.getByRole('link', { name: 'Prove your identity another way' })
  }
}
