import { BasePage } from './base.page'

export class SelectSignInMethodPage extends BasePage {
  chooseStayOnThisDevice() {
    return this.stayOnThisDeviceRadio().check()
  }

  chooseUseDifferentDevice() {
    return this.useDifferentDeviceRadio().check()
  }

  continue() {
    return this.continueButton().click()
  }

  continueButton() {
    return this.page.locator('main .govuk-button-group .govuk-button')
  }

  stayOnThisDeviceRadio() {
    return this.page.locator('input[type="radio"][value="stay-on-current-device"]')
  }

  useDifferentDeviceRadio() {
    return this.page.locator('input[type="radio"][value="use-different-device"]')
  }
}
