import type { HelmetOptions } from 'helmet'

import { getHelmetConfig } from '@govuk-one-login/frontend-ui'
import { alarmBadge, LOGGER } from '@src/utils/logger'

import appConfig from '@src/config/app'

const helmetConfig = getHelmetConfig() as HelmetOptions & {
  contentSecurityPolicy: { directives: Record<string, string[]> }
}

const viteDevOverrides = (): Partial<HelmetOptions> => {
  if (appConfig.APP.NODE_ENV === 'production') return {}

  LOGGER.warn(
    `${alarmBadge} insecure developer overrides are present in the content security policy`
  )

  const { directives } = helmetConfig.contentSecurityPolicy

  return {
    contentSecurityPolicy: {
      directives: {
        ...directives,
        connectSrc: [...(directives['connectSrc'] ?? []), 'ws://localhost:*', 'http://localhost:*'],
        scriptSrc: [...(directives['scriptSrc'] ?? []), "'unsafe-inline'"],
        styleSrc: [...(directives['styleSrc'] ?? []), "'unsafe-inline'"],
        upgradeInsecureRequests: null, // required for safari local dev
        workerSrc: ['blob:']
      }
    },
    hsts: false // required for safari local dev
  } satisfies Partial<HelmetOptions>
}

export default { ...helmetConfig, ...viteDevOverrides() } as HelmetOptions
