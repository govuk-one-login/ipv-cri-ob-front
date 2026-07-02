// NOTE: Both scenarios in this file require the real /banks API to be wired up in banks.client.ts.
// Currently banksClient uses a hardcoded stub (see the TODO in banks.client.ts) and never calls
// the API, so wiremock mappings for /banks have no effect. These tests should be enabled once
// the TODO is resolved.

import { expect, mockTest as test } from '../../fixtures'
import { AuthorisePage } from '../../pages/authorise.page'

test.describe.configure({ mode: 'serial' })
test.use({ skipAxe: true })

test.describe('Journey: all banks offline', { tag: '@mock' }, () => {
  test.skip('user is redirected to prove-another-way when all banks are offline', async ({
    page
  }) => {
    const authorise = new AuthorisePage(page)

    await test.step('Given the user initiates an authorisation request where all banks are offline', async () => {
      await authorise.goto('test-jwt-all-banks-offline')
    })

    await test.step('When the user lands on the start page and continues', async () => {
      await expect(page).toHaveURL(/\/finish-proving-identity-online-banking/)
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    await test.step('Then the user is redirected to prove-another-way without seeing the choose bank page', async () => {
      await expect(page).toHaveURL(/\/prove-another-way/)
    })
  })
})

test.describe('Journey: bank list unavailable', { tag: '@mock' }, () => {
  test.skip('user is redirected to prove-another-way when the banks API is unavailable', async ({
    page
  }) => {
    const authorise = new AuthorisePage(page)

    await test.step('Given the user initiates an authorisation request where the banks API is unavailable', async () => {
      await authorise.goto('test-jwt-failure')
    })

    await test.step('When the user lands on the start page and continues', async () => {
      await expect(page).toHaveURL(/\/finish-proving-identity-online-banking/)
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    await test.step('Then the user is redirected to prove-another-way without seeing the choose bank page', async () => {
      await expect(page).toHaveURL(/\/prove-another-way/)
    })
  })
})
