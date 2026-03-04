import { config as loadDotenv } from 'dotenv'

loadDotenv({ quiet: true })

interface AppConfig {
  API: {
    BASE_URL: string
    PACKAGE_NAME: string
    PATHS: { AUTHORIZATION: string; SESSION: string }
  }
  APP: {
    BASE_URL: string
    DEVICE_INTELLIGENCE_DOMAIN: string
    DEVICE_INTELLIGENCE_ENABLED: string
    GTM: {
      ANALYTICS_COOKIE_DOMAIN: string
      ANALYTICS_DATA_SENSITIVE: boolean
      GA4_ENABLED: boolean
      GA4_FORM_CHANGE_ENABLED: boolean
      GA4_FORM_ERROR_ENABLED: boolean
      GA4_FORM_RESPONSE_ENABLED: boolean
      GA4_ID: string
      GA4_NAVIGATION_ENABLED: boolean
      GA4_PAGE_VIEW_ENABLED: boolean
      GA4_SELECT_CONTENT_ENABLED: boolean
    }
    PATHS: { OPENBANKING: string }
    SESSION: {
      COOKIE_NAME: string
      SECRET: string | undefined
      TABLE_NAME: string | undefined
      TTL: number
    }
  }
  PORT: number
}

export default {
  API: {
    BASE_URL: process.env.API_BASE_URL || 'http://localhost:5007/',
    PACKAGE_NAME: 'ipv-cri-ob-front',
    PATHS: {
      AUTHORIZATION: 'authorization',
      SESSION: 'session'
    }
  },
  APP: {
    BASE_URL: process.env.EXTERNAL_WEBSITE_HOST || 'http://localhost:5090',
    DEVICE_INTELLIGENCE_DOMAIN: process.env.DEVICE_INTELLIGENCE_DOMAIN || 'localhost',
    DEVICE_INTELLIGENCE_ENABLED: process.env.DEVICE_INTELLIGENCE_ENABLED || 'false',
    GTM: {
      ANALYTICS_COOKIE_DOMAIN: process.env.FRONTEND_DOMAIN || 'localhost',
      ANALYTICS_DATA_SENSITIVE: process.env.ANALYTICS_DATA_SENSITIVE !== 'false',
      GA4_ENABLED: process.env.GA4_ENABLED !== 'false',
      GA4_FORM_CHANGE_ENABLED: process.env.GA4_FORM_CHANGE_ENABLED === 'true',
      GA4_FORM_ERROR_ENABLED: process.env.GA4_FORM_ERROR_ENABLED !== 'false',
      GA4_FORM_RESPONSE_ENABLED: process.env.GA4_FORM_RESPONSE_ENABLED !== 'false',
      GA4_ID: process.env.GOOGLE_ANALYTICS_4_GTM_CONTAINER_ID || 'GTM-XXXXXXX',
      GA4_NAVIGATION_ENABLED: process.env.GA4_NAVIGATION_ENABLED === 'true',
      GA4_PAGE_VIEW_ENABLED: process.env.GA4_PAGE_VIEW_ENABLED !== 'false',
      GA4_SELECT_CONTENT_ENABLED: process.env.GA4_SELECT_CONTENT_ENABLED === 'true'
    },
    PATHS: {
      OPENBANKING: '/'
    },
    SESSION: {
      COOKIE_NAME: 'ob_session',
      SECRET: process.env.SESSION_SECRET || undefined,
      TABLE_NAME: process.env.SESSION_TABLE_NAME || undefined,
      TTL: Number(process.env.SESSION_TTL) || 7200000 // two hours in ms
    }
  },
  PORT: Number(process.env.PORT) || 5090
} satisfies AppConfig
