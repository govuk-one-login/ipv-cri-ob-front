import type { CommonExpressHelmetConfig } from '@govuk-one-login/di-ipv-cri-common-express'

import { getLogger } from '@src/utils/logger'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'
import appConfig from '@src/config/app'

const helmetConfig = commonExpress.lib.helmet

const viteDevOverrides = () => {
  if (appConfig.APP.NODE_ENV === 'production') return {}

  getLogger().warn(
    '\x1b[97;101mINSECURE DEVELOPER OVERRIDES ARE PRESENT IN THE CONTENT SECURITY POLICY\x1b[0m'
  )

  return {
    contentSecurityPolicy: {
      directives: {
        ...helmetConfig.contentSecurityPolicy.directives,
        connectSrc: [
          ...helmetConfig.contentSecurityPolicy.directives.connectSrc,
          'ws://localhost:*',
          'http://localhost:*'
        ],
        scriptSrc: [...helmetConfig.contentSecurityPolicy.directives.scriptSrc, "'unsafe-inline'"],
        styleSrc: [...helmetConfig.contentSecurityPolicy.directives.styleSrc, "'unsafe-inline'"],
        upgradeInsecureRequests: null, // required for safari local dev
        workerSrc: ['blob:']
      }
    },
    hsts: false // required for safari local dev
  } satisfies Partial<CommonExpressHelmetConfig>
}

export default { ...helmetConfig, ...viteDevOverrides() }
