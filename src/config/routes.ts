import type { Router } from 'express'

import { steps, stubs } from '@src/controllers'
import { requireSession, requireSessionKey } from '@src/middleware'
import { asyncControllerHandler } from '@src/utils/async-controller-handler'
import { alarmBadge, LOGGER } from '@src/utils/logger'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'
import paths from '@src/config/paths'

const configure = (router: Router) => {
  router.use(paths.oauth2, commonExpress.routes.oauth2)
  router.get(paths.index, (_req, res) => {
    res.redirect(paths.steps.start)
  })
  router.get(paths.steps.start, requireSession.middleware, steps.startController.get)
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
    LOGGER.warn(`${alarmBadge} stubs are enabled`)
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
  router.get(paths.errors.sessionEnded, (_req, res) => res.render('errors/session-ended'))
  router.get(paths.errors.sessionMissing, (_req, res) => res.render('errors/session-missing'))
}

export { configure }
