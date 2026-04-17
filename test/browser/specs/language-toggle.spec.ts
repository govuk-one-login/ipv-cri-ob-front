import { expect, test } from '../fixtures'
import { navigateToRoot, selectWelsh } from '../helpers/navigation'

test.describe('Language toggle', () => {
  test('selecting Welsh changes the page language', async ({ page }) => {
    await navigateToRoot(page)
    await selectWelsh(page)

    await expect(page.locator('html')).toHaveAttribute('lang', 'cy')

    const cookies = await page.context().cookies()
    const pref = cookies.find((c) => c.name === 'lng')
    expect(pref).toBeDefined()

    await expect(page.locator('.govuk-heading-l')).toContainText(
      'Cyhoeddwr Cymwysterau Bancio Agored'
    )
    await expect(page).toHaveTitle('Cyhoeddwr Cymwysterau Bancio Agored – GOV.UK One Login')
  })
})
