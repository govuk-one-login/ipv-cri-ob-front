import type { Page } from '@playwright/test'

import { expect, runAxe, test } from '../fixtures'
import { activateWithKeyboard, tabToElement } from '../helpers/keyboard'
import { type Language, switchToWelsh } from '../helpers/language'
import { AuthorisePage } from '../pages/authorise.page'
import { ChooseBankPage } from '../pages/choose-bank.page'
import { ConsentPage } from '../pages/consent.page'
import { StartPage } from '../pages/start.page'

import paths from '../../../src/config/paths'

const BANK_LABEL = 'Vault of Ironforge'
const BANK_VALUE = 'ironforge-vault'

const COPY = {
  en: {
    heading: 'Agree to share information from your bank or building society account with Ecospend',
    errorMessage: 'You must agree to share your bank account information to continue',
    primaryButton: 'Continue',
    primaryButtonAlt: /Continue to your bank.s app or website/,
    title: /Agree to share information from your bank or building society account with Ecospend/,
    insetText: 'Ecospend will securely delete your information after the check is complete.',
    secondaryLink: 'Prove your identity another way'
  },
  cy: {
    heading: "Cytuno i rannu gwybodaeth o'ch cyfrif banc neu gymdeithas adeiladu gydag Ecospend",
    errorMessage: 'Rhaid i chi gytuno i rannu gwybodaeth eich cyfrif banc i barhau',
    primaryButton: 'Parhau',
    primaryButtonAlt: /Parhau i ap neu wefan eich banc/,
    title: /Cytuno i rannu gwybodaeth o'ch cyfrif banc neu gymdeithas adeiladu gydag Ecospend/,
    insetText:
      "Bydd Ecospend yn dileu'n ddiogel eich gwybodaeth ar ôl i'r gwiriad gael ei gwblhau.",
    secondaryLink: 'Profi eich hunaniaeth mewn ffordd arall'
  }
}

const navigate = async (page: Page, lang: Language) => {
  const authorise = new AuthorisePage(page)
  const startPage = new StartPage(page)
  const chooseBankPage = new ChooseBankPage(page)

  await authorise.goto('test-jwt-success')
  if (lang === 'cy') await switchToWelsh(page)
  await startPage.continue()
  await chooseBankPage.selectBank(BANK_VALUE)
  await chooseBankPage.continue()

  return new ConsentPage(page)
}

const registerConsentTests = (lang: Language) => {
  let consentPage: ConsentPage

  test.beforeEach(async ({ page }) => {
    consentPage = await navigate(page, lang)
  })

  test('renders the expected page elements in English and Welsh', async ({ page }) => {
    await expect(consentPage.heading()).toContainText(COPY[lang].heading)
    await expect(page).toHaveTitle(COPY[lang].title)
    await expect(consentPage.mainContent()).toContainText(BANK_LABEL)
    await expect(consentPage.consentCheckbox()).toBeVisible()
    await expect(consentPage.continueButton()).toHaveText(COPY[lang].primaryButton)
    await expect(consentPage.proveAnotherWayLink()).toContainText(COPY[lang].secondaryLink)
    await expect(consentPage.backLink()).toHaveAttribute('href', paths.steps.chooseBank)
    await expect(consentPage.insetText()).toContainText(COPY[lang].insetText)
  })

  test('renders form validation errors and links error summary items to inputs', async ({
    page
  }) => {
    await test.step('submitting without consent returns to the page with an error', async () => {
      await consentPage.continue()
      await expect(page).toHaveURL(/\/agree-share-bank-information/)
      await expect(consentPage.errorSummary()).toBeVisible()
      await expect(consentPage.errorMessage()).toContainText(COPY[lang].errorMessage)
      await expect(consentPage.mainContent().locator('p').first()).toContainText(BANK_LABEL)
    })

    await test.step('clicking the error summary link focuses the consent checkbox', async () => {
      await consentPage.errorSummaryLink(COPY[lang].errorMessage).click()
      await expect(consentPage.consentCheckbox()).toBeFocused()
    })
  })
}

const registerConsentMobileTests = (lang: Language) => {
  test('Continue button displays alt copy on mobile', async ({ page }) => {
    const consentPage = await navigate(page, lang)
    await expect(consentPage.continueButton()).toContainText(COPY[lang].primaryButtonAlt)
  })
}

test.describe('Consent (English)', { tag: '@desktop' }, () => {
  registerConsentTests('en')
})

test.describe('Consent (Welsh)', { tag: '@desktop' }, () => {
  registerConsentTests('cy')
})

test.describe('Consent (English) mobile', { tag: '@mobile' }, () => {
  registerConsentMobileTests('en')
})

test.describe('Consent (Welsh) mobile', { tag: '@mobile' }, () => {
  registerConsentMobileTests('cy')
})

test.describe('Consent extras', { tag: '@desktop' }, () => {
  let consentPage: ConsentPage

  test.beforeEach(async ({ page }) => {
    consentPage = await navigate(page, 'en')
  })

  test('passes accessibility checks', async ({ page }) => {
    await runAxe(page)
  })

  test('user can complete the form using the keyboard only', async ({ page }) => {
    await test.step('tab to and check the consent checkbox with Space', async () => {
      await tabToElement(page, '#consent')
      await page.keyboard.press('Space')
      await expect(consentPage.consentCheckbox()).toBeChecked()
    })

    await test.step('tab to Continue and submit with Enter', async () => {
      await activateWithKeyboard(page, '.govuk-button--progress')
      await expect(page).toHaveURL(/\/how-sign-in-bank/)
    })
  })
})
