import { BasePage } from './base.page'

import paths from '../../../src/config/paths'

export class StartPage extends BasePage {
  continue() {
    return this.continueButton().click()
  }

  continueButton() {
    return this.page.locator('main .govuk-button-group .govuk-button')
  }

  detailsBody() {
    return this.page.locator('details .govuk-details__text')
  }

  detailsToggle() {
    return this.page.locator('details summary')
  }

  detailsWrapper() {
    return this.page.locator('details')
  }

  fcaLink() {
    return this.page.locator('main a[href*="register.fca.org.uk"]')
  }

  goto() {
    return this.page.goto(paths.index)
  }

  openDetails() {
    return this.detailsToggle().click()
  }

  privacyNoticeLink() {
    return this.page.locator(
      'main a[href="https://www.gov.uk/government/publications/govuk-one-login-privacy-notice"]'
    )
  }

  proveAnotherWayLink() {
    return this.page.locator(`main a[href="${paths.steps.proveAnotherWay}"]`)
  }
}
