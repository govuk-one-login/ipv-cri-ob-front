import { expect, desktopTest as test } from '../../fixtures'
import { AuthorisePage } from '../../pages/authorise.page'
import { CallbackPage } from '../../pages/callback.page'
import { StartPage } from '../../pages/start.page'

test.describe.configure({ mode: 'serial' })

test.describe('Journey: all banks offline', { tag: '@mock' }, () => {
  test('user is diverted through prove-another-way and returned to the client callback', async ({
    page
  }) => {
    const authorise = new AuthorisePage(page)
    const start = new StartPage(page)
    const callback = new CallbackPage(page)

    await test.step('Given the user initiates an authorisation request where all banks are offline', async () => {
      await authorise.goto('test-jwt-all-banks-offline')
    })

    await test.step('When the user lands on the start page and continues', async () => {
      await expect(page).toHaveURL(/\/finish-proving-identity-online-banking/)
      await start.continue()
    })

    await test.step('Then the user is returned to the client callback with an access_denied error', async () => {
      await callback.awaitCompletion()
      const params = callback.searchParams()
      expect(params.get('error')).toBe('access_denied')
      expect(params.get('error_description')).toBe('Authorization permission denied')
      expect(params.get('code')).toBeNull()
    })
  })
})
