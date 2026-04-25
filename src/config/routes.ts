import type { Router } from 'express'

import { appConfig, paths } from './index'
import { indexController, stubs } from '@src/controllers'
import { getLogger } from '@src/utils/logger'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'

const LOGGER = getLogger()

const configure = (router: Router) => {
  router.use(paths.oauth2, commonExpress.routes.oauth2)
  router.get(paths.index, indexController.get)
  if (appConfig.APP.NODE_ENV != 'production') {
    LOGGER.warn('stubs are active')
    router.get(paths.stubs.webhook, stubs.webhookController.get)
    router.post(paths.stubs.webhook, stubs.webhookController.post)
  }
}

export { configure }
