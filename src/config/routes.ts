import type { Router } from 'express'

import { steps, stubs } from '@src/controllers'
import { getLogger } from '@src/utils/logger'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'
import paths from '@src/config/paths'

const configure = (router: Router) => {
  router.use(paths.oauth2, commonExpress.routes.oauth2)
  router.get(paths.index, (_req, res) => {
    res.redirect(paths.steps.start)
  })
  router.get(paths.steps.start, steps.startController.get)
  if (appConfig.APP.NODE_ENV != 'production') {
    getLogger().warn('\x1b[97;101mSTUBS ARE ACTIVE\x1b[0m')
    router.get(paths.stubs.webhook, stubs.webhookController.get)
    router.post(paths.stubs.webhook, (req, res, next) => {
      stubs.webhookController.post(req, res, next).catch(next)
    })
  }
}

export { configure }
