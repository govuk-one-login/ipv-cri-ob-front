import { expect, test } from '../fixtures'
import { navigateToChooseBankWelsh, navigateToRoot, selectWelsh } from '../helpers/navigation'
import { ChooseBankPage } from '../pages/choose-bank.page'

import paths from '../constants'

test.describe('Welsh language', () => {
  test.use({ skipConsoleErrors: true })

  test.describe('Language toggle', () => {
    test('selecting Welsh changes the page language and sets a cookie', async ({ page }) => {
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

  test.describe('Page translations', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToRoot(page)
      await selectWelsh(page)
    })

    test('Start page is displayed in Welsh', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(page.locator('h1')).toContainText(
        "Gorffennwch brofi eich hunaniaeth drwy fewngofnodi i'ch bancio ar-lein"
      )
      await expect(page).toHaveTitle(
        "Gorffennwch brofi eich hunaniaeth drwy fewngofnodi i'ch bancio ar-lein – GOV.UK One Login"
      )
    })

    test('Choose bank page is displayed in Welsh', async ({ page }) => {
      const continueButton = page.getByRole('button', { name: 'Parhau' })
      await continueButton.click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)

      await expect(page.locator('h1')).toContainText('Dewiswch eich banc neu gymdeithas adeiladu')
    })

    test('Consent page is displayed in Welsh', async ({ page }) => {
      await navigateToChooseBankWelsh(page)
      const chooseBankPage = new ChooseBankPage(page)
      await chooseBankPage.selectBank('Vault of Ironforge')
      const navigation = page.waitForURL(`**${paths.steps.consent}`)
      await chooseBankPage.continueWelsh()
      await navigation

      await expect(page.locator('h1')).toContainText(
        "Cytuno i rannu gwybodaeth o'ch cyfrif banc neu gymdeithas adeiladu gydag Ecospend"
      )
    })

    test('404 page is displayed in Welsh', async ({ page }) => {
      await page.goto(paths.error404)

      await expect(page.locator('h1')).toContainText('Tudalen heb ei darganfod')
      await expect(page).toHaveTitle(/Tudalen heb ei darganfod/)
    })
  })
})
