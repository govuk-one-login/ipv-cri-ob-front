import { test } from '../fixtures'
import { navigateToRoot, selectWelsh } from '../helpers/navigation'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, Step, Then, When } = createBdd(test)

Given('the user navigates to the root page', async ({ page }) => {
  await navigateToRoot(page)
})

Step('they select Welsh', async ({ page }) => {
  await selectWelsh(page)
})

When('the user navigates to {string}', async ({ page }, path: string) => {
  await page.goto(path)
})

Then('the page language is {string}', async ({ page }, lang: string) => {
  await expect(page.locator('html')).toHaveAttribute('lang', lang)
})

Then('the language preference cookie is set', async ({ page }) => {
  const cookies = await page.context().cookies()
  expect(cookies.find((c) => c.name === 'lng')).toBeDefined()
})

Then('the page heading contains {string}', async ({ page }, text: string) => {
  await expect(page.locator('h1')).toContainText(text)
})

Then('the page title is {string}', async ({ page }, title: string) => {
  await expect(page).toHaveTitle(title)
})

Then('the page title matches {string}', async ({ page }, text: string) => {
  await expect(page).toHaveTitle(new RegExp(text))
})
