import type { Page } from '@playwright/test'

export class AuthorisePage {
  constructor(private readonly page: Page) {}

  goto(request: string, clientId = 'test-client') {
    return this.page.goto(`/oauth2/authorize?client_id=${clientId}&request=${request}`)
  }
}
