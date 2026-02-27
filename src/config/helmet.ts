import type { CommonExpressHelmetConfig } from '@govuk-one-login/di-ipv-cri-common-express/src/lib/helmet'

import helmetConfig from '@govuk-one-login/di-ipv-cri-common-express/src/lib/helmet'

const viteDevOverrides =
  process.env.NODE_ENV !== 'production'
    ? ({
        contentSecurityPolicy: {
          directives: {
            ...helmetConfig.contentSecurityPolicy.directives,
            connectSrc: [
              ...helmetConfig.contentSecurityPolicy.directives.connectSrc,
              'ws://localhost:*',
              'http://localhost:*'
            ],
            scriptSrc: [
              ...helmetConfig.contentSecurityPolicy.directives.scriptSrc,
              "'unsafe-inline'"
            ],
            styleSrc: [
              ...helmetConfig.contentSecurityPolicy.directives.styleSrc,
              "'unsafe-inline'"
            ],
            upgradeInsecureRequests: null, // required for safari local dev
            workerSrc: ['blob:']
          }
        },
        hsts: false // required for safari local dev
      } satisfies Partial<CommonExpressHelmetConfig>)
    : {}

export default { ...helmetConfig, ...viteDevOverrides }
