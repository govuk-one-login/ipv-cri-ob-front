import { expect, test } from '../fixtures'

import paths from '../constants'

test.describe('Layout', () => {
  test.describe('Keyboard navigation', () => {
    test('first Tab focuses the skip to main content link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await page.locator('.govuk-skip-link').focus()

      await expect(page.locator('.govuk-skip-link')).toBeFocused()
    })

    test('activating the skip link moves focus to #main-content', async ({ page }) => {
      await page.goto(paths.steps.start)

      await page.locator('.govuk-skip-link').focus()
      await page.keyboard.press('Enter')

      await expect(page.locator('#main-content')).toBeFocused()
    })
  })

  test.describe('Header', () => {
    test('renders the GOV.UK logo linking to https://www.gov.uk', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(page.locator('header .govuk-header__link--homepage')).toHaveAttribute(
        'href',
        'https://www.gov.uk'
      )
    })

    test('renders the skip to main content link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(page.locator('.govuk-skip-link')).toHaveAttribute('href', '#main-content')
      await expect(page.locator('.govuk-skip-link')).toContainText('Skip to main content')
    })
  })

  test.describe('Phase banner', () => {
    test('renders the BETA phase banner with feedback link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(page.locator('.govuk-phase-banner__content__tag')).toContainText('BETA')
      await expect(
        page.getByRole('link', { name: 'give your feedback (opens in a new tab)' })
      ).toHaveAttribute('href', /^https:\/\/signin\.account\.gov\.uk\/contact-us/)
    })
  })

  test.describe('Footer', () => {
    test('renders the Accessibility statement link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(page.getByRole('link', { name: 'Accessibility statement' })).toHaveAttribute(
        'href',
        'https://signin.account.gov.uk/accessibility-statement'
      )
    })

    test('renders the Cookies link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(
        page.locator('footer').getByRole('link', { exact: true, name: 'Cookies' })
      ).toHaveAttribute('href', 'https://signin.account.gov.uk/cookies')
    })

    test('renders the Terms and conditions link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(page.getByRole('link', { name: 'Terms and conditions' })).toHaveAttribute(
        'href',
        'https://signin.account.gov.uk/terms-and-conditions'
      )
    })

    test('renders the Privacy notice link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(
        page.locator('footer').getByRole('link', { exact: true, name: 'Privacy notice' })
      ).toHaveAttribute(
        'href',
        'https://www.gov.uk/government/publications/govuk-one-login-privacy-notice'
      )
    })

    test('renders the Support link opening in a new tab', async ({ page }) => {
      await page.goto(paths.steps.start)

      const supportLink = page.getByRole('link', { name: 'Support (opens in new tab)' })
      await expect(supportLink).toHaveAttribute(
        'href',
        'https://home.account.gov.uk/contact-gov-uk-one-login'
      )
      await expect(supportLink).toHaveAttribute('target', '_blank')
      await expect(supportLink).toHaveAttribute('rel', 'noreferrer noopener')
    })

    test('renders the Crown copyright notice', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(page.locator('footer')).toContainText('© Crown copyright')
    })

    test('renders the Open Government Licence link', async ({ page }) => {
      await page.goto(paths.steps.start)

      await expect(
        page.getByRole('link', { name: 'Open Government Licence v3.0' })
      ).toHaveAttribute(
        'href',
        'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'
      )
    })
  })
})
