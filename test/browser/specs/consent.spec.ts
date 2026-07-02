import { expect, test } from '../fixtures'
import { navigateToConsent } from '../helpers/navigation'
import { ConsentPage } from '../pages/consent.page'

test.describe('Consent page', () => {
  let consentPage: ConsentPage

  test.beforeEach(async ({ page }) => {
    await navigateToConsent(page)
    consentPage = new ConsentPage(page)
  })

  test('user is directed to the Consent page with the correct title and Continue button', async ({
    page
  }) => {
    await expect(page.locator('h1')).toContainText(
      'Agree to share information from your bank or building society account with Ecospend'
    )
    await expect(page).toHaveTitle(
      /Agree to share information from your bank or building society account with Ecospend/
    )
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  test('user is displayed with the consent checkbox', async () => {
    await expect(consentPage.consentCheckbox()).toBeVisible()
    await expect(consentPage.consentCheckbox()).not.toBeChecked()
  })

  test('user can check the consent checkbox', async () => {
    await consentPage.checkConsent()

    await expect(consentPage.consentCheckbox()).toBeChecked()
  })

  test('user is shown a validation error when submitting without checking the consent checkbox', async () => {
    await consentPage.continue()

    await expect(consentPage.errorSummary()).toBeVisible()
    await expect(consentPage.errorMessage()).toContainText(
      'You must agree to share your bank account information to continue'
    )
  })

  test('user clicks the error message link and is directed to the error above the checkbox', async () => {
    await consentPage.continue()
    await consentPage.errorSummaryLink().click()

    await expect(consentPage.consentCheckbox()).toBeFocused()
    await expect(consentPage.errorMessage()).toContainText(
      'You must agree to share your bank account information to continue'
    )
  })

  test('user is displayed with the text about Ecospend deleting information', async () => {
    await expect(consentPage.insetText()).toContainText(
      'Ecospend will securely delete your information after the check is complete.'
    )
  })

  test('user is displayed with the selected bank name in the page content', async ({ page }) => {
    await expect(page.locator('main')).toContainText('Vault of Ironforge')
  })

  test('user is displayed with the Prove your identity another way link', async () => {
    await expect(consentPage.proveAnotherWayLink()).toBeVisible()
  })
})
