import type { Page } from '@playwright/test'

import { desktopTest, expect, mobileTest, runAxe } from '../fixtures'
import { tabToElement } from '../helpers/keyboard'
import { AuthorisePage } from '../pages/authorise.page'
import { ChooseBankPage } from '../pages/choose-bank.page'
import { ConsentPage } from '../pages/consent.page'

import paths from '../../../src/config/paths'

const BANK_LABEL = 'Vault of Ironforge'
const BANK_VALUE = 'ironforge-vault'

const navigate = async (page: Page, buttonText: string = 'Continue') => {
  const authorise = new AuthorisePage(page)
  const chooseBankPage = new ChooseBankPage(page)

  await authorise.goto('test-jwt-success')
  await page.getByRole('button', { name: buttonText }).click()
  await chooseBankPage.selectBank(BANK_VALUE)
  await chooseBankPage.continueButton(buttonText).click()
}

desktopTest.describe('Consent (English)', () => {
  let consentPage: ConsentPage

  desktopTest.beforeEach(async ({ page }) => {
    consentPage = new ConsentPage(page)
    await navigate(page)
  })

  desktopTest(
    'bank friendly name is present in the copy and preserved after a validation error',
    async ({ page }) => {
      await expect(consentPage.mainContent()).toContainText(BANK_LABEL)

      await consentPage.continue()

      await expect(page).toHaveURL(/\/agree-share-bank-information$/)
      await expect(consentPage.errorSummary()).toBeVisible()
      await expect(consentPage.errorMessage()).toContainText(
        'You must agree to share your bank account information to continue'
      )
      await expect(consentPage.mainContent().locator('p').first()).toContainText(BANK_LABEL)
      await expect(consentPage.backLink()).toHaveAttribute('href', paths.steps.chooseBank)

      await runAxe(page)
    }
  )

  desktopTest.describe('Keyboard navigation', () => {
    desktopTest(
      'user can check consent and tab onwards to the alternate route link',
      async ({ page }) => {
        await desktopTest.step('tab to and check the consent checkbox with Space', async () => {
          await tabToElement(page, '#consent')
          await page.keyboard.press('Space')
          await expect(consentPage.consentCheckbox()).toBeChecked()
        })

        await desktopTest.step('tab onwards to the Prove another way link', async () => {
          await tabToElement(page, `a.govuk-link[href="${paths.steps.proveAnotherWay}"]`)
          await expect(consentPage.proveAnotherWayLink()).toBeFocused()
        })
      }
    )

    desktopTest(
      'activating the error summary link focuses the consent checkbox',
      async ({ page }) => {
        await desktopTest.step('submit the form to surface the error summary', async () => {
          await tabToElement(page, '.govuk-button--progress')
          await page.keyboard.press('Enter')
          await expect(consentPage.errorSummary()).toBeVisible()
        })

        await desktopTest.step('tab to and activate the error summary link', async () => {
          await tabToElement(page, '.govuk-error-summary a')
          await page.keyboard.press('Enter')
          await expect(consentPage.consentCheckbox()).toBeFocused()
        })
      }
    )
  })
})

mobileTest.describe('Consent (English) mobile', () => {
  mobileTest(
    'Continue button on the consent page displays alt copy on mobile',
    async ({ page }) => {
      const consentPage = new ConsentPage(page)
      await navigate(page, 'Continue')

      await expect(consentPage.mobileContinueButton()).toBeVisible()
    }
  )
})

desktopTest.describe('Consent (Welsh)', () => {
  let consentPage: ConsentPage

  desktopTest.beforeEach(async ({ page }) => {
    consentPage = new ConsentPage(page)
    await navigate(page)
    await page.getByRole('link', { name: 'Cymraeg' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'cy')
  })

  desktopTest(
    'bank friendly name is present in the copy and preserved after a validation error',
    async ({ page }) => {
      await expect(consentPage.mainContent()).toContainText(BANK_LABEL)

      await consentPage.continueButton('Parhau').click()

      await expect(page).toHaveURL(/\/agree-share-bank-information/)
      await expect(consentPage.errorSummary()).toBeVisible()
      await expect(consentPage.errorMessage()).toContainText(
        'Ut labore et dolore magna aliqua ut enim ad minim veniam'
      )
      await expect(consentPage.mainContent().locator('p').first()).toContainText(BANK_LABEL)
      await expect(page.getByRole('link', { exact: true, name: 'Yn ôl' })).toHaveAttribute(
        'href',
        paths.steps.chooseBank
      )
    }
  )
})

mobileTest.describe('Consent (Welsh) mobile', () => {
  mobileTest(
    'Continue button on the consent page displays alt copy on mobile',
    async ({ page }) => {
      await navigate(page)
      await page.getByRole('link', { name: 'Cymraeg' }).click()
      await expect(page.locator('html')).toHaveAttribute('lang', 'cy')
      await expect(
        page.getByRole('button', { name: /Maecenas dignissim tempus est/ })
      ).toBeVisible()
    }
  )
})
