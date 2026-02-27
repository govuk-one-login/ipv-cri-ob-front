import type { AppLogger } from '@govuk-one-login/di-ipv-cri-common-express'

import { name as packageName } from '../../package.json'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'

let instance: AppLogger

export const getLogger = (): AppLogger =>
  (instance ??= commonExpress.bootstrap.logger.get(packageName))
