import type { Page } from '@playwright/test'

export const tabToElement = async (page: Page, selector: string, maxTabs = 30) => {
  for (let i = 0; i < maxTabs; i++) {
    const focused = (await page.locator(selector).and(page.locator(':focus')).count()) > 0
    if (focused) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`Could not tab to "${selector}" within ${maxTabs} tabs`)
}

export const activateWithKeyboard = async (page: Page, selector: string) => {
  await page.locator(selector).focus()
  await page.keyboard.press('Enter')
}
