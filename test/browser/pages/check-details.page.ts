import { BasePage } from './base.page'

export class CheckDetailsPage extends BasePage {
  spinnerButton() {
    return this.page.locator('.govuk-button--progress-loading')
  }
}
