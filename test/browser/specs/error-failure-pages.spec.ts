import { expect, test } from '../fixtures'

import paths from '../constants'

test.describe('Error and failure pages', () => {
  test.use({ skipConsoleErrors: true })

  test('navigating to a non-existent route shows the 404 page', async ({ page }) => {
    await page.goto(paths.error404)

    await expect(page.locator('h1')).toContainText('Page not found')
    await expect(page).toHaveTitle(/Page not found/)
    await expect(page.getByRole('link', { name: 'Go to the GOV.UK homepage' })).toHaveAttribute(
      'href',
      'https://www.gov.uk/'
    )
    await expect(
      page.getByRole('link', { name: 'Contact the GOV.UK One Login team (opens in a new tab)' })
    ).toHaveAttribute('href', 'https://home.account.gov.uk/contact-gov-uk-one-login')
  })

  test('accessing a step requiring session data without a session redirects to the start page', async ({
    page
  }) => {
    await page.goto(paths.steps.consent)

    await expect(page).toHaveURL(new RegExp(paths.steps.start))
  })

  test('accessing the consent page without selecting a bank redirects to choose-bank', async ({
    page
  }) => {
    await page.goto(paths.steps.start)
    const toChooseBank = page.waitForURL(`**${paths.steps.chooseBank}`)
    await page.getByRole('button', { name: 'Continue' }).click()
    await toChooseBank

    await page.goto(paths.steps.consent)

    await expect(page).toHaveURL(new RegExp(paths.steps.chooseBank))
  })
})
