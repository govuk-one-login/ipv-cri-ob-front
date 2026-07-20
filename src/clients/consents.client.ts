import type { Request } from 'express'

import { createBaseClient } from './base.client'
import {
  type ConsentRequestData,
  ConsentResponse,
  type ConsentResponseData
} from '@src/models/consent.class'

import appConfig from '@src/config/app'

const consentsClient = (req: Request) => {
  const client = createBaseClient(req)
  return {
    createConsent: async (
      body: ConsentRequestData,
      headers: Record<string, string> = {}
    ): Promise<ConsentResponse> => {
      const res = await client.post(appConfig.API.PATHS.CONSENT, JSON.stringify(body), headers)
      const data = (await res.json()) as ConsentResponseData
      return ConsentResponse.fromData(data)
    }
  }
}

export { consentsClient }
