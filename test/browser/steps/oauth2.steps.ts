import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Before, Then, When } = createBdd()

Before(async ({ $tags }) => {
  const wireMockUrl = process.env['WIREMOCK_URL']
  const isErrorPath = $tags.includes('@error-path')

  await Promise.all([
    fetch(`${wireMockUrl}/__reset/ob-success`),
    fetch(`${wireMockUrl}/__reset/ob-error`)
  ])

  const scenarioToDeactivate = isErrorPath ? 'ob-success' : 'ob-error'
  const res = await fetch(`${wireMockUrl}/__admin/scenarios/${scenarioToDeactivate}/state`, {
    body: JSON.stringify({ state: 'SessionCreated' }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT'
  })
  if (!res.ok) throw new Error(`Failed to set scenario state: ${res.status} ${await res.text()}`)
})

When('I start the Open Banking journey', async ({ page }) => {
  await page.goto('/oauth2/authorize?client_id=test-client&request=test-jwt')
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
