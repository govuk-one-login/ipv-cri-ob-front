import type { Router } from 'express'

import { paths } from './config'
import { indexController } from './controllers/index'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'

const configure = (router: Router) => {
  router.use(paths.oauth2, commonExpress.routes.oauth2)
  router.get(paths.index, indexController.get)
}

export { configure }
