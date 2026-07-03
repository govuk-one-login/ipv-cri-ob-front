import type { Router } from 'express'
import type { SessionData } from 'express-session'

import { steps, stubs } from '@src/controllers'
import { detectDevice } from '@src/middleware'
import { walkWizard } from '@src/utils/dev-tooling/wizard-diagram'
import { alarmBadge, LOGGER } from '@src/utils/logger'
import { createWizard } from '@src/utils/wizard'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'
import paths from '@src/config/paths'

const openBankingJourney = createWizard<SessionData>('ob-journey', {
  [paths.steps.start]: {
    entryPoint: true,
    reset: true,
    next: [paths.steps.chooseBank, paths.steps.proveAnotherWay],
    controller: steps.startController
  },
  [paths.steps.chooseBank]: {
    next: [paths.steps.consent, paths.failureSteps.bankUnavailable, paths.steps.proveAnotherWay],
    controller: steps.chooseBankController
  },
  [paths.steps.consent]: {
    next: [paths.steps.selectSignInMethod, paths.failureSteps.bankUnavailable, paths.stubs.webhook],
    noReturn: true,
    prereq: { keys: ['bankID'], redirectTo: paths.steps.chooseBank },
    controller: steps.consentController
  },
  [paths.steps.selectSignInMethod]: {
    next: [paths.steps.scanQuickResponseCode],
    prereq: { keys: ['consentID'], redirectTo: paths.steps.consent }
  },
  [paths.steps.scanQuickResponseCode]: {
    next: [paths.steps.scannedQuickResponseCodeHolding],
    noReturn: true
  },
  [paths.steps.scannedQuickResponseCodeHolding]: {
    next: [paths.steps.checkDetailsHolding, paths.failureSteps.useACurrentAccount],
    noReturn: true
  },
  [paths.steps.checkDetailsHolding]: {
    next: [paths.failureSteps.couldNotConfirmIdentity],
    entryPoint: true,
    noReturn: true
  },
  [paths.failureSteps.bankUnavailable]: {
    next: [paths.steps.chooseBank],
    noReturn: true
  },
  [paths.failureSteps.useACurrentAccount]: {
    next: [paths.steps.chooseBank, paths.steps.consent],
    noReturn: true
  },
  [paths.failureSteps.couldNotConfirmIdentity]: {
    next: [paths.steps.chooseBank],
    noReturn: true
  },
  [paths.steps.proveAnotherWay]: {
    next: [paths.oauth2.callback],
    controller: steps.proveAnotherWayController
  },
  ...(appConfig.STUBS.ENABLED
    ? {
        [paths.stubs.webhook]: {
          next: ['/', paths.stubs.webhook, paths.steps.checkDetailsHolding],
          prereq: { keys: ['consentID'], redirectTo: paths.steps.consent },
          controller: stubs.webhookController
        }
      }
    : {})
})

const configure = (router: Router) => {
  if (appConfig.STUBS.ENABLED) LOGGER.warn(`${alarmBadge} stubs are enabled`)
  if (LOGGER.isLevelEnabled('debug')) walkWizard(openBankingJourney, LOGGER)
  router.use(paths.oauth2.index, commonExpress.routes.oauth2)
  router.get(paths.index, detectDevice.middleware, (_req, res) => {
    res.redirect(paths.steps.start)
  })
  openBankingJourney.register(router)
}

export { configure }
