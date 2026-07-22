import { expect, runAxe, test } from '../fixtures'

import paths from '../../../src/config/paths'

test.describe('Error and failure pages', { tag: '@desktop' }, () => {
  test.use({ skipConsoleErrors: true })

  test('navigating to a non-existent route shows the 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')

    await expect(page.locator('h1')).toContainText('Page not found')
    await expect(page).toHaveTitle(/Page not found/)
    await expect(page.getByRole('link', { name: 'Go to the GOV.UK homepage' })).toHaveAttribute(
      'href',
      'https://www.gov.uk/'
    )
    await expect(
      page.getByRole('link', { name: 'Contact the GOV.UK One Login team (opens in a new tab)' })
    ).toHaveAttribute('href', 'https://home.account.gov.uk/contact-gov-uk-one-login')

    await runAxe(page)
  })

  test('accessing choose-bank without a session shows the generic error page', async ({ page }) => {
    await page.goto(paths.steps.start)
    await page.goto(paths.steps.chooseBank)

    await expect(page.locator('h1')).toContainText('Sorry, there is a problem')
    await expect(page).toHaveTitle(/Sorry, there is a problem/)
    await runAxe(page)
  })

  test('accessing a page out of sequence redirects to the current page', async ({ page }) => {
    await page.goto(paths.steps.start)
    await page.goto(paths.steps.selectSignInMethod)

    await expect(page).toHaveURL(/\/finish-proving-identity-online-banking/)
  })
})
