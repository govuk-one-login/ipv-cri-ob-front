import { BasePage } from './base.page'

import paths from '../../../src/config/paths'

export class ChooseBankPage extends BasePage {
  bankNotListedLink() {
    return this.page.locator(`main a[href="${paths.steps.proveAnotherWay}"]`)
  }

  bankSelect() {
    return this.page.locator('#bank-select')
  }

  bankSelectOption(value: string) {
    return this.bankSelect().locator(`option[value="${value}"]`)
  }

  bankSelectOptions() {
    return this.bankSelect().locator('option:not([value=""])')
  }

  continue() {
    return this.continueButton().click()
  }

  continueButton() {
    return this.page.locator('.govuk-button--progress')
  }

  selectBank(value: string) {
    return this.bankSelect().selectOption(value)
  }

  selectBankByLabel(label: string) {
    return this.bankSelect().selectOption({ label })
  }

  async selectFirstAvailableBank() {
    await this.bankSelect().click()
    const firstBank = this.bankSelectOptions().first()
    const bankName = (await firstBank.innerText()).trim()
    await this.bankSelect().selectOption(await firstBank.getAttribute('value'))
    return bankName
  }
}
