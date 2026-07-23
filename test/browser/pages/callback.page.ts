import type { Page } from '@playwright/test'

export class CallbackPage {
  constructor(private readonly page: Page) {}

  awaitCompletion() {
    return this.page.waitForURL(/\/callback\?.*(code|error)=/)
  }

  goto() {
    return this.page.goto('/oauth2/callback')
  }

  searchParams() {
    return new URL(this.page.url()).searchParams
  }
}
