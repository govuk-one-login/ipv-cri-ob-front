import { expect, test } from '../fixtures'
import { navigateToRoot } from '../helpers/navigation'

test.describe('Cookie banner', () => {
  test('accepting cookies sets the user preference cookie', async ({ page }) => {
    await navigateToRoot(page)

    await expect(page.locator('#cookies-banner-main')).toBeVisible()

    await page.getByRole('button', { name: 'Accept additional cookies' }).click()

    const cookies = await page.context().cookies()
    const pref = cookies.find((c) => c.name === 'cookies_preferences_set')
    expect(pref).toBeDefined()
    expect(JSON.parse(decodeURIComponent(pref!.value))).toMatchObject({ analytics: true })

    await expect(page.locator('#cookies-accepted')).toBeVisible()
    await expect(page.locator('#cookies-accepted')).toContainText(
      "You've accepted additional cookies."
    )
  })
})
