import { appConfig } from '../config'

import logger, {
  type AppLogger
} from '@govuk-one-login/di-ipv-cri-common-express/src/bootstrap/lib/logger'

let instance: AppLogger

export const getLogger = (): AppLogger => (instance ??= logger.get(appConfig.API.PACKAGE_NAME))
