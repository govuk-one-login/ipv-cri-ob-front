import { defineConfig } from 'vitest/config'

import path from 'node:path'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcov'],
      reportsDirectory: 'coverage'
    },
    projects: [
      {
        resolve: {
          alias: {
            '@src': path.resolve(__dirname, 'src')
          }
        },
        test: {
          env: {
            API_BASE_URL: 'http://api.ob.cri.gov.uk:1337',
            CSRF_SECRET: 'not-a-real-csrf-secret', // pragma: allowlist secret
            SESSION_SECRET: 'not-a-real-secret', // pragma: allowlist secret
            USE_PINO_LOGGER: 'true' // this shouldn't be needed once common-express defaults to pino, prevents the 'config as early as possible' warning when running unit tests
          },
          include: ['test/unit/**/*.test.ts'],
          name: 'unit',
          setupFiles: ['test/unit/setup.ts']
        }
      },
      {
        test: {
          include: ['test/infra/**/*.test.ts'],
          name: 'infra'
        }
      },
      {
        resolve: {
          alias: {
            '@src': path.resolve(__dirname, 'src')
          }
        },
        test: {
          env: {
            API_BASE_URL: 'http://api.ob.cri.gov.uk:1337',
            CSRF_SECRET: 'not-a-real-csrf-secret', // pragma: allowlist secret
            LOG_LEVEL: 'silent',
            NODE_ENV: 'test',
            SESSION_SECRET: 'not-a-real-secret', // pragma: allowlist secret
            USE_PINO_LOGGER: 'true'
          },
          include: ['test/integration/**/*.integration.test.ts'],
          name: 'integration',
          setupFiles: ['test/integration/setup.ts']
        }
      }
    ],
    silent: 'passed-only'
  }
})
