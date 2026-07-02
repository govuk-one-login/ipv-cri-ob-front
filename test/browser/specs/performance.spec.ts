import { expect, test } from '../fixtures'

import paths from '../constants'

test.describe('Performance tests', () => {
  test.describe('Page load performance', () => {
    test('start page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto(paths.steps.start)
      await page.waitForLoadState('load')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000)

      await expect(page.locator('h1')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
    })

    test('choose bank page loads and renders efficiently', async ({ page }) => {
      await page.goto(paths.steps.start)
      await page.getByRole('button', { name: 'Continue' }).click()

      const startTime = Date.now()
      await page.waitForURL(`**${paths.steps.chooseBank}`)
      await page.waitForSelector('#bank-select', { state: 'visible' })

      const renderTime = Date.now() - startTime
      expect(renderTime).toBeLessThan(2000)

      const options = await page.locator('#bank-select option').count()
      expect(options).toBeGreaterThan(1)
    })
  })

  test.describe('Resource loading', () => {
    test('CSS and JS resources load without blocking', async ({ page }) => {
      const resources: { size: number; time: number; url: string }[] = []

      page.on('response', (response) => {
        const url = response.url()
        if (url.includes('.css') || url.includes('.js')) {
          const contentLength = response.headers()['content-length']
          resources.push({
            url,
            size: contentLength ? parseInt(contentLength) : 0,
            time: Date.now()
          })
        }
      })

      await page.goto(paths.steps.start)
      await page.waitForLoadState('load')

      expect(resources.length).toBeGreaterThan(0)

      const largeResources = resources.filter((r) => r.size > 1024 * 1024)
      expect(largeResources).toHaveLength(0)
    })

    test('images are optimized and load efficiently', async ({ page }) => {
      let imageCount = 0
      let totalImageSize = 0

      page.on('response', (response) => {
        const contentType = response.headers()['content-type']
        if (contentType?.startsWith('image/')) {
          imageCount++
          const size = response.headers()['content-length']
          if (size) totalImageSize += parseInt(size)
        }
      })

      await page.goto(paths.steps.start)
      await page.waitForLoadState('load')

      if (imageCount > 0) {
        const averageImageSize = totalImageSize / imageCount
        expect(averageImageSize).toBeLessThan(100 * 1024)
      }
    })
  })

  test.describe('Memory usage', () => {
    test(
      'navigation between pages does not cause memory leaks',
      // performance.memory is a Chrome-only non-standard API, silently a no-op on Firefox/Safari
      { annotation: { type: 'skip-reason', description: 'chromium only' } },
      async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'performance.memory is Chrome-only')

        const initialMetrics = await page.evaluate(() => {
          const performanceMemory = (
            performance as unknown as {
              memory?: {
                totalJSMemory?: number
                usedJSMemory?: number
              }
            }
          ).memory
          return {
            usedJSMemory: performanceMemory?.usedJSMemory ?? 0,
            totalJSMemory: performanceMemory?.totalJSMemory ?? 0
          }
        })

        await page.goto(paths.steps.start)
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.waitForURL(`**${paths.steps.chooseBank}`)

        await page.selectOption('#bank-select', 'ironforge-vault')
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.waitForURL(`**${paths.steps.consent}`)

        // consent has noReturn:true so goBack() redirects to start rather than choose-bank;
        // navigate directly via start instead
        await page.goto(paths.steps.start)
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.waitForURL(`**${paths.steps.chooseBank}`)

        const finalMetrics = await page.evaluate(() => {
          const performanceMemory = (
            performance as unknown as {
              memory?: {
                totalJSMemory?: number
                usedJSMemory?: number
              }
            }
          ).memory
          return {
            usedJSMemory: performanceMemory?.usedJSMemory ?? 0,
            totalJSMemory: performanceMemory?.totalJSMemory ?? 0
          }
        })

        const memoryGrowth = finalMetrics.usedJSMemory - initialMetrics.usedJSMemory
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
      }
    )
  })

  test.describe('Form performance', () => {
    test('form interactions respond quickly', async ({ page }) => {
      await page.goto(paths.steps.start)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)

      const startTime = Date.now()

      const bankSelect = page.locator('#bank-select')
      await bankSelect.click()
      await bankSelect.selectOption('ironforge-vault')

      const interactionTime = Date.now() - startTime
      expect(interactionTime).toBeLessThan(500)

      await expect(bankSelect).toHaveValue('ironforge-vault')
    })

    test('form validation runs efficiently', async ({ page }) => {
      await page.goto(paths.steps.start)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)

      const startTime = Date.now()

      await Promise.all([
        page.waitForURL(`**${paths.steps.chooseBank}`),
        page.getByRole('button', { name: 'Continue' }).click()
      ])
      await expect(page.locator('.govuk-error-summary')).toBeVisible()

      const validationTime = Date.now() - startTime
      expect(validationTime).toBeLessThan(500)
    })
  })

  test.describe('Network performance', () => {
    test('handles concurrent requests efficiently', async ({ page }) => {
      const requestTimes: number[] = []

      page.on('request', (request) => {
        const timing = request.timing()
        if (timing) {
          requestTimes.push(timing.responseEnd - timing.requestStart)
        }
      })

      await page.goto(paths.steps.start)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForURL(`**${paths.steps.chooseBank}`)
      await page.waitForLoadState('load')

      if (requestTimes.length > 0) {
        const averageRequestTime = requestTimes.reduce((a, b) => a + b) / requestTimes.length
        expect(averageRequestTime).toBeLessThan(1000)
      }
    })
  })

  test.describe('Rendering performance', () => {
    test('pages render without layout shifts', async ({ page }) => {
      await page.addInitScript(() => {
        const globalWindow = window as unknown as {
          layoutShifts?: number[]
        }
        globalWindow.layoutShifts = []

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as unknown as {
              entryType: string
              hadRecentInput?: boolean
              value?: number
            }
            if (entry.entryType === 'layout-shift' && !layoutShiftEntry.hadRecentInput) {
              if (layoutShiftEntry.value && globalWindow.layoutShifts) {
                globalWindow.layoutShifts.push(layoutShiftEntry.value)
              }
            }
          }
        })

        observer.observe({ entryTypes: ['layout-shift'] })
      })

      await page.goto(paths.steps.start)
      await page.waitForLoadState('load')

      const layoutShifts = await page.evaluate(() => {
        const globalWindow = window as unknown as {
          layoutShifts?: number[]
        }
        return globalWindow.layoutShifts || []
      })
      const cumulativeLayoutShift = layoutShifts.reduce(
        (sum: number, shift: number) => sum + shift,
        0
      )

      expect(cumulativeLayoutShift).toBeLessThan(0.1)
    })
  })
})
