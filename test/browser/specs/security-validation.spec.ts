import { expect, test } from '../fixtures'

import paths from '../constants'

test.describe('Security and validation tests', () => {
  test.describe('CSRF Protection', () => {
    test('form submissions without CSRF token are rejected', async ({ page }) => {
      await page.goto(paths.steps.start)
      const toChooseBank = page.waitForURL(`**${paths.steps.chooseBank}`)
      await page.getByRole('button', { name: 'Continue' }).click()
      await toChooseBank

      await page.evaluate(() => {
        document.querySelector('input[name="_csrf"]')?.remove()
      })

      await expect(page.locator('input[name="_csrf"]')).toHaveCount(0)

      await page.selectOption('#bank-select', 'ironforge-vault')
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(new RegExp(paths.steps.chooseBank))
    })
  })

  test.describe('Session validation', () => {
    test('accessing protected routes without session redirects appropriately', async ({ page }) => {
      await page.context().clearCookies()

      await page.goto(paths.steps.consent)

      await expect(page).toHaveURL(new RegExp(`${paths.steps.start}|${paths.steps.chooseBank}`))
    })
  })

  test.describe('Input validation', () => {
    test('bank selection validates required field', async ({ page }) => {
      await page.goto(paths.steps.start)
      const toChooseBank = page.waitForURL(`**${paths.steps.chooseBank}`)
      await page.getByRole('button', { name: 'Continue' }).click()
      await toChooseBank

      const stayOnChooseBank = page.waitForURL(`**${paths.steps.chooseBank}`)
      await page.getByRole('button', { name: 'Continue' }).click()
      await stayOnChooseBank

      await expect(page.locator('.govuk-error-summary')).toBeVisible()
      await expect(page.locator('.govuk-error-message')).toContainText('Select a bank')
    })

    test('consent checkbox validates required field', async ({ page }) => {
      await page.goto(paths.steps.start)
      const toChooseBank = page.waitForURL(`**${paths.steps.chooseBank}`)
      await page.getByRole('button', { name: 'Continue' }).click()
      await toChooseBank

      await page.selectOption('#bank-select', 'ironforge-vault')
      const toConsent = page.waitForURL(`**${paths.steps.consent}`)
      await page.getByRole('button', { name: 'Continue' }).click()
      await toConsent

      const stayOnConsent = page.waitForURL(`**${paths.steps.consent}`)
      await page.getByRole('button', { name: 'Continue' }).click()
      await stayOnConsent

      await expect(page.locator('.govuk-error-summary')).toBeVisible()
      await expect(page.locator('.govuk-error-message')).toContainText('You must agree to share')
    })
  })

  test.describe('Headers and security', () => {
    test('security headers are present', async ({ page }) => {
      const response = await page.goto(paths.index)

      const headers = response?.headers()

      expect(headers).toHaveProperty('x-frame-options')
      expect(headers).toHaveProperty('x-content-type-options')
      expect(headers).toHaveProperty('content-security-policy')
    })
  })
})
