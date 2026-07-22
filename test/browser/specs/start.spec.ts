import { expect, runAxe, desktopTest as test } from '../fixtures'
import { tabToElement } from '../helpers/keyboard'
import { StartPage } from '../pages/start.page'

import paths from '../../../src/config/paths'

test.describe('Start page', () => {
  let startPage: StartPage

  test.beforeEach(async ({ page }) => {
    startPage = new StartPage(page)
    await startPage.goto()
  })

  test('renders the expected page elements', async ({ page }) => {
    await expect(startPage.heading()).toContainText(
      'Finish proving your identity by signing in to your online banking'
    )
    await expect(page).toHaveTitle(
      /Finish proving your identity by signing in to your online banking/
    )
    await expect(startPage.continueButton()).toBeVisible()
    await expect(startPage.detailsToggle()).toBeVisible()
    await expect(startPage.proveAnotherWayLink()).toBeVisible()

    await runAxe(page)
  })

  test('clicking the "How does online banking prove my identity?" toggle expands additional info', async () => {
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

  test.describe('Keyboard navigation', () => {
    test('user can toggle the details summary and tab to the Prove another way link', async ({
      page
    }) => {
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
})
