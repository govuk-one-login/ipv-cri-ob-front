import type { EcospendWebhookData } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import type { AxiosInstance } from 'axios'

import { createBaseClient } from '@src/clients/base.client'
import { createHmac } from 'node:crypto'

import appConfig from '@src/config/app'

const webhookClient = (axios: AxiosInstance) => {
  const client = createBaseClient(axios)
  return {
    send: (body: EcospendWebhookData): Promise<void> => {
      const serialisedBody = JSON.stringify(body)
      const signature = createHmac('sha256', appConfig.STUBS.WEBHOOK_SIGNING_SECRET)
        .update(serialisedBody)
        .digest('hex')
      return client.postWithHeaders(appConfig.API.PATHS.WEBHOOK, serialisedBody, {
        'Content-Type': 'application/json',
        'X-Signature': signature
      })
    }
  }
}

export { webhookClient }
