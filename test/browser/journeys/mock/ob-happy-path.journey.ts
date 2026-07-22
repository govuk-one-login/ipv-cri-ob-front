import type { Page } from '@playwright/test'

import { expect, test } from '../../fixtures'
import { AuthorisePage } from '../../pages/authorise.page'
import { CheckDetailsPage } from '../../pages/check-details.page'
import { ChooseBankPage } from '../../pages/choose-bank.page'
import { ConsentPage } from '../../pages/consent.page'
import { SelectSignInMethodPage } from '../../pages/select-sign-in-method.page'
import { StartPage } from '../../pages/start.page'
import { StubWebhookPage } from '../../pages/stub-webhook.page'

const BANK_VALUE = 'ironforge-vault'

const goToConsent = async (page: Page) => {
  const authorise = new AuthorisePage(page)
  const startPage = new StartPage(page)
  const chooseBankPage = new ChooseBankPage(page)
  const consentPage = new ConsentPage(page)

  await authorise.goto('test-jwt-success')
  await startPage.continue()
  await chooseBankPage.selectBank(BANK_VALUE)
  await chooseBankPage.continue()
  await consentPage.checkConsent()

  return consentPage
}

const transitStubAndAssertSpinner = async (page: Page) => {
  const stubPage = new StubWebhookPage(page)
  const checkDetails = new CheckDetailsPage(page)

  await stubPage.continueToCri()
  await expect(checkDetails.spinnerButton()).toBeVisible()
}

test.describe('Journey: Happy path (desktop)', { tag: ['@mock', '@desktop'] }, () => {
  test('user picks a bank, gives consent, chooses to stay on this device and lands on the check-details spinner', async ({
    page
  }) => {
    const consentPage = await goToConsent(page)
    await consentPage.continue()

    const signInMethod = new SelectSignInMethodPage(page)
    await signInMethod.chooseStayOnThisDevice()
    await signInMethod.continue()

    await transitStubAndAssertSpinner(page)
  })
})

test.describe('Journey: Happy path (mobile)', { tag: ['@mock', '@mobile'] }, () => {
  test('consent redirects directly to the bank stub, bypassing the select-sign-in-method screen', async ({
    page
  }) => {
    const consentPage = await goToConsent(page)
    await consentPage.continue()

    await transitStubAndAssertSpinner(page)
  })
})
