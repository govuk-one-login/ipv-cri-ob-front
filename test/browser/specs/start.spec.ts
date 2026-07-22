import type { Page } from '@playwright/test'

import { expect, runAxe, test } from '../fixtures'
import { tabToElement } from '../helpers/keyboard'
import { type Language, switchToWelsh } from '../helpers/language'
import { StartPage } from '../pages/start.page'

import paths from '../../../src/config/paths'

const COPY = {
  en: {
    heading: 'Finish proving your identity by signing in to your online banking',
    primaryButton: 'Continue',
    title: /Finish proving your identity by signing in to your online banking/
  },
  cy: {
    heading: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do',
    primaryButton: 'Lorem ipsum',
    title: /Lorem ipsum dolor sit amet consectetur adipiscing elit sed do/
  }
}

const navigate = async (page: Page, lang: Language) => {
  const startPage = new StartPage(page)
  await startPage.goto()
  if (lang === 'cy') await switchToWelsh(page)
  return startPage
}

const registerStartPageTests = (lang: Language) => {
  let startPage: StartPage

  test.beforeEach(async ({ page }) => {
    startPage = await navigate(page, lang)
  })

  test('renders the expected page elements', async ({ page }) => {
    await expect(startPage.heading()).toContainText(COPY[lang].heading)
    await expect(page).toHaveTitle(COPY[lang].title)
    await expect(startPage.continueButton()).toHaveText(COPY[lang].primaryButton)
    await expect(startPage.detailsToggle()).toBeVisible()
    await expect(startPage.proveAnotherWayLink()).toBeVisible()
  })
}

test.describe('Start page (English)', { tag: '@desktop' }, () => {
  registerStartPageTests('en')
})

test.describe('Start page (Welsh)', { tag: '@desktop' }, () => {
  registerStartPageTests('cy')
})

test.describe('Start page extras', { tag: '@desktop' }, () => {
  let startPage: StartPage

  test.beforeEach(async ({ page }) => {
    startPage = await navigate(page, 'en')
  })

  test('passes accessibility checks', async ({ page }) => {
    await runAxe(page)
  })

  test('details toggle expands additional info', async () => {
    await startPage.openDetails()
    await expect(startPage.detailsWrapper()).toHaveAttribute('open')
    await expect(startPage.detailsBody()).toContainText(/Banks have very strong security/)
  })

  test('privacy notice link opens in a new tab', async ({ page }) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      startPage.privacyNoticeLink().click()
    ])
    await expect(popup).toHaveURL(
      'https://www.gov.uk/government/publications/govuk-one-login-privacy-notice'
    )
  })

  test('Financial Conduct Authority link opens in a new tab', async ({ page }) => {
    const [popup] = await Promise.all([page.waitForEvent('popup'), startPage.fcaLink().click()])
    await expect(popup).toHaveURL('https://register.fca.org.uk/s/firm?id=0010X00004KSo9HQAT')
  })

  test('keyboard navigation from details toggle onwards to Prove another way', async ({ page }) => {
    await test.step('open the details summary with Enter', async () => {
      await tabToElement(page, 'details summary')
      await page.keyboard.press('Enter')
      await expect(startPage.detailsWrapper()).toHaveAttribute('open', '')
    })

    await test.step('tab onwards to the Prove another way link', async () => {
      await tabToElement(page, `a.govuk-link[href="${paths.steps.proveAnotherWay}"]`)
      await expect(startPage.proveAnotherWayLink()).toBeFocused()
    })
  })

  test('user can tab to the Continue link and activate it with Enter', async ({ page }) => {
    await tabToElement(page, 'a.govuk-button')
    await page.keyboard.press('Enter')
    await expect(page).not.toHaveURL(/\/finish-proving-identity-online-banking/)
  })
})
