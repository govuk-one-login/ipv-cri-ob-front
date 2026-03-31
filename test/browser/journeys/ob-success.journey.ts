import { expect, test } from '../fixtures'
import { useJourneySetup } from '../helpers/journey-setup'
import { AuthorisePage } from '../pages/authorise.page'
import { CallbackPage } from '../pages/callback.page'
import { wiremock } from '../wiremock'

test.use({ skipAxe: true })

useJourneySetup()

test.describe('Journey: successful Open Banking authorisation', () => {
  test('user completes the full journey and receives an authorisation code', async ({ page }) => {
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
  })
})
