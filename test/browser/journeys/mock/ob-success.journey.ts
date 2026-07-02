import type { wiremock as wiremockAdmin } from '../../wiremock/admin'
import type { Page } from '@playwright/test'

import { expect, mockTest as test } from '../../fixtures'
import { AuthorisePage } from '../../pages/authorise.page'
import { CallbackPage } from '../../pages/callback.page'

test.describe.configure({ mode: 'serial' })
test.use({ skipAxe: true })

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const journey = async ({ page, wiremock }: { page: Page; wiremock: typeof wiremockAdmin }) => {
  const authorise = new AuthorisePage(page)
  const callback = new CallbackPage(page)

  await test.step('Given the user initiates an authorisation request', async () => {
    await authorise.goto('test-jwt-success')
  })

  await test.step('When the Open Banking callback is processed', async () => {
    await callback.goto()
  })

  await test.step('Then an authorisation code and state are returned to the client', () => {
    const params = callback.searchParams()
    expect(params.get('code')).toBe('DEADBEEF')
    expect(params.get('state')).toBe('sT@t3')
  })

  await test.step('And the correct API calls were made with the expected session context', async () => {
    await wiremock.verify('/session', 'POST')
    await wiremock.verify('/authorization', 'GET')

    const sessionRequest = await wiremock.getRequest('/session', 'POST')
    expect((JSON.parse(sessionRequest.body) as { request: string }).request).toBe(
      'test-jwt-success'
    )

    const authRequest = await wiremock.getRequest('/authorization', 'GET')
    expect(authRequest.headers['session_id']).toBe('CAFEBABE')
  })
}

test.describe('Journey: successful Open Banking authorisation (desktop)', { tag: '@mock' }, () => {
  test.use({ userAgent: DESKTOP_USER_AGENT })

  test('user completes the full journey and receives an authorisation code', journey)
})

test.describe('Journey: successful Open Banking authorisation (mobile)', { tag: '@mock' }, () => {
  test.use({ userAgent: MOBILE_USER_AGENT })

  test('user completes the full journey and receives an authorisation code', journey)
})
