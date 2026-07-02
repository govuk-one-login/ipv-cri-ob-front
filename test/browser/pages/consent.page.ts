import type { Page } from '@playwright/test'

export class ConsentPage {
  constructor(private readonly page: Page) {}

  checkConsent() {
    return this.page.locator('#consent').check()
  }

  consentCheckbox() {
    return this.page.locator('#consent')
  }

  continue() {
    return this.page.getByRole('button', { name: 'Continue' }).click()
  }

  errorMessage() {
    return this.page.locator('.govuk-error-message')
  }

  errorSummary() {
    return this.page.locator('.govuk-error-summary')
  }

  errorSummaryLink() {
    return this.page.locator('.govuk-error-summary').getByRole('link', {
      name: 'You must agree to share your bank account information to continue'
    })
  }

  insetText() {
    return this.page.locator('.govuk-inset-text')
  }

  proveAnotherWayLink() {
    return this.page.getByRole('link', { name: 'Prove your identity another way' })
  }
}
