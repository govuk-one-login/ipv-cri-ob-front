import type { Page } from '@playwright/test'

export const navigateToRoot = (page: Page) => page.goto('/')

export const selectWelsh = (page: Page) => page.getByRole('link', { name: 'Cymraeg' }).click()
