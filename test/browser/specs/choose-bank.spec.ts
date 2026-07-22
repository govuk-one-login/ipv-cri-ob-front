import type { Page } from '@playwright/test'

import { expect, runAxe, test } from '../fixtures'
import { activateWithKeyboard, tabToElement } from '../helpers/keyboard'
import { type Language, switchToWelsh } from '../helpers/language'
import { AuthorisePage } from '../pages/authorise.page'
import { ChooseBankPage } from '../pages/choose-bank.page'
import { StartPage } from '../pages/start.page'

import paths from '../../../src/config/paths'

const BANK_LABEL = 'Vault of Ironforge'
const BANK_VALUE = 'ironforge-vault'
const OFFLINE_BANK_LABEL = 'Forgotten Vault of Uldaman'
const OFFLINE_BANK_VALUE = 'forgotten-uldaman-vault'

const COPY = {
  en: {
    heading: 'Choose your bank or building society',
    errorMessage: 'Select a bank or building society',
    title: /Choose your bank or building society/
  },
  cy: {
    heading: 'Lorem ipsum dolor sit amet consectetur',
    errorMessage: 'Adipiscing elit sed do eiusmod',
    title: /Lorem ipsum dolor sit amet consectetur/
  }
}

const navigate = async (page: Page, lang: Language) => {
  const authorise = new AuthorisePage(page)
  const startPage = new StartPage(page)

  await authorise.goto('test-jwt-success')
  if (lang === 'cy') await switchToWelsh(page)
  await startPage.continue()

  return new ChooseBankPage(page)
}

const registerChooseBankTests = (lang: Language) => {
  let chooseBankPage: ChooseBankPage

  test.beforeEach(async ({ page }) => {
    chooseBankPage = await navigate(page, lang)
  })

  test('renders the expected page elements', async ({ page }) => {
    await expect(chooseBankPage.heading()).toContainText(COPY[lang].heading)
    await expect(page).toHaveTitle(COPY[lang].title)
    await expect(chooseBankPage.bankSelect()).toBeVisible()
    await expect(chooseBankPage.continueButton()).toBeVisible()
    await expect(chooseBankPage.bankSelectOption(BANK_VALUE)).toHaveText(BANK_LABEL)
    await expect(chooseBankPage.bankSelectOption(OFFLINE_BANK_VALUE)).toHaveText(OFFLINE_BANK_LABEL)
    await expect(chooseBankPage.bankNotListedLink()).toHaveAttribute(
      'href',
      paths.steps.proveAnotherWay
    )
    await expect(chooseBankPage.backLink()).toHaveAttribute('href', paths.steps.start)
  })

  test('renders form validation errors and links error summary items to inputs', async ({
    page
  }) => {
    await test.step('submitting without a selection returns to the page with an error', async () => {
      await chooseBankPage.continue()
      await expect(page).toHaveURL(/\/choose-bank/)
      await expect(chooseBankPage.errorSummary()).toBeVisible()
      await expect(chooseBankPage.errorMessage()).toContainText(COPY[lang].errorMessage)
    })

    await test.step('clicking the error summary link focuses the bank select', async () => {
      await chooseBankPage.errorSummaryLink(COPY[lang].errorMessage).click()
      await expect(chooseBankPage.bankSelect()).toBeFocused()
    })
  })
}

test.describe('Choose bank (English)', { tag: '@desktop' }, () => {
  registerChooseBankTests('en')
})

test.describe('Choose bank (Welsh)', { tag: '@desktop' }, () => {
  registerChooseBankTests('cy')
})

test.describe('Choose bank extras', { tag: '@desktop' }, () => {
  let chooseBankPage: ChooseBankPage

  test.beforeEach(async ({ page }) => {
    chooseBankPage = await navigate(page, 'en')
  })

  test('passes accessibility checks', async ({ page }) => {
    await runAxe(page)
  })

  test('selecting a valid bank navigates to the consent page', async ({ page }) => {
    await chooseBankPage.selectBank(BANK_VALUE)
    await chooseBankPage.continue()
    await expect(page).toHaveURL(/\/agree-share-bank-information/)
  })

  test('selecting an offline bank redirects to the bank unavailable page', async ({ page }) => {
    await chooseBankPage.selectBank(OFFLINE_BANK_VALUE)
    await chooseBankPage.continue()
    await expect(page).toHaveURL(/\/sorry-problem-bank/)
  })

  test('user can complete the form using the keyboard only', async ({ page }) => {
    await test.step('tab to and pick a bank with the keyboard', async () => {
      await tabToElement(page, '#bank-select')
      await expect(chooseBankPage.bankSelect()).toBeFocused()
      await chooseBankPage.selectBankByLabel(BANK_LABEL)
      await expect(chooseBankPage.bankSelect()).toHaveValue(BANK_VALUE)
    })

    await test.step('tab to Continue and submit with Enter', async () => {
      await activateWithKeyboard(page, '.govuk-button--progress')
      await expect(page).toHaveURL(/\/agree-share-bank-information/)
    })
  })
})
