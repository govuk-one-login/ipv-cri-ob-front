import { expect, test } from '../fixtures'
import { StartPage } from '../pages/start.page'

test.describe('Start page', () => {
  let startPage: StartPage

  test.beforeEach(async ({ page }) => {
    startPage = new StartPage(page)
    await startPage.goto()
  })

  test('user is directed to the Start Page with correct Title and Continue Button', async ({
    page
  }) => {
    await expect(page.locator('h1')).toContainText(
      'Finish proving your identity by signing in to your online banking'
    )
    await expect(page).toHaveTitle(
      /Finish proving your identity by signing in to your online banking/
    )
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  test('user is displayed with the How does online banking prove my identity? Drop down', async ({
    page
  }) => {
    await expect(page.locator('details summary')).toBeVisible()
  })

  test('user clicks the How does online banking prove my identity? dropdown and additional information is displayed', async ({
    page
  }) => {
    await startPage.openDetails()

    await expect(page.locator('details')).toHaveAttribute('open')
    await expect(page.locator('details .govuk-details__text')).toContainText(
      /Banks have very strong security/
    )
  })

  test('user clicks the Our privacy notice link and is directed to the correct page in a new tab', async ({
    page
  }) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      startPage.privacyNoticeLink().click()
    ])

    await expect(popup).toHaveURL(
      'https://www.gov.uk/government/publications/govuk-one-login-privacy-notice'
    )
  })

  test('user clicks the Financial Conduct Authority link and is directed to the correct page in a new tab', async ({
    page
  }) => {
    const [popup] = await Promise.all([page.waitForEvent('popup'), startPage.fcaLink().click()])

    await expect(popup).toHaveURL('https://register.fca.org.uk/s/firm?id=0010X00004KSo9HQAT')
  })

  test('user is displayed with the the Prove your identity another way link', async () => {
    await expect(startPage.proveAnotherWayLink()).toBeVisible()
  })
})
