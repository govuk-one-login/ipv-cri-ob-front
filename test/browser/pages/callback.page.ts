import type { Page } from '@playwright/test'

export class CallbackPage {
  constructor(private readonly page: Page) {}

  goto() {
    return this.page.goto('/oauth2/callback')
  }

  searchParams() {
    return new URL(this.page.url()).searchParams
  }
}
