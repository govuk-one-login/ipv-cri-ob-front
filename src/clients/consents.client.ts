import type { ConsentsRequest, ConsentsResponse } from '@src/models/consents'
import type { Request } from 'express'

import { createBaseClient } from './base.client'

import appConfig from '@src/config/app'

const consentsClient = (req: Request) => {
  const client = createBaseClient(req)
  return {
    createConsent: async (
      body: ConsentsRequest,
      headers: Record<string, string> = {}
    ): Promise<ConsentsResponse> => {
      const res = await client.post(appConfig.API.PATHS.CONSENTS, JSON.stringify(body), headers)
      return (await res.json()) as ConsentsResponse
    }
  }
}

export { consentsClient }
