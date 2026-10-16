import { BasePage } from './base.page'

import paths from '../../../src/config/paths'

export class ConsentPage extends BasePage {
  checkConsent() {
    return this.consentCheckbox().check()
  }

  consentCheckbox() {
    return this.page.locator('#consent')
  }

  continue() {
    return this.continueButton().click()
  }

  continueButton() {
    return this.page.locator('.govuk-button--progress')
  }

  proveAnotherWayLink() {
    return this.page.locator(`main a[href="${paths.steps.proveAnotherWay}"]`)
  }
}
