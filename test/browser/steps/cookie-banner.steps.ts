import { expect } from '@playwright/test'
import { Given, Then, When } from '../fixtures'

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

Then('the "You\'ve accepted additional cookies" banner is visible', async ({ page }) => {
  await expect(page.locator('#cookies-accepted')).toBeVisible()
  await expect(page.locator('#cookies-accepted')).toContainText(
    "You've accepted additional cookies."
  )
})
