import type { AxiosInstance } from 'axios'
import type { TOptions } from 'i18next'

export {}

declare module 'express-session' {
  interface SessionData {
    flash?: {
      message: {
        content?: string
        header: string
      }
      type: 'error' | 'info' | 'success'
    }[]
    webhooksSent?: Record<string, { accountAssessment?: string; consent?: string }>
  }
}

declare global {
  namespace Express {
    interface Locals {
      basePath?: string
      translate: (key: string, options?: TOptions & { default?: string }) => string
      translations: unknown
    }
    interface Request {
      axios: AxiosInstance
      i18n: {
        language: string
        store: { data: Record<string, unknown> }
      }
      language?: string
    }
  }
}
