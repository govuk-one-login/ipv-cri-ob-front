import type { Page } from '@playwright/test'

export class ChooseBankPage {
  constructor(private readonly page: Page) {}

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }

  async continueWelsh() {
    await this.page.getByRole('button', { name: 'Parhau' }).click()
  }

  async selectBank(label: string) {
    await this.page.locator('#bank-select').selectOption({ label })
  }
}
