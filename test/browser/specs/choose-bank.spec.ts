import type { Page } from '@playwright/test'

import { expect, runAxe, desktopTest as test } from '../fixtures'
import { activateWithKeyboard, tabToElement } from '../helpers/keyboard'
import { AuthorisePage } from '../pages/authorise.page'
import { ChooseBankPage } from '../pages/choose-bank.page'

import paths from '../../../src/config/paths'

const BANK_LABEL = 'Vault of Ironforge'
const BANK_VALUE = 'ironforge-vault'
const OFFLINE_BANK_LABEL = 'Forgotten Vault of Uldaman'
const OFFLINE_BANK_VALUE = 'forgotten-uldaman-vault'

const navigate = async (page: Page, buttonText: string) => {
  const authorise = new AuthorisePage(page)
  await authorise.goto('test-jwt-success')
  await page.getByRole('button', { name: buttonText }).click()
}

test.describe('Choose bank', () => {
  let chooseBankPage: ChooseBankPage

  test.beforeEach(async ({ page }) => {
    chooseBankPage = new ChooseBankPage(page)
    await navigate(page, 'Continue')
  })

  test('renders the expected page elements', async ({ page }) => {
    await expect(chooseBankPage.heading()).toContainText('Choose your bank or building society')
    await expect(page).toHaveTitle(/Choose your bank or building society/)
    await expect(chooseBankPage.bankSelect()).toBeVisible()
    await expect(chooseBankPage.continueButton()).toBeVisible()
    await expect(chooseBankPage.bankSelectOption(BANK_VALUE)).toHaveText(BANK_LABEL)
    await expect(chooseBankPage.bankSelectOption(OFFLINE_BANK_VALUE)).toHaveText(OFFLINE_BANK_LABEL)
    await expect(chooseBankPage.bankNotListedLink()).toHaveAttribute(
      'href',
      paths.steps.proveAnotherWay
    )
    await expect(chooseBankPage.backLink()).toHaveAttribute('href', paths.steps.start)

    await runAxe(page)
  })

  test('submitting without selecting a bank returns validation error', async ({ page }) => {
    await test.step('submit the form without selecting a bank', async () => {
      await chooseBankPage.continue()
      await expect(page).toHaveURL(/\/choose-bank$/)
      await expect(chooseBankPage.errorSummary()).toBeVisible()
      await expect(chooseBankPage.errorMessage()).toContainText('Select a bank or building society')
    })

    await test.step('clicking the error summary link focuses the bank select', async () => {
      await chooseBankPage.errorSummaryLink('Select a bank or building society').click()
      await expect(chooseBankPage.bankSelect()).toBeFocused()
    })
  })

  test('selecting a valid bank navigates to the consent page', async ({ page }) => {
    await chooseBankPage.selectBank(BANK_VALUE)
    await chooseBankPage.continue()

    await expect(page).toHaveURL(/\/agree-share-bank-information$/)
  })

  test('selecting an offline bank redirects to the bank unavailable page', async ({ page }) => {
    await chooseBankPage.selectBank(OFFLINE_BANK_VALUE)
    await chooseBankPage.continue()

    await expect(page).toHaveURL(/\/sorry-problem-bank$/)
  })

  test.describe('Keyboard navigation', () => {
    test('user can complete the form using the keyboard only', async ({ page }) => {
      await test.step('tab to and pick a bank with the keyboard', async () => {
        await tabToElement(page, '#bank-select')
        await expect(chooseBankPage.bankSelect()).toBeFocused()
        await chooseBankPage.selectBankByLabel(BANK_LABEL)
        await expect(chooseBankPage.bankSelect()).toHaveValue(BANK_VALUE)
      })

      await test.step('tab to Continue and submit with Enter', async () => {
        await activateWithKeyboard(page, '.govuk-button--progress')
        await expect(page).toHaveURL(/\/agree-share-bank-information$/)
      })
    })

    test('activating the error summary link focuses the bank select', async ({ page }) => {
      await test.step('submit the form to surface the error summary', async () => {
        await tabToElement(page, '.govuk-button--progress')
        await page.keyboard.press('Enter')
        await expect(chooseBankPage.errorSummary()).toBeVisible()
      })

      await test.step('tab to and activate the error summary link', async () => {
        await tabToElement(page, '.govuk-error-summary a')
        await page.keyboard.press('Enter')
        await expect(chooseBankPage.bankSelect()).toBeFocused()
      })
    })
  })
})
