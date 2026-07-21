import type { Page } from '@playwright/test'

export class SelectSignInMethodPage {
  constructor(private readonly page: Page) {}

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
    return this.page.getByRole('button', { name: 'Continue' })
  }

  heading() {
    return this.page.locator('h1')
  }

  stayOnThisDeviceRadio() {
    return this.page.getByRole('radio', {
      name: /Stay on this device and use your bank.s website/
    })
  }

  useDifferentDeviceRadio() {
    return this.page.getByRole('radio', {
      name: /Use your phone or tablet and scan a QR code/
    })
  }
}
