import type { AppLogger } from '@govuk-one-login/di-ipv-cri-common-express'

import { name as packageName } from '../../package.json'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'

let instance: AppLogger

const getLogger = (): AppLogger => (instance ??= commonExpress.bootstrap.logger.get(packageName))

const alarmBadge =
  appConfig.APP.DEPLOYMENT_ENV === 'local' ? '\x1b[97;101m[alarm]\x1b[0m\x1b[36m' : '[alarm]'

const LOGGER = new Proxy({} as AppLogger, {
  get(_target, prop) {
    return Reflect.get(getLogger(), prop) as AppLogger
  }
})

export { alarmBadge, LOGGER }
