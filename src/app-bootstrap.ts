import type { Express, Router } from 'express'

import {
  locals as frontendUiLocals,
  frontendUiMiddleware,
  settings as frontendUiSettings,
  setFrontendUiTranslations
} from '@govuk-one-login/frontend-ui'
import { frontendVitalSignsInitFromApp } from '@govuk-one-login/frontend-vital-signs'
import { flash, saveSessionOnRedirect } from '@src/middleware'
import { debugMenu } from '@src/utils/dev-tooling/debug-menu'
import { setupDevServer } from '@src/utils/dev-tooling/dev-server'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'
import helmetConfig from '@src/config/helmet'
import overloadProtectionConfig from '@src/config/overload-protection'
import vitalSignsConfig from '@src/config/vital-signs'
import initSessionStore from '@src/utils/session'
import path from 'node:path'

import * as routes from '@src/config/routes'

export const createApp = async (): Promise<{ app: Express; router: Router }> => {
  const session = await initSessionStore()

  const { app, router } = commonExpress.bootstrap.setup({
    env: appConfig.APP.NODE_ENV,
    helmet: helmetConfig,
    middlewareSetupFn: (app: Express) => {
      if (appConfig.APP.NODE_ENV === 'development') setupDevServer(app)
      commonExpress.lib.i18n.setI18n({
        config: {
          additionalNamespaces: ['translation', 'errors'], // 'translation' is the namespace frontend-ui provides for common components (cookie banner, progress button etc)
          cookieDomain: appConfig.APP.GTM.ANALYTICS_COOKIE_DOMAIN
        },
        onInit: setFrontendUiTranslations,
        router: app
      })
      app.use(frontendUiMiddleware)
      app.use(frontendUiLocals.getGTM)
      app.use(frontendUiLocals.getLanguageToggle)
      app.use(frontendUiLocals.getDeviceIntelligence)
      if (appConfig.APP.NODE_ENV === 'production')
        frontendVitalSignsInitFromApp(app, vitalSignsConfig)
      app.use(commonExpress.lib.headers)
      app.use(commonExpress.lib.customFetch.customFetchMiddleware)
    },
    overloadProtection: overloadProtectionConfig,
    publicDirs: [path.resolve(import.meta.dirname, 'public')],
    requestLogging: appConfig.APP.NODE_ENV === 'production',
    session,
    csrf: { secret: appConfig.APP.CSRF_SECRET },
    views: [path.resolve(import.meta.dirname, 'views'), debugMenu.viewsDir]
  })

  app.set('view engine', 'njk')
  app.set('API.BASE_URL', appConfig.API.BASE_URL)
  app.set('API.PATHS.SESSION', appConfig.API.PATHS.SESSION)
  app.set('API.PATHS.AUTHORIZATION', appConfig.API.PATHS.AUTHORIZATION)
  app.set('APP.PATHS.ENTRYPOINT', appConfig.APP.PATHS.OPEN_BANKING)

  frontendUiSettings.setGTM({
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
    ga4SelectContentEnabled: appConfig.APP.GTM.GA4_SELECT_CONTENT_ENABLED
  })

  frontendUiSettings.setLanguageToggle({
    app,
    showLanguageToggle: true
  })

  frontendUiSettings.setDeviceIntelligence({
    app,
    deviceIntelligenceDomain: appConfig.APP.DEVICE_INTELLIGENCE_DOMAIN,
    deviceIntelligenceEnabled: appConfig.APP.DEVICE_INTELLIGENCE_ENABLED
  })

  if (appConfig.APP.NODE_ENV === 'development') debugMenu.register(router)

  router.use(saveSessionOnRedirect.middleware)
  router.use(flash.middleware)
  routes.configure(router)
  router.use(commonExpress.lib.errorHandling.redirectAsErrorToCallback)

  return { app, router }
}
