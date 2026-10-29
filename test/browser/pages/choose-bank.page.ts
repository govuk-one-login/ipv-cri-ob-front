import { BasePage } from './base.page'

import paths from '../../../src/config/paths'

export class ChooseBankPage extends BasePage {
  bankInput() {
    return this.page.locator('input#bank-select')
  }

  bankListbox() {
    return this.page.locator('#bank-select__listbox')
  }

  bankListboxOption(label: string) {
    return this.bankListbox().getByRole('option', { name: label })
  }

  bankNotListedLink() {
    return this.page.locator(`main a[href="${paths.steps.proveAnotherWay}"]`)
  }

  bankSelect() {
    return this.page.locator('select[name="bankSelect"]')
  }

  bankSelectOption(value: string) {
    return this.bankSelect().locator(`option[value="${value}"]`)
  }

  bankSelectOptions() {
    return this.bankSelect().locator('option:not([value=""])')
  }

  bankStatus() {
    return this.page.locator('#bank-select__status--A, #bank-select__status--B')
  }

  continue() {
    return this.continueButton().click()
  }

  continueButton() {
    return this.page.locator('.govuk-button--progress')
  }

  async selectBank(value: string) {
    const label = await this.bankSelectOption(value).textContent()
    await this.selectBankByLabel(label!.trim())
  }

  async selectBankByLabel(label: string) {
    await this.bankInput().fill(label)
    await this.bankListboxOption(label).click()
  }

  async selectFirstAvailableBank() {
    const bankName = (await this.bankSelectOptions().first().textContent())!.trim()
    await this.selectBankByLabel(bankName)
    return bankName
  }
}
