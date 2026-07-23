import { expect, runAxe, test } from '../fixtures'
import { switchToWelsh } from '../helpers/language'

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
})

test.describe('Layout sanity check', { tag: '@desktop' }, () => {
  test('Skip link, header and footer', async ({ page }) => {
    await page.goto('/')

    await test.step('Skip link', async () => {
      await expect(page.locator('.govuk-skip-link')).toHaveAttribute('href', '#main-content')
      await expect(page.locator('.govuk-skip-link')).toContainText('Skip to main content')

      await page.locator('.govuk-skip-link').focus()
      await expect(page.locator('.govuk-skip-link')).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('#main-content')).toBeFocused()
    })

    await test.step('Header renders the GOV.UK logo linking to https://www.gov.uk', async () => {
      await expect(page.locator('header .govuk-header__link--homepage')).toHaveAttribute(
        'href',
        'https://www.gov.uk'
      )
    })

    await test.step('BETA phase banner renders with feedback link', async () => {
      await expect(page.locator('.govuk-phase-banner__content__tag')).toContainText('BETA')
      await expect(
        page.getByRole('link', { name: 'give your feedback (opens in a new tab)' })
      ).toHaveAttribute('href', /^https:\/\/signin\.account\.gov\.uk\/contact-us/)
    })

    await test.step('Footer renders the accessibility statement link', async () => {
      await expect(page.getByRole('link', { name: 'Accessibility statement' })).toHaveAttribute(
        'href',
        'https://signin.account.gov.uk/accessibility-statement'
      )
    })

    await test.step('Footer renders the cookies link', async () => {
      await expect(
        page.locator('footer').getByRole('link', { exact: true, name: 'Cookies' })
      ).toHaveAttribute('href', 'https://signin.account.gov.uk/cookies')
    })

    await test.step('Footer renders the terms and conditions link', async () => {
      await expect(page.getByRole('link', { name: 'Terms and conditions' })).toHaveAttribute(
        'href',
        'https://signin.account.gov.uk/terms-and-conditions'
      )
    })

    await test.step('Footer renders the privacy notice link', async () => {
      await expect(
        page.locator('footer').getByRole('link', { exact: true, name: 'Privacy notice' })
      ).toHaveAttribute(
        'href',
        'https://www.gov.uk/government/publications/govuk-one-login-privacy-notice'
      )
    })

    await test.step('Footer renders the support link', async () => {
      const supportLink = page.getByRole('link', { name: 'Support (opens in new tab)' })
      await expect(supportLink).toHaveAttribute(
        'href',
        'https://home.account.gov.uk/contact-gov-uk-one-login'
      )
      await expect(supportLink).toHaveAttribute('target', '_blank')
      await expect(supportLink).toHaveAttribute('rel', 'noreferrer noopener')
    })

    await test.step('Footer renders the Crown copyright notice', async () => {
      await expect(page.locator('footer')).toContainText('© Crown copyright')
    })

    await test.step('Footer renders the Open Government licence link', async () => {
      await expect(
        page.getByRole('link', { name: 'Open Government Licence v3.0' })
      ).toHaveAttribute(
        'href',
        'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'
      )
    })
  })

  test('Language toggle switches to Welsh and sets the language cookie', async ({ page }) => {
    await page.goto('/')

    await switchToWelsh(page)

    const cookies = await page.context().cookies()
    const lng = cookies.find((c) => c.name === 'lng')
    expect(lng?.value).toBe('cy')
    await expect(page.locator('#cookies-banner-main').getByRole('heading')).toContainText(
      'Cwcis ar GOV.UK One Login'
    )
  })
})
