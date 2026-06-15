import type { Locator, Page } from '@playwright/test'

export interface WaitOptions {
  retries?: number
  retryDelay?: number
  timeout?: number
}

/**
 * Wait for network to be idle with retry logic
 */
export const waitForNetworkIdle = async (page: Page, options: WaitOptions = {}): Promise<void> => {
  const { timeout = 10000, retries = 3, retryDelay = 1000 } = options

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForLoadState('networkidle', { timeout: timeout / retries })
      return
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }
}

/**
 * Wait for element to be ready for interaction
 */
export const waitForElement = async (
  locator: Locator,
  options: WaitOptions = {}
): Promise<void> => {
  const { timeout = 10000 } = options

  await locator.waitFor({
    state: 'visible',
    timeout
  })

  // Additional check for elements that might be visually ready but not interactive
  if (await locator.evaluate((el) => el.tagName === 'BUTTON' || el.tagName === 'INPUT')) {
    await locator.waitFor({
      state: 'attached',
      timeout: timeout / 2
    })
  }
}

/**
 * Robust navigation that handles race conditions
 */
export const navigateAndWait = async (
  page: Page,
  trigger: () => Promise<void>,
  expectedUrl: string,
  options: WaitOptions = {}
): Promise<void> => {
  const { timeout = 20000 } = options

  // Start navigation and URL waiting in parallel
  await Promise.all([
    page.waitForURL(expectedUrl, {
      timeout,
      waitUntil: 'networkidle'
    }),
    trigger()
  ])

  // Ensure page is fully loaded
  await waitForNetworkIdle(page, { timeout: timeout / 2 })
}

/**
 * Wait with exponential backoff
 */
export const waitWithBackoff = async (
  condition: () => Promise<boolean>,
  options: WaitOptions = {}
): Promise<void> => {
  const { timeout = 10000, retries = 5, retryDelay = 500 } = options
  const startTime = Date.now()

  for (let i = 0; i < retries; i++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout after ${timeout}ms waiting for condition`)
    }

    try {
      if (await condition()) return
    } catch (error) {
      if (i === retries - 1) throw error
    }

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, i)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}
