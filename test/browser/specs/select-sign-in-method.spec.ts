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
    radioOne: 'Use your phone or tablet and scan a QR code',
    hintOne: 'You can use your bank’s app or mobile website to prove your identity.',
    radioTwo: 'Stay on this device and use your bank’s website',
    hintTwo: 'When you continue, you’ll be sent to your bank’s website.'
  },
  cy: {
    heading: "Sut ydych chi eisiau mewngofnodi i'ch bancio ar-lein?",
    title: /Sut ydych chi eisiau mewngofnodi i'ch bancio ar-lein\?/,
    errorMessage: "Dewiswch sut ydych chi eisiau mewngofnodi i'ch bancio ar-lein",
    primaryButton: 'Parhau',
    radioOne: 'Defnyddiwch eich ffôn neu dabled a sganiwch y cod QR',
    hintOne: 'Gallwch ddefnyddio ap eich banc neu wefan symudol i brofi eich hunaniaeth.',
    radioTwo: 'Aros ar y ddyfais hon a defnyddio gwefan eich banc',
    hintTwo: 'Pan fyddwch yn parhau, cewch eich anfon at wefan eich banc.'
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

const registerSelectSignInMethodTests = (lang: Language) => {
  let selectSignInPage: SelectSignInMethodPage

  test.beforeEach(async ({ page }) => {
    selectSignInPage = await navigate(page, lang)
  })

  test('renders the expected page elements in English and Welsh', async ({ page }) => {
    await expect(selectSignInPage.heading()).toContainText(COPY[lang].heading)
    await expect(page).toHaveTitle(COPY[lang].title)
    await expect(selectSignInPage.useDifferentDeviceRadio()).toBeVisible()
    await expect(selectSignInPage.useDifferentDeviceRadio()).toHaveAccessibleName(
      COPY[lang].radioOne
    )
    await expect(selectSignInPage.useDifferentDeviceRadio()).toHaveAccessibleDescription(
      COPY[lang].hintOne
    )
    await expect(selectSignInPage.stayOnThisDeviceRadio()).toBeVisible()
    await expect(selectSignInPage.stayOnThisDeviceRadio()).toHaveAccessibleName(COPY[lang].radioTwo)
    await expect(selectSignInPage.stayOnThisDeviceRadio()).toHaveAccessibleDescription(
      COPY[lang].hintTwo
    )
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
  registerSelectSignInMethodTests('en')
})

test.describe('Select sign in method (Welsh)', { tag: '@desktop' }, () => {
  registerSelectSignInMethodTests('cy')
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
