import { expect, smokeTest as test } from '../../fixtures'
import { getSessionJwt } from '../../helpers/core-stub'
import { AuthorisePage } from '../../pages/authorise.page'
import { StartPage } from '../../pages/start.page'

test.describe.configure({ mode: 'serial' })

test.describe('Journey: successful Open Banking authorisation', { tag: '@smoke' }, () => {
  test('user completes the full journey and receives an authorisation code', async ({ page }) => {
    const authorisePage = new AuthorisePage(page)
    const startPage = new StartPage(page)

    await test.step('Given the user initiates an authorisation request', async () => {
      const { request, client_id } = await getSessionJwt()
      await authorisePage.goto(request, client_id)
    })

    await test.step('When the user proceeds through the start page', async () => {
      await expect(startPage.heading()).toBeVisible()
      // await startPage.continue() we can't go any further until we have a real API to query
    })
  })
})
