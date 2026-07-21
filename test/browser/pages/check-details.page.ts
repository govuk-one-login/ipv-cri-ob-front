import type { Page } from '@playwright/test'

export class CheckDetailsPage {
  constructor(private readonly page: Page) {}

  heading() {
    return this.page.locator('h1')
  }

  spinnerButton() {
    return this.page.locator('.govuk-button--progress-loading')
  }
}
