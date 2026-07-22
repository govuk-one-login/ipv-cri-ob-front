import type { Express } from 'express'

import { afterEach, describe, expect, it, vi } from 'vitest'

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
      customFetch: { customFetchMiddleware: vi.fn() },
      errorHandling: { redirectAsErrorToCallback: vi.fn() },
      headers: vi.fn(),
      i18n: { setI18n: vi.fn() }
    },
    routes: { oauth2: vi.fn() }
  }
}))

vi.mock('@govuk-one-login/frontend-ui', () => ({
  frontendUiMiddleware: vi.fn(),
  locals: { getDeviceIntelligence: vi.fn(), getGTM: vi.fn(), getLanguageToggle: vi.fn() },
  setFrontendUiTranslations: vi.fn(),
  settings: { setDeviceIntelligence: vi.fn(), setGTM: vi.fn(), setLanguageToggle: vi.fn() }
}))
vi.mock('@govuk-one-login/frontend-vital-signs', () => ({
  frontendVitalSignsInitFromApp: vi.fn()
}))
vi.mock('@src/middleware', () => ({
  flash: { middleware: vi.fn() },
  saveSessionOnRedirect: { middleware: vi.fn() }
}))
vi.mock('@src/utils/session', () => ({ default: vi.fn().mockResolvedValue({}) }))
vi.mock('@src/config/routes', () => ({ configure: vi.fn() }))
vi.mock('@src/config/helmet', () => ({ default: {} }))

vi.mock('@src/utils/dev-tooling/dev-server', () => ({
  setupDevServer: vi.fn()
}))
vi.mock('@src/utils/dev-tooling/debug-menu', () => ({
  debugMenu: { register: vi.fn(), viewsDir: '/debug-views' }
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('createApp', () => {
  it('does not set up the vite dev server when node env is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { setupDevServer } = await import('@src/utils/dev-tooling/dev-server')
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    expect(setupDevServer).not.toHaveBeenCalled()
  })

  it('sets up the vite dev server when node env is development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { setupDevServer } = await import('@src/utils/dev-tooling/dev-server')
    const { createApp } = await import('@src/app-bootstrap')
    const { app } = await createApp()

    expect(setupDevServer).toHaveBeenCalledWith(app)
  })

  it('configures the router in the correct order', async () => {
    const { default: commonExpress } = await import('@govuk-one-login/di-ipv-cri-common-express')
    const { flash, saveSessionOnRedirect } = await import('@src/middleware')
    const routes = await import('@src/config/routes')
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    const { router } = vi.mocked(commonExpress.bootstrap.setup).mock.results[0]!.value as {
      router: { use: ReturnType<typeof vi.fn> }
    }

    expect(router.use).toHaveBeenNthCalledWith(1, saveSessionOnRedirect.middleware)
    expect(router.use).toHaveBeenNthCalledWith(2, flash.middleware)
    expect(router.use).toHaveBeenNthCalledWith(
      3,
      commonExpress.lib.errorHandling.redirectAsErrorToCallback
    )
    expect(router.use).toHaveBeenCalledTimes(3)

    const saveSessionCallOrder = vi.mocked(router.use).mock.invocationCallOrder[0]!
    const flashCallOrder = vi.mocked(router.use).mock.invocationCallOrder[1]!
    const routeConfigurationCallOrder = vi.mocked(routes.configure).mock.invocationCallOrder[0]!
    const redirectAsErrorCallOrder = vi.mocked(router.use).mock.invocationCallOrder[2]!

    expect(saveSessionCallOrder).toBeLessThan(flashCallOrder)
    expect(flashCallOrder).toBeLessThan(routeConfigurationCallOrder)
    expect(redirectAsErrorCallOrder).toBeGreaterThan(routeConfigurationCallOrder)
  })

  it('registers redirectAsErrorToCallback as the final router middleware', async () => {
    const { default: commonExpress } = await import('@govuk-one-login/di-ipv-cri-common-express')
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    const { router } = vi.mocked(commonExpress.bootstrap.setup).mock.results[0]!.value as {
      router: { use: ReturnType<typeof vi.fn> }
    }

    expect(router.use).toHaveBeenLastCalledWith(
      commonExpress.lib.errorHandling.redirectAsErrorToCallback
    )
  })

  it('passes the csrf secret from app config to bootstrap setup', async () => {
    vi.stubEnv('CSRF_SECRET', 'top-secret') // pragma: allowlist secret
    const commonExpress = (await import('@govuk-one-login/di-ipv-cri-common-express')).default
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    expect(commonExpress.bootstrap.setup).toHaveBeenCalledWith(
      expect.objectContaining({ csrf: { secret: 'top-secret' } }) // pragma: allowlist secret
    )
  })

  it('configures the helmet security policy', async () => {
    const { default: commonExpress } = await import('@govuk-one-login/di-ipv-cri-common-express')
    const { default: helmetConfig } = await import('@src/config/helmet')
    const { createApp } = await import('@src/app-bootstrap')
    await createApp()

    expect(commonExpress.bootstrap.setup).toHaveBeenCalledWith(
      expect.objectContaining({ helmet: helmetConfig })
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
    const {
      frontendUiMiddleware,
      locals: frontendUiLocals,
      setFrontendUiTranslations
    } = await import('@govuk-one-login/frontend-ui')
    const { default: commonExpress } = await import('@govuk-one-login/di-ipv-cri-common-express')
    const { createApp } = await import('@src/app-bootstrap')
    const { app } = await createApp()

    expect(commonExpress.lib.i18n.setI18n).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          additionalNamespaces: expect.arrayContaining(['translation', 'errors', 'pages'])
        }),
        onInit: setFrontendUiTranslations,
        router: app
      })
    )
    expect(app.use).toHaveBeenNthCalledWith(1, frontendUiMiddleware)
    expect(app.use).toHaveBeenNthCalledWith(2, frontendUiLocals.getGTM)
    expect(app.use).toHaveBeenNthCalledWith(3, frontendUiLocals.getLanguageToggle)
    expect(app.use).toHaveBeenNthCalledWith(4, frontendUiLocals.getDeviceIntelligence)
    expect(app.use).toHaveBeenNthCalledWith(5, commonExpress.lib.headers)
    expect(app.use).toHaveBeenNthCalledWith(6, commonExpress.lib.customFetch.customFetchMiddleware)
  })
})
