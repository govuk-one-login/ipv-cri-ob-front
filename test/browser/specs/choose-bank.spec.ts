import { expect, test } from '../fixtures'
import { navigateToChooseBank } from '../helpers/navigation'
import { ChooseBankPage } from '../pages/choose-bank.page'

test.describe('Choose bank page', () => {
  let chooseBankPage: ChooseBankPage

  test.beforeEach(async ({ page }) => {
    await navigateToChooseBank(page)
    chooseBankPage = new ChooseBankPage(page)
  })

  test('user is directed to the Choose Bank page with correct title and Continue button', async ({
    page
  }) => {
    await expect(page.locator('h1')).toContainText('Choose your bank or building society')
    await expect(page).toHaveTitle(/Choose your bank or building society/)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  test('user is displayed with the bank select dropdown', async ({ page }) => {
    await expect(page.locator('#bank-select')).toBeVisible()
  })

  test('user can select a bank from the dropdown', async ({ page }) => {
    await chooseBankPage.selectBank('Vault of Ironforge')

    await expect(page.locator('#bank-select')).toHaveValue('ironforge-vault')
  })

  test('user is shown a validation error when submitting without selecting a bank', async ({
    page
  }) => {
    await chooseBankPage.continue()

    await expect(page.locator('.govuk-error-summary')).toBeVisible()
    await expect(page.locator('.govuk-error-message')).toContainText(
      'Select a bank or building society'
    )
  })

  test('user clicks the error message link and is directed to the bank select dropdown', async ({
    page
  }) => {
    await chooseBankPage.continue()

    await page
      .locator('.govuk-error-summary')
      .getByRole('link', { name: 'Select a bank or building society' })
      .click()

    await expect(page.locator('#bank-select-error')).toBeVisible()
    await expect(page.locator('#bank-select-error')).toContainText(
      'Select a bank or building society'
    )
    await expect(page.locator('#bank-select')).toBeFocused()
  })

  test('user is displayed with the My bank is not listed link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'My bank is not listed' })).toBeVisible()
  })

  test('user is displayed with a back link to the start page', async ({ page }) => {
    await expect(page.getByRole('link', { exact: true, name: 'Back' })).toHaveAttribute(
      'href',
      '/finish-proving-identity-online-banking'
    )
  })

  test('dropdown contains all banks including the offline bank', async ({ page }) => {
    const select = page.locator('#bank-select')
    await expect(select.locator('option[value="ironforge-vault"]')).toHaveText('Vault of Ironforge')
    await expect(select.locator('option[value="org-counting-house"]')).toHaveText(
      'Orgrimmar Counting House'
    )
    await expect(select.locator('option[value="royal-bank-sw"]')).toHaveText(
      'Royal Bank of Stormwind'
    )
    await expect(select.locator('option[value="stranglethorn-trust-bank"]')).toHaveText(
      'Stranglethorn Trust Bank'
    )
    await expect(select.locator('option[value="dalaran-merchant-bank"]')).toHaveText(
      'Dalaran Merchant Bank'
    )
    await expect(select.locator('option[value="forgotten-uldaman-vault"]')).toHaveText(
      'Forgotten Vault of Uldaman'
    )
  })

  test('user selecting a valid bank and continuing is navigated to the consent page', async ({
    page
  }) => {
    await chooseBankPage.selectBank('Vault of Ironforge')
    await chooseBankPage.continue()

    await expect(page).toHaveURL(/\/agree-share-bank-information$/)
  })

  test('user selecting an offline bank and continuing is redirected to the bank unavailable page', async ({
    page
  }) => {
    await chooseBankPage.selectBank('Forgotten Vault of Uldaman')
    await chooseBankPage.continue()

    await expect(page).toHaveURL(/\/sorry-problem-bank$/)
  })

  test('My bank is not listed link points to prove-another-way', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'My bank is not listed' })).toHaveAttribute(
      'href',
      '/prove-another-way'
    )
  })
})
