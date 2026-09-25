import type { Page } from '@playwright/test'

import { expect, runAxe, test } from '../fixtures'
import { tabToElement } from '../helpers/keyboard'
import { type Language, switchToWelsh } from '../helpers/language'
import { AuthorisePage } from '../pages/authorise.page'
import { ChooseBankPage } from '../pages/choose-bank.page'
import { ConsentPage } from '../pages/consent.page'
import { SelectSignInMethodPage } from '../pages/select-sign-in-method.page'
import { StartPage } from '../pages/start.page'

import paths from '../../../src/config/paths'

const BANK_VALUE = 'ironforge-vault'

const COPY = {
  en: {
    heading: 'How do you want to sign in to your online banking?',
    title: /How do you want to sign in to your online banking\?/,
    errorMessage: 'Select how you want to sign in to your online banking',
    primaryButton: 'Continue',
    hintOne: 'You can use your bank’s app or mobile website to prove your identity.',
    hintTwo: 'When you continue, you’ll be sent to your bank’s website.'
  },
  cy: {
    heading: 'Lorem ipsum dolor sit amet consectetur adipiscing?',
    title: /Lorem ipsum dolor sit amet consectetur adipiscing\?/,
    errorMessage: 'Sed do eiusmod tempor incididunt ut labore et dolore',
    primaryButton: 'Lorem ipsum',
    hintOne: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    hintTwo: 'Ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  }
}

const navigate = async (page: Page, lang: Language) => {
  const authorise = new AuthorisePage(page)
  const startPage = new StartPage(page)
  const chooseBankPage = new ChooseBankPage(page)
  const consentPage = new ConsentPage(page)

  await authorise.goto('test-jwt-success')
  if (lang === 'cy') await switchToWelsh(page)
  await startPage.continue()
  await chooseBankPage.selectBank(BANK_VALUE)
  await chooseBankPage.continue()
  await consentPage.checkConsent()
  await consentPage.continue()

  return new SelectSignInMethodPage(page)
}

const registerSelectSignInTests = (lang: Language) => {
  let selectSignInPage: SelectSignInMethodPage

  test.beforeEach(async ({ page }) => {
    selectSignInPage = await navigate(page, lang)
  })

  test('renders the expected page elements in English and Welsh', async ({ page }) => {
    await expect(selectSignInPage.heading()).toContainText(COPY[lang].heading)
    await expect(page).toHaveTitle(COPY[lang].title)
    await expect(selectSignInPage.useDifferentDeviceRadio()).toBeVisible()
    await expect(selectSignInPage.stayOnThisDeviceRadio()).toBeVisible()
    await expect(selectSignInPage.useDifferentDeviceHint()).toContainText(COPY[lang].hintOne)
    await expect(selectSignInPage.stayOnThisDeviceHint()).toContainText(COPY[lang].hintTwo)
    await expect(selectSignInPage.continueButton()).toHaveText(COPY[lang].primaryButton)
    await expect(selectSignInPage.backLink()).toHaveAttribute('href', paths.steps.consent)
  })

  test('renders form validation errors and links error summary items to inputs', async () => {
    await test.step('submitting without a selection returns to the page with an error', async () => {
      await selectSignInPage.continue()
      await expect(selectSignInPage.errorSummary()).toBeVisible()
      await expect(selectSignInPage.errorSummaryLink(COPY[lang].errorMessage)).toBeVisible()
      await expect(selectSignInPage.errorMessage()).toContainText(COPY[lang].errorMessage)
    })

    await test.step('clicking the error summary link focuses the radio group', async () => {
      await selectSignInPage.errorSummaryLink(COPY[lang].errorMessage).click()
      await expect(selectSignInPage.useDifferentDeviceRadio()).toBeFocused()
    })
  })
}

test.describe('Select sign in method (English)', { tag: '@desktop' }, () => {
  registerSelectSignInTests('en')
})

test.describe('Select sign in method (Welsh)', { tag: '@desktop' }, () => {
  registerSelectSignInTests('cy')
})

test.describe('Select sign in method extras', { tag: '@desktop' }, () => {
  let selectSignInPage: SelectSignInMethodPage

  test.beforeEach(async ({ page }) => {
    selectSignInPage = await navigate(page, 'en')
  })

  test('passes accessibility checks', async ({ page }) => {
    await runAxe(page)
  })

  test('selecting use a different device redirects to scan QR code', async ({ page }) => {
    await selectSignInPage.chooseUseDifferentDevice()
    await selectSignInPage.continue()
    await expect(page).toHaveURL(/\/scan-qr-code-sign-in-online-banking/)
  })

  test('selecting stay on this device redirects to the bank consent URL', async ({ page }) => {
    await selectSignInPage.chooseStayOnThisDevice()
    await selectSignInPage.continue()
    await expect(page).toHaveURL(/\/stubs\/webhook/)
  })

  test('user can complete the form using the keyboard only', async ({ page }) => {
    await test.step('tab to the first radio and select an option with Space', async () => {
      await tabToElement(page, 'input[type="radio"][value="use-different-device"]')
      await page.keyboard.press('Space')
      await expect(selectSignInPage.useDifferentDeviceRadio()).toBeChecked()
    })

    await test.step('navigate to second radio with ArrowDown', async () => {
      await page.keyboard.press('ArrowDown')
      await expect(selectSignInPage.stayOnThisDeviceRadio()).toBeChecked()
    })

    await test.step('navigate back with ArrowUp', async () => {
      await page.keyboard.press('ArrowUp')
      await expect(selectSignInPage.useDifferentDeviceRadio()).toBeChecked()
    })

    await test.step('tab to Continue and submit with Enter', async () => {
      await tabToElement(page, '.govuk-button')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/scan-qr-code-sign-in-online-banking/)
    })
  })
})
