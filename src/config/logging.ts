import type { BootstrapSetupOptions } from '@govuk-one-login/di-ipv-cri-common-express'

// only applicable to hmpo-logger; pino reads LOGS_LEVEL from env and is not app-configurable
export default {
  app: false,
  console: true,
  consoleJSON: true,
  consoleLevel: 'info'
} satisfies Exclude<BootstrapSetupOptions['logs'], false | undefined>
