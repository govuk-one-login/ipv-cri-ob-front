import { expect, test } from '../fixtures'
import { tabToElement } from '../helpers/keyboard'
import { navigateToConsent } from '../helpers/navigation'

import paths from '../constants'

test.describe('Cross-browser compatibility', () => {
  test.describe('Browser-specific form handling', () => {
    test('form submissions work consistently across browsers', async ({ page }) => {
      await page.goto(paths.steps.start)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)

      const bankSelect = page.locator('#bank-select')
      await bankSelect.selectOption('ironforge-vault')

      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.consent}`)

      await expect(page.locator('h1')).toBeVisible()
    })

    test('checkbox interactions work across browsers', async ({ page, browserName }) => {
      await navigateToConsent(page)

      const consentCheckbox = page.locator('#consent')

      if (browserName === 'webkit') {
        await consentCheckbox.click({ force: true })
      } else {
        await consentCheckbox.click()
      }

      await expect(consentCheckbox).toBeChecked()
    })
  })

  test.describe('CSS and layout consistency', () => {
    test('responsive breakpoints work across browsers', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1200, height: 800 }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto(paths.steps.start)

        await expect(page.locator('h1')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

        const bodyWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20)
      }
    })
  })

  test.describe('JavaScript compatibility', () => {
    test('page functionality works without JavaScript', async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false })
      const page = await context.newPage()

      await page.goto(paths.steps.start)

      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)

      await context.close()
    })

    test('GA4 analytics data layer is present', async ({ page }) => {
      await page.goto(paths.steps.start)

      const gtmScriptPresent = await page.evaluate(
        () => document.querySelector('script[src*="googletagmanager"]') !== null
      )

      // dataLayer is only initialised when GTM is enabled — skip assertion if the
      // GTM script is not present (e.g. GA4_ENABLED=false in local/test envs)
      if (!gtmScriptPresent) {
        test.skip()
        return
      }

      const hasDataLayer = await page.evaluate(() => {
        const globalWindow = window as unknown as { dataLayer?: unknown }
        return Array.isArray(globalWindow.dataLayer)
      })

      expect(hasDataLayer).toBe(true)
    })
  })

  test.describe('Network handling', () => {
    test('handles slow network conditions gracefully', async ({ page }) => {
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        await route.continue()
      })

      await page.goto(paths.steps.start)

      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
    })

    test('handles network failures gracefully', async ({ page }) => {
      await page.goto(paths.steps.start)

      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)

      await page.route('**/api/**', (route) => route.abort('failed'))

      await page.selectOption('#bank-select', 'ironforge-vault')
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Cookie handling', () => {
    test('cookie consent works across browsers', async ({ page }) => {
      await page.goto(paths.steps.start)

      const cookieBanner = page.locator('[data-module="govuk-cookie-banner"]')

      if (await cookieBanner.isVisible()) {
        const acceptButton = cookieBanner.getByRole('button', { name: /accept/i })
        if (await acceptButton.isVisible()) {
          await acceptButton.click()
          await expect(cookieBanner).not.toBeVisible()
        }
      }

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(
        (c) => c.name.includes('session') || c.name.includes('connect.sid')
      )
      expect(sessionCookie).toBeDefined()
    })
  })

  test.describe('Accessibility across browsers', () => {
    test('focus management works consistently', async ({ page }) => {
      await page.goto(paths.steps.start)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)

      // Verify key interactive elements are reachable via keyboard in order
      await tabToElement(page, '#bank-select')
      await expect(page.locator('#bank-select')).toBeFocused()

      await tabToElement(page, '.govuk-button--progress')
      await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused()
    })
  })
})
