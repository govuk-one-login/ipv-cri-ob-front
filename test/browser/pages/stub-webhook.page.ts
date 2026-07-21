import type { Page } from '@playwright/test'

export class StubWebhookPage {
  constructor(private readonly page: Page) {}

  continueToCri() {
    return this.continueToCriButton().click()
  }

  continueToCriButton() {
    return this.page.getByRole('button', { name: 'Continue to CRI' })
  }
}
