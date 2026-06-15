import type { Page } from '@playwright/test'

import { navigateAndWait, waitForElement } from './wait-strategies'

export const navigateToRoot = (page: Page) => page.goto('/')

export const selectWelsh = (page: Page) => page.getByRole('link', { name: 'Cymraeg' }).click()

export const navigateToChooseBank = async (page: Page) => {
  await page.goto('/finish-proving-identity-online-banking')

  const continueButton = page.getByRole('button', { name: 'Continue' })
  await waitForElement(continueButton)

  await navigateAndWait(page, () => continueButton.click(), '**/choose-bank')

  // Ensure bank select is ready
  await waitForElement(page.locator('#bank-select'))
}

export const navigateToConsent = async (page: Page) => {
  await navigateToChooseBank(page)

  const bankSelect = page.locator('#bank-select')
  await waitForElement(bankSelect)
  await bankSelect.selectOption('ironforge-vault')

  const continueButton = page.getByRole('button', { name: 'Continue' })
  await waitForElement(continueButton)

  await navigateAndWait(page, () => continueButton.click(), '**/agree-share-bank-information', {
    timeout: 25000
  })

  await waitForElement(page.locator('h1'))
}

export const navigateToChooseBankWelsh = async (page: Page) => {
  await page.goto('/finish-proving-identity-online-banking')

  const continueButton = page.getByRole('button', { name: 'Parhau' })
  await waitForElement(continueButton)

  await navigateAndWait(page, () => continueButton.click(), '**/choose-bank')

  await waitForElement(page.locator('#bank-select'))
}
