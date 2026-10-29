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
    title: /Choose your bank or building society/,
    primaryButton: 'Continue',
    notListedLinkText: 'My bank is not listed',
    statusResults: /^\d+ results are available\./,
    statusSelectedOption: /Vault of Ironforge 1 of 1 is highlighted$/,
    noResults: 'No results found'
  },
  cy: {
    heading: 'Dewiswch eich banc neu gymdeithas adeiladu',
    errorMessage: 'Dewiswch fanc neu gymdeithas adeiladu',
    title: /Dewiswch eich banc neu gymdeithas adeiladu/,
    primaryButton: 'Parhau',
    notListedLinkText: "Nid yw fy manc wedi'i restru",
    // TODO: replace with real Welsh once translations are supplied
    statusResults: /^Lorem \d+ ipsum dolores\./,
    statusSelectedOption: /Vault of Ironforge 1 lorem 1 ipsum$/,
    noResults: 'Lorem ipsum nulla'
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

  test('renders the expected page elements in English and Welsh', async ({ page }) => {
    await expect(chooseBankPage.heading()).toContainText(COPY[lang].heading)
    await expect(page).toHaveTitle(COPY[lang].title)
    await expect(chooseBankPage.bankInput()).toBeVisible()
    await expect(chooseBankPage.bankSelect()).toBeHidden()
    await expect(chooseBankPage.continueButton()).toHaveText(COPY[lang].primaryButton)
    await expect(chooseBankPage.bankSelectOption(BANK_VALUE)).toHaveText(BANK_LABEL)
    await expect(chooseBankPage.bankSelectOption(OFFLINE_BANK_VALUE)).toHaveText(OFFLINE_BANK_LABEL)
    await expect(chooseBankPage.bankNotListedLink()).toContainText(COPY[lang].notListedLinkText)
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

    await test.step('the autocomplete input is shown in its error state', async () => {
      await expect(chooseBankPage.bankInput()).toHaveClass(/govuk-input--error/)
    })

    await test.step('clicking the error summary link focuses the autocomplete input', async () => {
      await chooseBankPage.errorSummaryLink(COPY[lang].errorMessage).click()
      await expect(chooseBankPage.bankInput()).toBeFocused()
    })
  })

  test('announces translated status messages to assistive technology', async ({ page }) => {
    await test.step('opening the menu announces the number of results', async () => {
      await chooseBankPage.bankInput().click()
      await expect(
        chooseBankPage.bankStatus().filter({ hasText: COPY[lang].statusResults })
      ).toHaveCount(1)
    })

    await test.step('highlighting an option announces its position', async () => {
      await chooseBankPage.bankInput().fill(BANK_LABEL)
      await page.keyboard.press('ArrowDown')
      await expect(
        chooseBankPage.bankStatus().filter({ hasText: COPY[lang].statusSelectedOption })
      ).toHaveCount(1)
    })

    await test.step('a query with no matches shows the no results message', async () => {
      await chooseBankPage.bankInput().fill('zzzz')
      await expect(chooseBankPage.bankListbox()).toContainText(COPY[lang].noResults)
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
    await test.step('tab to the autocomplete, type and pick a bank with the arrow keys', async () => {
      await tabToElement(page, 'input#bank-select')
      await expect(chooseBankPage.bankInput()).toBeFocused()
      await page.keyboard.type('Ironforge')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(chooseBankPage.bankInput()).toHaveValue(BANK_LABEL)
      await expect(chooseBankPage.bankSelect()).toHaveValue(BANK_VALUE)
    })

    await test.step('tab to Continue and submit with Enter', async () => {
      await activateWithKeyboard(page, '.govuk-button--progress')
      await expect(page).toHaveURL(/\/agree-share-bank-information/)
    })
  })

  test('clicking away from the open menu leaves the field empty', async ({ page }) => {
    await chooseBankPage.bankInput().click()
    await expect(chooseBankPage.bankListboxOption(BANK_LABEL)).toBeVisible()
    await page.locator('.govuk-footer').click({ position: { x: 1, y: 1 } })
    await expect(chooseBankPage.bankInput()).toHaveValue('')
    await expect(chooseBankPage.bankSelect()).toHaveValue('')
  })

  test('clearing the field after choosing a bank clears the submitted value', async ({ page }) => {
    await chooseBankPage.selectBank(BANK_VALUE)
    await expect(chooseBankPage.bankSelect()).toHaveValue(BANK_VALUE)

    await chooseBankPage.bankInput().fill('')
    await expect(chooseBankPage.bankSelect()).toHaveValue('')

    await chooseBankPage.continue()
    await expect(page).toHaveURL(/\/choose-bank/)
    await expect(chooseBankPage.errorSummary()).toBeVisible()
  })

  test('pressing Escape on a highlighted option closes the menu and returns focus to the input', async ({
    page
  }) => {
    await chooseBankPage.bankInput().click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(chooseBankPage.bankInput()).not.toBeFocused()

    await page.keyboard.press('Escape')
    await expect(chooseBankPage.bankInput()).toBeFocused()
    await expect(chooseBankPage.bankListbox()).toHaveClass(/autocomplete__menu--hidden/)
  })
})

test.describe('Choose bank without JavaScript', { tag: '@desktop' }, () => {
  test.use({ javaScriptEnabled: false })

  test('falls back to the native select and can be submitted', async ({ page }) => {
    const chooseBankPage = await navigate(page, 'en')

    await expect(chooseBankPage.bankInput()).toHaveCount(0)
    await expect(chooseBankPage.bankSelect()).toBeVisible()
    await chooseBankPage.bankSelect().selectOption(BANK_VALUE)
    await chooseBankPage.continue()
    await expect(page).toHaveURL(/\/agree-share-bank-information/)
  })
})
