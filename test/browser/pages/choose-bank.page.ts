import type { Page } from '@playwright/test'

export class ChooseBankPage {
  constructor(private readonly page: Page) {}

  backLink() {
    return this.page.getByRole('link', { exact: true, name: 'Back' })
  }

  bankNotListedLink() {
    return this.page.getByRole('link', { name: 'My bank is not listed' })
  }

  bankSelect() {
    return this.page.locator('#bank-select')
  }

  bankSelectOption(value: string) {
    return this.bankSelect().locator(`option[value="${value}"]`)
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

  selectBank(value: string) {
    return this.bankSelect().selectOption(value)
  }

  selectBankByLabel(label: string) {
    return this.bankSelect().selectOption({ label })
  }
}
