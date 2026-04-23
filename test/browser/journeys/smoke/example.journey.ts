import { expect, smokeTest as test } from '../../fixtures'
import { navigateToRoot } from '../../helpers/navigation'

test.describe('Journey: app root', { tag: '@smoke' }, () => {
  test('app root responds successfully', async ({ page }) => {
    const response = await navigateToRoot(page)
    expect(response?.status()).toBe(200)
  })
})
