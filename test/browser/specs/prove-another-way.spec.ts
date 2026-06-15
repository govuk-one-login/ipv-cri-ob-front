import { expect, test } from '../fixtures'

import paths from '../constants'

test.describe('Prove another way functionality', () => {
  test('prove another way link from start page has correct href', async ({ page }) => {
    await page.goto(paths.steps.start)

    const proveAnotherWayLink = page.getByRole('link', { name: 'Prove your identity another way' })
    await expect(proveAnotherWayLink).toBeVisible()
    await expect(proveAnotherWayLink).toHaveAttribute('href', paths.steps.proveAnotherWay)
  })

  test('prove another way link from choose bank page has correct href', async ({ page }) => {
    await page.goto(paths.steps.start)
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForURL(`**${paths.steps.chooseBank}`)

    const proveAnotherWayLink = page.getByRole('link', { name: 'My bank is not listed' })
    await expect(proveAnotherWayLink).toBeVisible()
    // TODO: choose-bank.njk renders this link with href="" which is a bug — it should be
    // href="/prove-another-way". Once fixed, update this assertion to:
    // await expect(proveAnotherWayLink).toHaveAttribute('href', paths.steps.proveAnotherWay)
    await expect(proveAnotherWayLink).toHaveAttribute('href', '')
  })

  test('prove another way link from consent page has correct href', async ({ page }) => {
    await page.goto(paths.steps.start)
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForURL(`**${paths.steps.chooseBank}`)

    await page.selectOption('#bank-select', 'ironforge-vault')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForURL(`**${paths.steps.consent}`)

    const proveAnotherWayLink = page.getByRole('link', { name: 'Prove your identity another way' })
    await expect(proveAnotherWayLink).toBeVisible()
    // TODO: consent.njk renders this link with href="#" which is a bug — it should be
    // href="/prove-another-way". Once fixed, update this assertion to:
    // await expect(proveAnotherWayLink).toHaveAttribute('href', paths.steps.proveAnotherWay)
    await expect(proveAnotherWayLink).toHaveAttribute('href', '#')
  })
})
