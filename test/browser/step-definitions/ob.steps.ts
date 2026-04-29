import { mockTest } from '../fixtures'
import { AuthorisePage } from '../pages/authorise.page'
import { CallbackPage } from '../pages/callback.page'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, Then, When } = createBdd(mockTest)

Given(
  'the user initiates an authorisation request with {string}',
  async ({ jwt, page }, value: string) => {
    jwt.value = value
    await new AuthorisePage(page).goto(value)
  }
)

When('the Open Banking callback is processed', async ({ page }) => {
  await new CallbackPage(page).goto()
})

Then(
  'an authorisation code {string} and state {string} are returned to the client',
  ({ page }, code: string, state: string) => {
    const params = new CallbackPage(page).searchParams()
    expect(params.get('code')).toBe(code)
    expect(params.get('state')).toBe(state)
  }
)

Then(
  'an {string} error with description {string} is returned',
  ({ page }, error: string, description: string) => {
    const params = new CallbackPage(page).searchParams()
    expect(params.get('error')).toBe(error)
    expect(params.get('error_description')).toBe(description)
  }
)

Then('the session API was called with the JWT', async ({ jwt, wiremock }) => {
  await wiremock.verify('/session', 'POST')
  const sessionRequest = await wiremock.getRequest('/session', 'POST')
  expect((JSON.parse(sessionRequest.body) as { request: string }).request).toBe(jwt.value)
})

Then(
  'the authorisation API was called with the correct session ID {string}',
  async ({ wiremock }, sessionId: string) => {
    await wiremock.verify('/authorization', 'GET')
    const authRequest = await wiremock.getRequest('/authorization', 'GET')
    expect(authRequest.headers['session_id']).toBe(sessionId)
  }
)
