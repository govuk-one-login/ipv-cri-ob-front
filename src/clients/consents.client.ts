import type { RawAxiosRequestHeaders } from 'axios'
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
      headers: RawAxiosRequestHeaders = {}
    ): Promise<ConsentResponse> => {
      const data = await client.post<ConsentRequestData, ConsentResponseData>(
        appConfig.API.PATHS.CONSENT,
        body,
        headers
      )
      return ConsentResponse.fromData(data)
    }
  }
}

export { consentsClient }
