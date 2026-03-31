import { expect } from '@playwright/test'
import { Before, Then, When } from '../fixtures'
import { wiremock } from '../wiremock'

Before(async () => {
  await wiremock.resetScenarios()
})

When('I start the Open Banking journey', async ({ page }) => {
  await page.goto('/oauth2/authorize?client_id=test-client&request=test-jwt-success')
})

When('I start the Open Banking journey with an error', async ({ page }) => {
  await page.goto('/oauth2/authorize?client_id=test-client&request=test-jwt-error')
})

When('I return to the app after completing the bank interaction', async ({ page }) => {
  await page.goto('/oauth2/callback')
})

When('I return to the app after an unsuccessful bank interaction', async ({ page }) => {
  await page.goto('/oauth2/callback')
})

Then('I should be redirected with an authorization code', ({ page }) => {
  const url = new URL(page.url())
  expect(url.searchParams.get('code')).toBe('DEADBEEF')
  expect(url.searchParams.get('state')).toBe('sT@t3')
})

Then('I should be redirected with an access denied error', ({ page }) => {
  const url = new URL(page.url())
  expect(url.searchParams.get('error')).toBe('access_denied')
  expect(url.searchParams.get('error_description')).toBe('Authorization permission denied')
})
