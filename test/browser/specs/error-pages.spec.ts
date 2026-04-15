import { expect, test } from '../fixtures'
import { navigateToApp, selectWelsh } from '../helpers/navigation'

test.describe('Error pages', () => {
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
  })

  test('404 page is displayed in Welsh when Welsh is selected', async ({ page }) => {
    await navigateToApp(page)
    await selectWelsh(page)
    await page.goto('/this-page-does-not-exist')

    await expect(page.locator('h1')).toContainText('Tudalen heb ei darganfod')
    await expect(page).toHaveTitle(/Tudalen heb ei darganfod/)
    await expect(page.getByRole('link', { name: 'Ewch i hafan GOV.UK' })).toHaveAttribute(
      'href',
      'https://www.gov.uk/'
    )
    await expect(
      page.getByRole('link', {
        name: "Cysylltwch â'r tîm GOV.UK One Login (agor mewn tab newydd)"
      })
    ).toHaveAttribute('href', 'https://home.account.gov.uk/contact-gov-uk-one-login')
  })
})
