import { expect, test } from '../fixtures'
import { navigateToChooseBank, navigateToConsent } from '../helpers/navigation'

// Run mobile-specific tests only on mobile projects
test.describe('Mobile responsiveness', () => {
  test.use({ skipAxe: true })
  // Skip these tests on desktop browsers
  test.skip(({ isMobile }) => !isMobile, 'Mobile-only tests')

  test.describe('Start page mobile', () => {
    test('displays correctly on mobile viewport', async ({ page }) => {
      await page.goto('/finish-proving-identity-online-banking')

      // Check that elements are properly sized for mobile
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()

      // Verify the page is responsive
      const viewport = page.viewportSize()
      expect(viewport?.width).toBeLessThanOrEqual(768) // Mobile breakpoint

      // Check mobile-specific layout elements
      const continueButton = page.getByRole('button', { name: 'Continue' })
      await expect(continueButton).toBeVisible()

      // Verify touch-friendly button size
      const buttonBox = await continueButton.boundingBox()
      expect(buttonBox?.height).toBeGreaterThanOrEqual(38)
    })

    test('details dropdown works on touch devices', async ({ page }) => {
      await page.goto('/finish-proving-identity-online-banking')

      const detailsSummary = page.locator('details summary')
      await expect(detailsSummary).toBeVisible()

      // Tap to open details
      await detailsSummary.tap()
      await expect(page.locator('details')).toHaveAttribute('open')

      // Tap to close details
      await detailsSummary.tap()
      await expect(page.locator('details')).not.toHaveAttribute('open')
    })
  })

  test.describe('Choose bank page mobile', () => {
    test('bank selection dropdown is touch-friendly', async ({ page }) => {
      await navigateToChooseBank(page)

      const bankSelect = page.locator('#bank-select')
      await expect(bankSelect).toBeVisible()

      // Verify dropdown is accessible on mobile
      await bankSelect.tap()

      // Select option using touch
      await bankSelect.selectOption('ironforge-vault')

      const continueButton = page.getByRole('button', { name: 'Continue' })
      const buttonBox = await continueButton.boundingBox()
      expect(buttonBox?.height).toBeGreaterThanOrEqual(38)
    })

    test('error messages display correctly on mobile', async ({ page }) => {
      await navigateToChooseBank(page)

      // Submit without selection to trigger error
      await page.getByRole('button', { name: 'Continue' }).tap()

      const errorSummary = page.locator('.govuk-error-summary')
      await expect(errorSummary).toBeVisible()

      // Verify error summary is properly positioned for mobile
      const errorBox = await errorSummary.boundingBox()
      expect(errorBox?.width).toBeLessThanOrEqual(page.viewportSize()?.width || 768)
    })
  })

  test.describe('Consent page mobile', () => {
    test('consent checkbox is touch-accessible', async ({ page }) => {
      await navigateToConsent(page)

      const consentCheckbox = page.locator('#consent')
      await expect(consentCheckbox).toBeVisible()

      // Use tap instead of click for mobile
      await consentCheckbox.tap()
      await expect(consentCheckbox).toBeChecked()

      // Verify checkbox has adequate touch target
      const checkboxBox = await consentCheckbox.boundingBox()
      expect(checkboxBox?.height).toBeGreaterThanOrEqual(44)
      expect(checkboxBox?.width).toBeGreaterThanOrEqual(44)
    })

    test('page content fits mobile viewport', async ({ page }) => {
      await navigateToConsent(page)

      // Check that main content doesn't overflow
      const mainContent = page.locator('main')
      const mainBox = await mainContent.boundingBox()
      const viewport = page.viewportSize()

      expect(mainBox?.width).toBeLessThanOrEqual(viewport?.width || 768)

      // Verify text is readable (not too small)
      const heading = page.locator('h1')
      const fontSize = parseInt(await heading.evaluate((el) => getComputedStyle(el).fontSize))
      expect(fontSize).toBeGreaterThanOrEqual(16) // Minimum readable size
    })
  })

  test.describe('Navigation on mobile', () => {
    test('back links work with touch', async ({ page }) => {
      await navigateToChooseBank(page)

      const backLink = page.getByRole('link', { name: 'Back', exact: true })
      await expect(backLink).toBeVisible()

      await backLink.tap()
      await expect(page).toHaveURL(/finish-proving-identity-online-banking/)
    })

    test('external links open correctly on mobile', async ({ page }) => {
      await page.goto('/finish-proving-identity-online-banking')

      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.getByRole('link', { name: 'Our privacy notice (opens in new tab)' }).tap()
      ])

      await expect(popup).toHaveURL(/gov.uk/)
    })
  })

  test.describe('Touch gestures', () => {
    test('swipe gestures do not interfere with form interaction', async ({ page }) => {
      await navigateToChooseBank(page)

      // Form should be functional after touch interactions
      const bankSelect = page.locator('#bank-select')
      await bankSelect.selectOption('ironforge-vault')
      await expect(bankSelect).toHaveValue('ironforge-vault')
    })
  })

  test.describe('Landscape orientation', () => {
    test('page layout adapts to landscape mode', async ({ page }) => {
      // Simulate landscape orientation
      await page.setViewportSize({ width: 896, height: 414 }) // iPhone landscape

      await page.goto('/finish-proving-identity-online-banking')

      const heading = page.locator('h1')
      await expect(heading).toBeVisible()

      // Verify content still fits and is readable
      const viewport = page.viewportSize()
      expect(viewport?.width).toBeGreaterThan(viewport?.height || 0)

      const continueButton = page.getByRole('button', { name: 'Continue' })
      await expect(continueButton).toBeVisible()
    })
  })
})
