import type { Router } from 'express'

import { steps, stubs } from '@src/controllers'
import { requireSessionKey } from '@src/middleware'
import { asyncControllerHandler } from '@src/utils/async-controller-handler'
import { LOGGER } from '@src/utils/logger'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'
import paths from '@src/config/paths'

const configure = (router: Router) => {
  router.use(paths.oauth2, commonExpress.routes.oauth2)
  router.get(paths.index, (_req, res) => {
    res.redirect(paths.steps.start)
  })
  router.get(paths.steps.start, steps.startController.get)
  router.get(paths.steps.chooseBank, asyncControllerHandler(steps.chooseBankController.get))
  router.post(paths.steps.chooseBank, asyncControllerHandler(steps.chooseBankController.post))
  router.get(
    paths.steps.consent,
    requireSessionKey.middleware('bankID', paths.steps.chooseBank),
    steps.consentController.get
  )
  router.post(
    paths.steps.consent,
    requireSessionKey.middleware('bankID', paths.steps.chooseBank),
    asyncControllerHandler(steps.consentController.post)
  )
  if (appConfig.STUBS.ENABLED) {
    LOGGER.warn('\x1b[97;101mSTUBS ARE ENABLED\x1b[0m')
    router.get(
      paths.stubs.webhook,
      requireSessionKey.middleware('consentID', paths.steps.consent),
      stubs.webhookController.get
    )
    router.post(
      paths.stubs.webhook,
      requireSessionKey.middleware('consentID', paths.steps.consent),
      asyncControllerHandler(stubs.webhookController.post)
    )
  }
}

export { configure }
