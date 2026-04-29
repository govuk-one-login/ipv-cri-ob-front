import { test } from '../fixtures'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Then, When } = createBdd(test)

When('they accept additional cookies', async ({ page }) => {
  await page.getByRole('button', { name: 'Accept additional cookies' }).click()
})

Then('the cookies preferences cookie is set with analytics true', async ({ page }) => {
  const cookies = await page.context().cookies()
  const pref = cookies.find((c) => c.name === 'cookies_preferences_set')
  expect(pref).toBeDefined()
  expect(JSON.parse(decodeURIComponent(pref!.value))).toMatchObject({ analytics: true })
})

Then('the cookies accepted banner is visible', async ({ page }) => {
  await expect(page.locator('#cookies-accepted')).toBeVisible()
  await expect(page.locator('#cookies-accepted')).toContainText(
    "You've accepted additional cookies."
  )
})
