import type { ConsentRequestData, ConsentResponse } from '@src/models/consent.class'
import type { AxiosInstance } from 'axios'

import { createBaseClient } from './base.client'
import { randomUUID } from 'node:crypto'

const consentsClient = (axios: AxiosInstance) => {
  const client = createBaseClient(axios)
  return {
    createConsent: (body: ConsentRequestData): Promise<ConsentResponse> =>
      // client.post(appConfig.API.PATHS.CONSENT, body) // TODO: use the consents api instead of returning dummy data
      client.stub<ConsentResponse>({
        bankConsentUrl: new URL('https://localhost:1337/consent'),
        bankID: body.bank_id,
        consentID: randomUUID(),
        redirectUrl: new URL('https://localhost:1337/redirect')
      })
  }
}

export { consentsClient }
