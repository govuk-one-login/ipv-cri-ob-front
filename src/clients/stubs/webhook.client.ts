import type { EcospendWebhookData } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import type { Request } from 'express'

import { createBaseClient } from '@src/clients/base.client'
import { createHmac } from 'node:crypto'

import appConfig from '@src/config/app'

const webhookClient = (req: Request) => {
  const client = createBaseClient(req)
  return {
    send: (body: EcospendWebhookData): Promise<void> => {
      const serialisedBody = JSON.stringify(body)
      const signature = createHmac('sha256', appConfig.STUBS.WEBHOOK_SIGNING_SECRET)
        .update(serialisedBody)
        .digest('hex')
      return client.post(appConfig.API.PATHS.WEBHOOK, serialisedBody, {
        'Content-Type': 'application/json',
        'X-Signature': signature
      })
    }
  }
}

export { webhookClient }
