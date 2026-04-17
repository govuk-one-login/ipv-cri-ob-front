import { expect, mockTest as test } from '../../fixtures'
import { AuthorisePage } from '../../pages/authorise.page'
import { CallbackPage } from '../../pages/callback.page'

test.describe.configure({ mode: 'serial' })
test.use({ skipAxe: true })

test.describe('Journey: failed Open Banking authorisation', { tag: '@mock' }, () => {
  test('user is returned an access denied error when authorisation is rejected', async ({
    page,
    wiremock
  }) => {
    const authorise = new AuthorisePage(page)
    const callback = new CallbackPage(page)

    await test.step('Given the user initiates an authorisation request that will be rejected', async () => {
      await authorise.goto('test-jwt-error')
    })

    await test.step('When the Open Banking callback is processed', async () => {
      await callback.goto()
    })

    await test.step('Then an access_denied error is returned to the client', () => {
      const params = callback.searchParams()
      expect(params.get('error')).toBe('access_denied')
      expect(params.get('error_description')).toBe('Authorization permission denied')
    })

    await test.step('And the correct API calls were made with the expected session context', async () => {
      await wiremock.verify('/session', 'POST')
      await wiremock.verify('/authorization', 'GET')

      const sessionRequest = await wiremock.getRequest('/session', 'POST')
      expect((JSON.parse(sessionRequest.body) as { request: string }).request).toBe(
        'test-jwt-error'
      )

      const authRequest = await wiremock.getRequest('/authorization', 'GET')
      expect(authRequest.headers['session_id']).toBe('8BADF00D')
    })
  })
})
