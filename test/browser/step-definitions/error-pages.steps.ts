import { test } from '../fixtures'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Then } = createBdd(test)

Then('the GOV.UK homepage link is present', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Go to the GOV.UK homepage' })).toHaveAttribute(
    'href',
    'https://www.gov.uk/'
  )
})

Then('the One Login contact link is present', async ({ page }) => {
  await expect(
    page.getByRole('link', { name: 'Contact the GOV.UK One Login team (opens in a new tab)' })
  ).toHaveAttribute('href', 'https://home.account.gov.uk/contact-gov-uk-one-login')
})

Then('the Welsh GOV.UK homepage link is present', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Ewch i hafan GOV.UK' })).toHaveAttribute(
    'href',
    'https://www.gov.uk/'
  )
})

Then('the Welsh One Login contact link is present', async ({ page }) => {
  await expect(
    page.getByRole('link', {
      name: "Cysylltwch â'r tîm GOV.UK One Login (agor mewn tab newydd)"
    })
  ).toHaveAttribute('href', 'https://home.account.gov.uk/contact-gov-uk-one-login')
})
