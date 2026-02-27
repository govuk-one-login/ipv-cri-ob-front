import type { AxiosInstance } from 'axios'

export {}

declare global {
  namespace Express {
    interface Locals {
      basePath?: string
      translations: unknown
    }
    interface Request {
      axios: AxiosInstance
      language?: string
    }
  }
}
