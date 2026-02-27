import { type frontendVitalSignsInitFromApp } from '@govuk-one-login/frontend-vital-signs'

type VitalSignsOptions = NonNullable<Parameters<typeof frontendVitalSignsInitFromApp>[1]>

export default {
  interval: 60000,
  logLevel: 'info',
  metrics: [
    'avgResponseTime',
    'eventLoopDelay',
    'eventLoopUtilization',
    'maxConcurrentConnections',
    'requestsPerSecond'
  ],
  staticPaths: [/^\/public\/.*/]
} satisfies VitalSignsOptions
