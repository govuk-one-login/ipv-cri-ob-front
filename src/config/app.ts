import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

loadDotenv({ quiet: true })

const NodeEnvSchema = z.enum(['development', 'production', 'test'])

const AppConfigSchema = z.object({
  API: z.object({
    BASE_URL: z.url(),
    PATHS: z.object({
      AUTHORIZATION: z.string().nonempty(),
      SESSION: z.string().nonempty()
    })
  }),
  APP: z.object({
    BIND_HOST: z.string().nonempty(),
    DEVICE_INTELLIGENCE_DOMAIN: z.string().nonempty(),
    DEVICE_INTELLIGENCE_ENABLED: z.string().nonempty(),
    GTM: z.object({
      ANALYTICS_COOKIE_DOMAIN: z.string().nonempty(),
      ANALYTICS_DATA_SENSITIVE: z.boolean(),
      GA4_ENABLED: z.boolean(),
      GA4_FORM_CHANGE_ENABLED: z.boolean(),
      GA4_FORM_ERROR_ENABLED: z.boolean(),
      GA4_FORM_RESPONSE_ENABLED: z.boolean(),
      GA4_ID: z.string().nonempty(),
      GA4_NAVIGATION_ENABLED: z.boolean(),
      GA4_PAGE_VIEW_ENABLED: z.boolean(),
      GA4_SELECT_CONTENT_ENABLED: z.boolean()
    }),
    NODE_ENV: NodeEnvSchema,
    PATHS: z.object({ OPEN_BANKING: z.string().nonempty() }),
    PORT: z.number().int().positive(),
    SESSION: z.object({
      COOKIE_NAME: z.string().nonempty(),
      SECRET: z.string().nonempty(),
      TABLE_NAME: z.string().nonempty(),
      TTL: z.number().int().positive()
    }),
    USE_PINO_LOGGER: z.literal(true)
  })
})

export type AppConfig = z.infer<typeof AppConfigSchema>

export default AppConfigSchema.parse({
  API: {
    BASE_URL: process.env['API_BASE_URL']!,
    PATHS: {
      AUTHORIZATION: 'authorization',
      SESSION: 'session'
    }
  },
  APP: {
    BIND_HOST: process.env['BIND_HOST'] || '127.0.0.1',
    DEVICE_INTELLIGENCE_DOMAIN: process.env['DEVICE_INTELLIGENCE_DOMAIN'] || 'localhost',
    DEVICE_INTELLIGENCE_ENABLED: process.env['DEVICE_INTELLIGENCE_ENABLED'] || 'false',
    GTM: {
      ANALYTICS_COOKIE_DOMAIN: process.env['FRONTEND_DOMAIN'] || 'localhost',
      ANALYTICS_DATA_SENSITIVE: process.env['ANALYTICS_DATA_SENSITIVE'] === 'true',
      GA4_ENABLED: process.env['GA4_ENABLED'] === 'true',
      GA4_FORM_CHANGE_ENABLED: process.env['GA4_FORM_CHANGE_ENABLED'] === 'true',
      GA4_FORM_ERROR_ENABLED: process.env['GA4_FORM_ERROR_ENABLED'] === 'true',
      GA4_FORM_RESPONSE_ENABLED: process.env['GA4_FORM_RESPONSE_ENABLED'] === 'true',
      GA4_ID: process.env['GOOGLE_ANALYTICS_4_GTM_CONTAINER_ID'] || 'GTM-XXXXXXX',
      GA4_NAVIGATION_ENABLED: process.env['GA4_NAVIGATION_ENABLED'] === 'true',
      GA4_PAGE_VIEW_ENABLED: process.env['GA4_PAGE_VIEW_ENABLED'] === 'true',
      GA4_SELECT_CONTENT_ENABLED: process.env['GA4_SELECT_CONTENT_ENABLED'] === 'true'
    },
    NODE_ENV: (process.env['NODE_ENV'] || 'development') as z.infer<typeof NodeEnvSchema>,
    PATHS: {
      OPEN_BANKING: '/'
    },
    PORT: Number(process.env['PORT']) || 5090,
    SESSION: {
      COOKIE_NAME: 'ob_session',
      SECRET: process.env['SESSION_SECRET']!,
      TABLE_NAME: process.env['SESSION_TABLE_NAME'] || 'ob-front-sessions',
      TTL: Number(process.env['SESSION_TTL']) || 7200000 // two hours in ms
    },
    USE_PINO_LOGGER: process.env['USE_PINO_LOGGER'] === 'true'
  }
})
