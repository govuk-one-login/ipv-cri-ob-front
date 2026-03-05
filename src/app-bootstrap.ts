import type { Express, Router } from 'express'
import type { ViteDevServer } from 'vite'

import {
  appConfig,
  helmetConfig,
  loggingConfig,
  overloadProtectionConfig,
  vitalSignsConfig
} from './config'
import { forceSessionSaveBeforeRedirect } from './middleware/force-session-save.middleware'
import { createViteServer, setupDevServer } from './utils/dev-tooling/dev-server'
import { frontendUiMiddlewareIdentityBypass } from '@govuk-one-login/frontend-ui'
import { frontendVitalSignsInitFromApp } from '@govuk-one-login/frontend-vital-signs'

import i18nextMiddleware from './middleware/i18next.middleware'
import initSessionStore from './utils/session'
import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import path from 'path'

import * as routes from './routes'

const APP_ROOT = process.cwd()
const { NODE_ENV } = process.env

export const createApp = async (): Promise<{ app: Express; router: Router }> => {
  const vite: null | ViteDevServer = NODE_ENV === 'development' ? await createViteServer() : null

  const { app, router } = commonExpress.bootstrap.setup({
    config: { APP_ROOT },
    env: NODE_ENV ?? 'development',
    helmet: helmetConfig,
    logs: loggingConfig, // hmpo logger only
    middlewareSetupFn: (app: Express) => {
      if (vite) setupDevServer(app, vite)
      app.use(forceSessionSaveBeforeRedirect)
      app.use(i18nextMiddleware) // getLanguageToggle support
      app.use(frontendUiMiddlewareIdentityBypass)
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
    requestLogging: NODE_ENV === 'production',
    session: await initSessionStore(),
    translation: {
      allowedLangs: ['en', 'cy'],
      cookie: { name: 'lng' },
      fallbackLang: ['en'],
      query: 'lng'
    },
    views: ['node_modules/@govuk-one-login/', path.resolve(import.meta.dirname, 'views')]
  })

  app.set('view engine', 'njk')
  app.set('API.BASE_URL', appConfig.API.BASE_URL)
  app.set('API.PATHS.SESSION', appConfig.API.PATHS.SESSION)
  app.set('API.PATHS.AUTHORIZATION', appConfig.API.PATHS.AUTHORIZATION)
  app.set('APP.PATHS.ENTRYPOINT', appConfig.APP.PATHS.OPENBANKING)

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

  routes.configure(router)
  return { app, router }
}
