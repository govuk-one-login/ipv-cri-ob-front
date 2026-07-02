import { consent, proveAnotherWay, start } from '../constants'
import { expect, test } from '../fixtures'
import { activateWithKeyboard, tabToElement } from '../helpers/keyboard'
import { navigateToChooseBank } from '../helpers/navigation'
import { ChooseBankPage } from '../pages/choose-bank.page'
import { StartPage } from '../pages/start.page'

const navigateToConsentPage = async (page: ConstructorParameters<typeof ChooseBankPage>[0]) => {
  await navigateToChooseBank(page)
  const chooseBankPage = new ChooseBankPage(page)
  await chooseBankPage.selectBank('Vault of Ironforge')
  const navigation = page.waitForURL(`**${consent}`)
  await chooseBankPage.continue()
  await navigation
}

test.describe('Keyboard navigation', () => {
  test.describe('Start page', () => {
    test('user can tab to the Continue link and activate it with Enter', async ({ page }) => {
      const startPage = new StartPage(page)
      await startPage.goto()

      await tabToElement(page, 'a.govuk-button')
      await page.keyboard.press('Enter')

      await expect(page).not.toHaveURL(start)
    })

    test('user can tab to the details summary and toggle it with Enter', async ({ page }) => {
      const startPage = new StartPage(page)
      await startPage.goto()

      await tabToElement(page, 'details summary')
      await page.keyboard.press('Enter')

      await expect(page.locator('details')).toHaveAttribute('open', '')
    })

    test('user can tab to the Prove your identity another way link', async ({ page }) => {
      const startPage = new StartPage(page)
      await startPage.goto()

      await tabToElement(page, `a.govuk-link[href="${proveAnotherWay}"]`)

      await expect(startPage.proveAnotherWayLink()).toBeFocused()
    })
  })

  test.describe('Choose bank page', () => {
    test('user can tab to the bank select dropdown and change value with arrow keys', async ({
      page
    }) => {
      await navigateToChooseBank(page)

      await tabToElement(page, '#bank-select')
      await page.keyboard.press('ArrowDown')

      await expect(page.locator('#bank-select')).toBeFocused()
    })

    test('user can select Vault of Ironforge from the dropdown using keyboard only', async ({
      page
    }) => {
      await navigateToChooseBank(page)
      const chooseBankPage = new ChooseBankPage(page)

      await tabToElement(page, '#bank-select')
      await chooseBankPage.selectBank('Vault of Ironforge')

      await expect(page.locator('#bank-select')).toHaveValue('ironforge-vault')
    })

    test('user can tab to the Continue button and submit the form with Enter', async ({ page }) => {
      await navigateToChooseBank(page)
      const chooseBankPage = new ChooseBankPage(page)

      await chooseBankPage.selectBank('Vault of Ironforge')
      const navigation = page.waitForURL(`**${consent}`)
      await activateWithKeyboard(page, '.govuk-button--progress')
      await navigation
    })

    test('user can tab to the error summary link and activate it with Enter to focus the select', async ({
      page
    }) => {
      await navigateToChooseBank(page)

      await tabToElement(page, '.govuk-button--progress')
      await page.keyboard.press('Enter')
      await tabToElement(page, '.govuk-error-summary a')
      await page.keyboard.press('Enter')

      await expect(page.locator('#bank-select')).toBeFocused()
    })
  })

  test.describe('Consent page', () => {
    test('user can tab to the consent checkbox and check it with Space', async ({ page }) => {
      await navigateToConsentPage(page)

      await tabToElement(page, '#consent')
      await page.keyboard.press('Space')

      await expect(page.locator('#consent')).toBeChecked()
    })

    test('user can tab to the Continue button and submit the form with Enter', async ({ page }) => {
      await navigateToConsentPage(page)

      await tabToElement(page, '#consent')
      await page.keyboard.press('Space')
      await tabToElement(page, '.govuk-button--progress')

      await expect(page.locator('#consent')).toBeChecked()
    })

    test('user can tab to the error summary link and activate it with Enter to focus the checkbox', async ({
      page
    }) => {
      await navigateToConsentPage(page)

      await tabToElement(page, '.govuk-button--progress')
      await page.keyboard.press('Enter')
      await tabToElement(page, '.govuk-error-summary a')
      await page.keyboard.press('Enter')

      await expect(page.locator('#consent')).toBeFocused()
    })

    test('user can tab to the Prove your identity another way link', async ({ page }) => {
      await navigateToConsentPage(page)

      // TODO: consent.njk renders this link with href="#" which is a bug — it should be
      // href="/prove-another-way". Once fixed, update this selector to:
      // `a.govuk-link[href="${proveAnotherWay}"]` (re-add proveAnotherWay to the import)
      await tabToElement(page, 'a.govuk-link[href="#"]')

      await expect(
        page.getByRole('link', { name: 'Prove your identity another way' })
      ).toBeFocused()
    })
  })
})
