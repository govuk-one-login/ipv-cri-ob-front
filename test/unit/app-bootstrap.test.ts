import type { Express } from 'express'
import type { Mock } from 'vitest'

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@src/utils/logger', () => ({
  getLogger: () => ({ warn: vi.fn() })
}))

vi.mock('@govuk-one-login/di-ipv-cri-common-express', () => ({
  default: {
    bootstrap: {
      setup: vi
        .fn()
        .mockImplementation(
          ({ middlewareSetupFn }: { middlewareSetupFn: (app: Express) => void }) => {
            const app = { set: vi.fn(), use: vi.fn() } as unknown as Express
            middlewareSetupFn(app)
            return { app, router: { use: vi.fn() } }
          }
        )
    },
    lib: {
      axios: vi.fn(),
      errorHandling: { redirectAsErrorToCallback: vi.fn() },
      headers: vi.fn(),
      i18n: { setI18n: vi.fn() },
      locals: { getDeviceIntelligence: vi.fn(), getGTM: vi.fn(), getLanguageToggle: vi.fn() },
      settings: { setDeviceIntelligence: vi.fn(), setGTM: vi.fn() }
    },
    routes: { oauth2: vi.fn() }
  }
}))

vi.mock('@govuk-one-login/frontend-ui', () => ({ frontendUiMiddlewareIdentityBypass: vi.fn() }))
vi.mock('@govuk-one-login/frontend-vital-signs', () => ({ frontendVitalSignsInitFromApp: vi.fn() }))
vi.mock('@src/middleware', () => ({
  flash: vi.fn(),
  forceSessionSave: vi.fn()
}))
vi.mock('@src/utils/session', () => ({ default: vi.fn().mockResolvedValue({}) }))
vi.mock('@src/config/routes', () => ({ configure: vi.fn() }))
vi.mock('@src/config/helmet', () => ({ default: vi.fn().mockResolvedValue({}) }))

vi.mock('@src/utils/dev-tooling/dev-server', () => ({
  createViteServer: vi.fn().mockResolvedValue({}),
  setupDevServer: vi.fn()
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('createApp', () => {
  it('does not create a vite server when node env is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { createViteServer } = await import('@src/utils/dev-tooling/dev-server')
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    expect(createViteServer).not.toHaveBeenCalled()
  })

  it('creates a vite server when node env is development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { createViteServer } = await import('@src/utils/dev-tooling/dev-server')
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    expect(createViteServer).toHaveBeenCalled()
  })

  it('registers redirectAsErrorToCallback on the router after routes are configured', async () => {
    const { configure } = await import('@src/config/routes')
    const { default: commonExpress } = await import('@govuk-one-login/di-ipv-cri-common-express')
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    const { router } = vi.mocked(commonExpress.bootstrap.setup).mock.results[0]!.value as {
      router: { use: Mock }
    }

    expect(configure).toHaveBeenCalledBefore(router.use)
    expect(router.use).toHaveBeenCalledWith(
      commonExpress.lib.errorHandling.redirectAsErrorToCallback
    )
  })

  it('enables request logging in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const commonExpress = (await import('@govuk-one-login/di-ipv-cri-common-express')).default
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    expect(commonExpress.bootstrap.setup).toHaveBeenCalledWith(
      expect.objectContaining({ requestLogging: true })
    )
  })

  it('sets i18n and applies middleware in the correct order', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { frontendUiMiddlewareIdentityBypass } = await import('@govuk-one-login/frontend-ui')
    const { forceSessionSave } = await import('@src/middleware')
    const { default: commonExpress } = await import('@govuk-one-login/di-ipv-cri-common-express')
    const { createApp } = await import('@src/app-bootstrap')
    const { app } = await createApp()

    expect(commonExpress.lib.i18n.setI18n).toHaveBeenCalledWith(
      expect.objectContaining({ router: app })
    )
    expect(app.use).toHaveBeenNthCalledWith(1, frontendUiMiddlewareIdentityBypass)
    expect(app.use).toHaveBeenNthCalledWith(2, forceSessionSave.middleware)
    expect(app.use).toHaveBeenNthCalledWith(3, commonExpress.lib.locals.getGTM)
    expect(app.use).toHaveBeenNthCalledWith(4, commonExpress.lib.locals.getLanguageToggle)
    expect(app.use).toHaveBeenNthCalledWith(5, commonExpress.lib.locals.getDeviceIntelligence)
    expect(app.use).toHaveBeenNthCalledWith(6, commonExpress.lib.headers)
    expect(app.use).toHaveBeenNthCalledWith(7, commonExpress.lib.axios)
  })
})
