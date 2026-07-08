import { expect, smokeTest as test } from '../../fixtures'
import { getSessionJwt } from '../../helpers/core-stub'
import { ChooseBankPage } from '../../pages/choose-bank.page'
import { ConsentPage } from '../../pages/consent.page'
import { StartPage } from '../../pages/start.page'

test.describe.configure({ mode: 'serial' })
test.use({ skipAxe: true })

test.describe('Journey: successful Open Banking authorisation', { tag: '@smoke' }, () => {
  test('user completes the full journey and receives an authorisation code', async ({ page }) => {
    const start = new StartPage(page)
    const chooseBank = new ChooseBankPage(page)
    const consent = new ConsentPage(page)

    await test.step('Given the user initiates an authorisation request', async () => {
      const { request, client_id } = await getSessionJwt()
      await page.goto(`/oauth2/authorize?client_id=${client_id}&request=${request}`)
    })

    await test.step('When the user proceeds through the start page', async () => {
      await expect(page.locator('h1')).toBeVisible()
      await start.continue()
    })

    await test.step('And selects the first available bank and continues', async () => {
      await page.locator('#bank-select').waitFor()
      await page.locator('#bank-select').selectOption({ index: 1 })
      await chooseBank.continue()
    })

    await test.step('And agrees to share bank information', async () => {
      await consent.checkConsent()
      await consent.continue()
    })

    await test.step('And the stub sends consent and account assessment webhooks', async () => {
      await expect(page).toHaveURL(/stubs\/webhook/)
      await page.getByRole('button', { name: 'Send consent webhook' }).click()
      await expect(page).toHaveURL(/stubs\/webhook/)
      await page.getByRole('button', { name: 'Send account assessment webhook' }).click()
      await expect(page).toHaveURL(/stubs\/webhook/)
    })
  })
})
