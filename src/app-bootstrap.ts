import type { Express, Router } from 'express'
import type { ViteDevServer } from 'vite'

import { frontendUiMiddlewareIdentityBypass } from '@govuk-one-login/frontend-ui'
import { frontendVitalSignsInitFromApp } from '@govuk-one-login/frontend-vital-signs'
import { flash } from '@src/middleware/flash.middleware'
import { forceSessionSaveBeforeRedirect } from '@src/middleware/force-session-save.middleware'
import { createViteServer, setupDevServer } from '@src/utils/dev-tooling/dev-server'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'
import helmetConfig from '@src/config/helmet'
import overloadProtectionConfig from '@src/config/overload-protection'
import vitalSignsConfig from '@src/config/vital-signs'
import initSessionStore from '@src/utils/session'
import path from 'node:path'

import * as routes from '@src/config/routes'

const APP_ROOT = process.cwd()

export const createApp = async (): Promise<{ app: Express; router: Router }> => {
  const vite: null | ViteDevServer =
    appConfig.APP.NODE_ENV === 'development' ? await createViteServer() : null

  const { app, router } = commonExpress.bootstrap.setup({
    config: { APP_ROOT },
    env: appConfig.APP.NODE_ENV,
    helmet: helmetConfig,
    middlewareSetupFn: (app: Express) => {
      if (vite) setupDevServer(app, vite)
      commonExpress.lib.i18n.setI18n({
        config: {
          cookieDomain: appConfig.APP.GTM.ANALYTICS_COOKIE_DOMAIN
        },
        router: app
      })
      app.use(frontendUiMiddlewareIdentityBypass)
      app.use(forceSessionSaveBeforeRedirect)
      app.use(commonExpress.lib.locals.getGTM)
      app.use(commonExpress.lib.locals.getLanguageToggle)
      app.use(commonExpress.lib.locals.getDeviceIntelligence)
      frontendVitalSignsInitFromApp(app, vitalSignsConfig)
      app.use(commonExpress.lib.headers)
      app.use(commonExpress.lib.axios)
    },
    overloadProtection: overloadProtectionConfig,
    port: false, // app startup controlled in index.ts
    publicDirs: [path.resolve(import.meta.dirname, 'public')],
    redis: false,
    requestLogging: appConfig.APP.NODE_ENV === 'production',
    session: await initSessionStore(),
    translation: {
      allowedLangs: ['en', 'cy'],
      cookie: { name: 'lng' },
      fallbackLang: ['en'],
      query: 'lng'
    },
    views: [
      'node_modules/@govuk-one-login/',
      'node_modules/govuk-frontend/dist',
      path.resolve(import.meta.dirname, 'views')
    ]
  })

  app.set('view engine', 'njk')
  app.set('API.BASE_URL', appConfig.API.BASE_URL)
  app.set('API.PATHS.SESSION', appConfig.API.PATHS.SESSION)
  app.set('API.PATHS.AUTHORIZATION', appConfig.API.PATHS.AUTHORIZATION)
  app.set('APP.PATHS.ENTRYPOINT', appConfig.APP.PATHS.OPEN_BANKING)

  commonExpress.lib.settings.setGTM({
    analyticsCookieDomain: appConfig.APP.GTM.ANALYTICS_COOKIE_DOMAIN,
    analyticsDataSensitive: appConfig.APP.GTM.ANALYTICS_DATA_SENSITIVE,
    app,
    ga4ContainerId: appConfig.APP.GTM.GA4_ID,
    ga4Enabled: appConfig.APP.GTM.GA4_ENABLED,
    ga4FormChangeEnabled: appConfig.APP.GTM.GA4_FORM_CHANGE_ENABLED,
    ga4FormErrorEnabled: appConfig.APP.GTM.GA4_FORM_ERROR_ENABLED,
    ga4FormResponseEnabled: appConfig.APP.GTM.GA4_FORM_RESPONSE_ENABLED,
    ga4NavigationEnabled: appConfig.APP.GTM.GA4_NAVIGATION_ENABLED,
    ga4PageViewEnabled: appConfig.APP.GTM.GA4_PAGE_VIEW_ENABLED,
    ga4SelectContentEnabled: appConfig.APP.GTM.GA4_SELECT_CONTENT_ENABLED,
    uaEnabled: false
  })

  commonExpress.lib.settings.setDeviceIntelligence({
    app,
    deviceIntelligenceDomain: appConfig.APP.DEVICE_INTELLIGENCE_DOMAIN,
    deviceIntelligenceEnabled: appConfig.APP.DEVICE_INTELLIGENCE_ENABLED
  })

  router.use(flash)
  routes.configure(router)
  // error handling must be last
  router.use(commonExpress.lib.errorHandling.redirectAsErrorToCallback)

  return { app, router }
}
