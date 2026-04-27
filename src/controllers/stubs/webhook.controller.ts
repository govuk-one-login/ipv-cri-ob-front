import type {
  AccountAssessmentCompleteEventValue,
  ConsentJourneyCompleteEventValue,
  ConsentStatusChangeEventValue,
  EventValue
} from '@src/types/ecospend/webhooks/event-value'
import type { RecordType } from '@src/types/ecospend/webhooks/record-type'
import type { NextFunction, Request, Response } from 'express'

import { EcospendWebhookBuilder } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import { addFlash } from '@src/utils/flash'
import { getLogger } from '@src/utils/logger'
import { createHmac, randomUUID } from 'node:crypto'

import paths from '@src/config/paths'

interface OutcomeOption<T = never> {
  text: string
  value: T
}

const consentOutcomeOptions: OutcomeOption<
  ConsentJourneyCompleteEventValue | ConsentStatusChangeEventValue
>[] = [
  {
    text: 'Authorised',
    value: 'Authorized'
  },
  {
    text: 'Cancelled',
    value: 'Canceled'
  },
  {
    text: 'Failed',
    value: 'Failed'
  },
  {
    text: 'Rejected',
    value: 'Rejected'
  }
]

const accountAssessmentOutcomeOptions: OutcomeOption<AccountAssessmentCompleteEventValue>[] = [
  {
    text: 'Valid',
    value: 'Valid'
  },
  {
    text: 'Not valid',
    value: 'NotValid'
  }
]

const withSelected = <T>(
  options: OutcomeOption<T>[],
  selected: unknown
): (OutcomeOption<T> & { selected: boolean })[] =>
  options.map((o) => ({ ...o, selected: o.value === selected }))

const get = (req: Request, res: Response, _next: NextFunction) => {
  getLogger().debug(req.query)
  return res.render('pages/stubs/index.njk', {
    accountAssessmentOutcomeOptions: withSelected(
      accountAssessmentOutcomeOptions,
      req.query['accountAssessment']
    ),
    consentID: req.query['consent_id'],
    consentOutcomeOptions: withSelected(consentOutcomeOptions, req.query['consent'])
  })
}

const resolveWebhookConfig = (body: {
  accountAssessment?: string
  consent?: string
}): null | { eventValue: EventValue; recordType: RecordType } => {
  if (body.consent !== undefined) {
    const option = consentOutcomeOptions.find((o) => o.value === body.consent)
    return option ? { eventValue: option.value, recordType: 'Consent' } : null
  }
  if (body.accountAssessment !== undefined) {
    const option = accountAssessmentOutcomeOptions.find((o) => o.value === body.accountAssessment)
    return option ? { eventValue: option.value, recordType: 'AccountAssessment' } : null
  }
  return null
}

const post = (req: Request, res: Response, _next: NextFunction) => {
  const consentID = req.query['consent_id'] as string
  const body = req.body as { accountAssessment?: string; consent?: string }
  const config = resolveWebhookConfig(body)

  if (config) {
    const webhook = EcospendWebhookBuilder.create()
      .setConsentID(consentID)
      .setEventID(randomUUID())
      .setEventValue(config.eventValue)
      .setEventTimestamp(new Date())
      .setRecordID(randomUUID())
      .setRecordType(config.recordType)
      .build()

    const webhookBody = JSON.stringify(webhook)
    getLogger().debug(webhookBody)

    addFlash(req, {
      message: { content: JSON.stringify(webhook, null, 2), header: 'Webhook created' },
      type: 'info'
    })

    const secret = process.env['STUBS_WEBHOOK_SIGNING_SECRET'] || 'hunter2'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (secret) {
      headers['X-Signature'] = createHmac('sha256', secret).update(webhookBody).digest('hex')
    }

    fetch('http://localhost:9999', { body: webhookBody, headers, method: 'POST' }).catch(
      (err: unknown) => getLogger().error('webhook monitor unavailable', err)
    )

    addFlash(req, {
      message: { header: 'Webhook sent' },
      type: 'success'
    })
  }

  const searchParams = new URLSearchParams({ consent_id: consentID })
  if (req.query['consent']) searchParams.set('consent', req.query['consent'] as string)
  if (req.query['accountAssessment'])
    searchParams.set('accountAssessment', req.query['accountAssessment'] as string)
  if (body.consent) searchParams.set('consent', body.consent)
  if (body.accountAssessment) searchParams.set('accountAssessment', body.accountAssessment)

  return res.redirect(`${paths.stubs.webhook}?${searchParams.toString()}`)
}

export { get, post }
