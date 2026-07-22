import { expect, runAxe, test } from '../fixtures'
import { tabToElement } from '../helpers/keyboard'

test.describe('Cookie banner', { tag: '@desktop' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('accepting cookies sets the user preference cookie', async ({ page }) => {
    await expect(page.locator('#cookies-banner-main')).toBeVisible()
    await runAxe(page)

    await page.getByRole('button', { name: 'Accept additional cookies' }).click()

    const cookies = await page.context().cookies()
    const pref = cookies.find((c) => c.name === 'cookies_preferences_set')
    expect(pref).toBeDefined()
    expect(JSON.parse(decodeURIComponent(pref!.value))).toMatchObject({ analytics: true })

    await expect(page.locator('#cookies-accepted')).toBeVisible()
    await expect(page.locator('#cookies-accepted')).toContainText(
      "You've accepted additional cookies."
    )
    await page.getByRole('button', { name: 'Hide this message' }).click()
    await expect(page.locator('#cookies-accepted')).not.toBeVisible()
  })

  test('rejecting cookies sets the user preference cookie', async ({ page }) => {
    await expect(page.locator('#cookies-banner-main')).toBeVisible()
    await page.getByRole('button', { name: 'Reject additional cookies' }).click()

    const cookies = await page.context().cookies()
    const pref = cookies.find((c) => c.name === 'cookies_preferences_set')
    expect(pref).toBeDefined()
    expect(JSON.parse(decodeURIComponent(pref!.value))).toMatchObject({ analytics: false })

    await expect(page.locator('#cookies-rejected')).toBeVisible()
    await expect(page.locator('#cookies-rejected')).toContainText(
      "You've rejected additional cookies."
    )
    await page.getByRole('button', { name: 'Hide this message' }).click()
    await expect(page.locator('#cookies-rejected')).not.toBeVisible()
  })

  test.describe('Keyboard navigation', () => {
    test('user can tab to Accept additional cookies and activate it with Enter', async ({
      page
    }) => {
      await tabToElement(page, 'button[data-module="govuk-button"]')
      await page.keyboard.press('Enter')

      await expect(page.locator('#cookies-accepted')).toBeVisible()
    })

    test('user can tab to Reject additional cookies and activate it with Enter', async ({
      page
    }) => {
      await tabToElement(page, 'button[data-module="govuk-button"]')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      await expect(page.locator('#cookies-rejected')).toBeVisible()
    })

    test('user can tab to Hide this message and dismiss the banner with Enter', async ({
      page
    }) => {
      await page.getByRole('button', { name: 'Accept additional cookies' }).click()
      await page.locator('#cookies-accepted a.cookie-hide-button').focus()
      await page.keyboard.press('Enter')

      await expect(page.locator('#cookies-accepted')).not.toBeVisible()
    })
  })
})
