import type { Page } from '@playwright/test'

export class ConsentPage {
  constructor(private readonly page: Page) {}

  backLink() {
    return this.page.getByRole('link', { exact: true, name: 'Back' })
  }

  checkConsent() {
    return this.consentCheckbox().check()
  }

  consentCheckbox() {
    return this.page.locator('#consent')
  }

  continue() {
    return this.continueButton().click()
  }

  continueButton(text: string = 'Continue') {
    return this.page.getByRole('button', { name: text })
  }

  errorMessage() {
    return this.page.locator('.govuk-error-message')
  }

  errorSummary() {
    return this.page.locator('.govuk-error-summary')
  }

  errorSummaryLink(name: string) {
    return this.errorSummary().getByRole('link', { name })
  }

  heading() {
    return this.page.locator('h1')
  }

  insetText() {
    return this.page.locator('.govuk-inset-text')
  }

  mainContent() {
    return this.page.locator('main')
  }

  mobileContinueButton() {
    return this.page.getByRole('button', { name: /Continue to your bank.s app or website/ })
  }

  proveAnotherWayLink() {
    return this.page.getByRole('link', { name: 'Prove your identity another way' })
  }
}
