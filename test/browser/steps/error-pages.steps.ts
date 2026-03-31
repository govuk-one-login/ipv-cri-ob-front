import { expect } from '@playwright/test'
import { Then, When } from '../fixtures'

When('I navigate to a page that does not exist', async ({ page }) => {
  await page.goto('/this-page-does-not-exist')
})

Then('I should see the Welsh page not found page', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('Tudalen heb ei darganfod')
  await expect(page).toHaveTitle(/Tudalen heb ei darganfod/)
  await expect(page.getByRole('link', { name: 'Ewch i hafan GOV.UK' })).toHaveAttribute(
    'href',
    'https://www.gov.uk/'
  )
  await expect(
    page.getByRole('link', { name: "Cysylltwch â'r tîm GOV.UK One Login (agor mewn tab newydd)" })
  ).toHaveAttribute('href', 'https://home.account.gov.uk/contact-gov-uk-one-login')
})

Then('I should see the page not found page', async ({ page }) => {
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
