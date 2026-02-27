import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, Then, When } = createBdd()

Given('I navigate to the app', async ({ page }) => {
  await page.goto('/')
})

Then('I should see the cookie banner', async ({ page }) => {
  await expect(page.locator('#cookies-banner-main')).toBeVisible()
})

When('I accept additional cookies', async ({ page }) => {
  await page.getByRole('button', { name: 'Accept additional cookies' }).click()
})

Then('the cookie preference should be saved', async ({ page }) => {
  const cookies = await page.context().cookies()
  const pref = cookies.find((c) => c.name === 'cookies_preferences_set')
  expect(pref).toBeDefined()
  expect(JSON.parse(decodeURIComponent(pref!.value))).toMatchObject({ analytics: true })
})
