import type { Page } from '@playwright/test'

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  backLink() {
    return this.page.locator('.govuk-back-link')
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

  mainContent() {
    return this.page.locator('main')
  }
}
