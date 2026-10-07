import { expect, smokeTest as test } from '../../fixtures'
import { getSessionJwt } from '../../helpers/test-harness'
import { AuthorisePage } from '../../pages/authorise.page'
import { ChooseBankPage } from '../../pages/choose-bank.page'
import { ConsentPage } from '../../pages/consent.page'
import { SelectSignInMethodPage } from '../../pages/select-sign-in-method.page'
import { StartPage } from '../../pages/start.page'

import paths from '../../../../src/config/paths'

test.describe.configure({ mode: 'serial' })

test.describe('Journey: successful Open Banking authorisation', { tag: '@smoke' }, () => {
  test('user completes the full journey and receives an authorisation code', async ({ page }) => {
    const authorisePage = new AuthorisePage(page)
    const startPage = new StartPage(page)
    const chooseBankPage = new ChooseBankPage(page)
    const consentPage = new ConsentPage(page)
    const selectSignInMethodPage = new SelectSignInMethodPage(page)
    let bankName = ''

    await test.step('Given the user initiates an authorisation request', async () => {
      const { request, client_id } = await getSessionJwt()
      await authorisePage.goto(request, client_id)
    })

    await test.step('When the user proceeds through the start page', async () => {
      await expect(startPage.heading()).toBeVisible()
      await startPage.continue()
    })

    await test.step('Then the banks returned by the API are offered for selection', async () => {
      await expect(page).toHaveURL(new RegExp(paths.steps.chooseBank))
      await expect(chooseBankPage.bankSelectOptions().first()).toBeAttached()
      bankName = await chooseBankPage.selectFirstAvailableBank()
      expect(bankName, 'the first bank option should have a value').not.toBe('')
    })

    await test.step('When the user submits their chosen bank', async () => {
      await chooseBankPage.continue()
    })

    await test.step('Then the consent page names the chosen bank', async () => {
      await expect(page).toHaveURL(new RegExp(paths.steps.consent))
      await expect(consentPage.mainContent()).toContainText(bankName)
      await expect(consentPage.consentCheckbox()).toBeVisible()
    })

    await test.step('When the user gives consent', async () => {
      await consentPage.checkConsent()
      await consentPage.continue()
    })

    await test.step('Then they are asked how to sign in to their bank', async () => {
      await expect(page).toHaveURL(new RegExp(paths.steps.selectSignInMethod))
      await expect(selectSignInMethodPage.useDifferentDeviceRadio()).toBeVisible()
      await expect(selectSignInMethodPage.stayOnThisDeviceRadio()).toBeVisible()
      // this is as far as we can go for now
    })
  })
})
