import { expect, desktopTest as test } from '../../fixtures'
import { AuthorisePage } from '../../pages/authorise.page'
import { CallbackPage } from '../../pages/callback.page'
import { StartPage } from '../../pages/start.page'

test.describe.configure({ mode: 'serial' })

test.describe(
  'Journey: prove your identity another way (abort from start page)',
  { tag: '@mock' },
  () => {
    test('user aborts the journey from the start page and is redirected to the callback', async ({
      page,
      wiremock
    }) => {
      const authorise = new AuthorisePage(page)
      const start = new StartPage(page)
      const callback = new CallbackPage(page)

      await test.step('Given the user initiates an authorisation request', async () => {
        await authorise.goto('test-jwt-prove-another-way')
      })

      await test.step('Then the user lands on the start page', async () => {
        await expect(page).toHaveURL(/\/finish-proving-identity-online-banking/)
      })

      await test.step('When the user clicks Prove your identity another way', async () => {
        await start.proveAnotherWayLink().click()
      })

      await test.step('Then the user is returned to the client callback with an access_denied error', async () => {
        await callback.awaitCompletion()
        const params = callback.searchParams()
        expect(params.get('error')).toBe('access_denied')
        expect(params.get('error_description')).toBe('Authorization permission denied')
        expect(params.get('code')).toBeNull()
      })

      await test.step('And the correct API calls were made', async () => {
        await wiremock.verify('/session', 'POST')
        await wiremock.verify('/authorization', 'GET')

        const sessionRequest = await wiremock.getRequest('/session', 'POST')
        expect((JSON.parse(sessionRequest.body) as { request: string }).request).toBe(
          'test-jwt-prove-another-way'
        )

        const authRequest = await wiremock.getRequest('/authorization', 'GET')
        expect(authRequest.headers['session_id']).toBe('ABAD1DEA')
      })
    })
  }
)
