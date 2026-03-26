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
        .mockReturnValue({ app: { set: vi.fn(), use: vi.fn() }, router: { use: vi.fn() } })
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
vi.mock('@src/middleware/force-session-save.middleware', () => ({
  forceSessionSaveBeforeRedirect: vi.fn()
}))
vi.mock('@src/utils/session', () => ({ default: vi.fn().mockResolvedValue({}) }))
vi.mock('@src/config/routes', () => ({ configure: vi.fn() }))
vi.mock('@src/config/helmet', () => ({ default: vi.fn().mockResolvedValue({}) }))

vi.mock('@src/utils/dev-tooling/dev-server', () => ({
  createViteServer: vi.fn().mockResolvedValue({}),
  setupDevServer: vi.fn()
}))

afterEach(() => {
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
})
