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
      "Gorffennwch brofi eich hunaniaeth drwy fewngofnodi i'ch bancio ar-lein\n"
    )
    await expect(page).toHaveTitle(
      "Gorffennwch brofi eich hunaniaeth drwy fewngofnodi i'ch bancio ar-lein – GOV.UK One Login"
    )
  })
})
