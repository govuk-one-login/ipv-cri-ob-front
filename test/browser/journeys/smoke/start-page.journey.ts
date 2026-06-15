import { expect, smokeTest as test } from '../../fixtures'

test.describe('Journey: start page renders correctly', { tag: '@smoke' }, () => {
  test('start page displays the expected heading and continue button', async ({ page }) => {
    const response = await page.goto('/finish-proving-identity-online-banking')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1')).toContainText(
      'Finish proving your identity by signing in to your online banking'
    )
    await expect(page).toHaveTitle(
      /Finish proving your identity by signing in to your online banking/
    )
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  test('start page displays the prove your identity another way link', async ({ page }) => {
    await page.goto('/finish-proving-identity-online-banking')

    await expect(page.getByRole('link', { name: 'Prove your identity another way' })).toBeVisible()
  })

  test('start page displays the privacy notice link', async ({ page }) => {
    await page.goto('/finish-proving-identity-online-banking')

    await expect(
      page.getByRole('link', { name: 'Our privacy notice (opens in new tab)' })
    ).toBeVisible()
  })

  test('404 page renders correctly for a non-existent route', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist')
    expect(response?.status()).toBe(404)

    await expect(page.locator('h1')).toContainText('Page not found')
  })
})
