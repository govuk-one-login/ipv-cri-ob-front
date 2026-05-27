import type { HelmetOptions } from 'helmet'

import { getHelmetConfig } from '@govuk-one-login/frontend-ui'
import { alarmBadge, LOGGER } from '@src/utils/logger'

import appConfig from '@src/config/app'

interface HelmetCSP {
  directives: Record<string, string[]>
}

const helmetConfig = getHelmetConfig()

const viteDevOverrides = (): Partial<HelmetOptions> => {
  if (appConfig.APP.NODE_ENV === 'production') return {}

  LOGGER.warn(
    `${alarmBadge} insecure developer overrides are present in the content security policy`
  )

  const { directives: existingDirectives } = helmetConfig.contentSecurityPolicy as HelmetCSP

  return {
    contentSecurityPolicy: {
      directives: {
        ...existingDirectives,
        connectSrc: [
          ...(existingDirectives['connectSrc'] ?? []),
          'ws://localhost:*',
          'http://localhost:*'
        ],
        scriptSrc: [...(existingDirectives['scriptSrc'] ?? []), "'unsafe-inline'"],
        styleSrc: [...(existingDirectives['styleSrc'] ?? []), "'unsafe-inline'"],
        upgradeInsecureRequests: null, // required for safari local dev
        workerSrc: ['blob:']
      }
    },
    hsts: false // required for safari local dev
  } satisfies Partial<HelmetOptions>
}

export default { ...helmetConfig, ...viteDevOverrides() } as HelmetOptions
