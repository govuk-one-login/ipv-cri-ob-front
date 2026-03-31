import { expect } from '@playwright/test'
import { Then, When } from '../fixtures'

When('I select Welsh', async ({ page }) => {
  await page.getByRole('link', { name: 'Cymraeg' }).click()
})

Then('the page should be displayed in Welsh', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'cy')
  const cookies = await page.context().cookies()
  const pref = cookies.find((c) => c.name === 'lng')
  expect(pref).toBeDefined()
  await expect(page.locator('.govuk-heading-l')).toContainText(
    'Cyhoeddwr Cymwysterau Bancio Agored'
  )
  await expect(page).toHaveTitle('Cyhoeddwr Cymwysterau Bancio Agored – GOV.UK One Login')
})
