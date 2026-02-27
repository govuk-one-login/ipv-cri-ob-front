import { defineConfig } from 'vitest/config'

import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src')
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcov'],
      reportsDirectory: 'coverage'
    },
    env: {
      API_BASE_URL: 'http://api.ob.cri.gov.uk:1337',
      SESSION_SECRET: 'not-a-real-secret', // pragma: allowlist secret
      USE_PINO_LOGGER: 'true' // this shouldn't be needed once common-express defaults to pino, prevents the 'config as early as possible' warning when running unit tests
    },
    include: ['test/unit/**/*.test.ts'],
    setupFiles: ['test/unit/setup.ts'],
    silent: 'passed-only'
  }
})
