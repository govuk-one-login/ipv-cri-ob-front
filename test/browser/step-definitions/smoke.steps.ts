import { smokeTest } from '../fixtures'
import { navigateToRoot } from '../helpers/navigation'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Then, When } = createBdd(smokeTest)

When('the user requests the root page', async ({ page, response }) => {
  const res = await navigateToRoot(page)
  response.value = res?.status() ?? 0
})

Then('the response status is {int}', ({ response }, status: number) => {
  expect(response.value).toBe(status)
})
