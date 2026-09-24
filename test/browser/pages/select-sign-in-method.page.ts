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

  stayOnThisDeviceHint() {
    return this.page.locator('#select-sign-in-method-2-item-hint')
  }

  stayOnThisDeviceRadio() {
    return this.page.locator('input[type="radio"][value="stay-on-current-device"]')
  }

  useDifferentDeviceHint() {
    return this.page.locator('#select-sign-in-method-item-hint')
  }

  useDifferentDeviceRadio() {
    return this.page.locator('input[type="radio"][value="use-different-device"]')
  }
}
