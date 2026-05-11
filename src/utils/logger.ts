import type { AppLogger } from '@govuk-one-login/di-ipv-cri-common-express'

import { name as packageName } from '../../package.json'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'

let instance: AppLogger

const getLogger = (): AppLogger => (instance ??= commonExpress.bootstrap.logger.get(packageName))

const LOGGER = new Proxy({} as AppLogger, {
  get(_target, prop) {
    return Reflect.get(getLogger(), prop) as AppLogger
  }
})

export { LOGGER }
