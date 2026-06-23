import type { AxiosInstance } from 'axios'
import type { i18n } from 'i18next'
import type { TOptions } from 'i18next'

export {}

declare module 'express-session' {
  interface SessionData {
    bankID?: string
    bankName?: string
    consentID?: string
    flash?: {
      message: {
        content?: string
        header: string
      }
      type: 'error' | 'info' | 'success'
    }[]
    isMobile?: boolean
    webhooksSent?: Record<string, { accountAssessment?: string; consent?: string }>
    wizard: Record<string, { history: string[] }>
  }
}

declare global {
  namespace Express {
    interface Locals {
      translate: (key: string, options?: TOptions & { default?: string }) => string
    }
    interface Request {
      axios: AxiosInstance
      i18n: i18n
    }
  }
}
