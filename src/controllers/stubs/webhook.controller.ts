import type {
  AccountAssessmentCompleteEventValue,
  ConsentJourneyCompleteEventValue,
  ConsentStatusChangeEventValue,
  EventValue
} from '@src/types/ecospend/webhooks/event-value'
import type { RecordType } from '@src/types/ecospend/webhooks/record-type'
import type { NextFunction, Request, Response } from 'express'

import { paths } from '@src/config'
import { EcospendWebhookBuilder } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import { addFlash } from '@src/utils/flash'
import { getLogger } from '@src/utils/logger'
import { randomUUID } from 'node:crypto'

const LOGGER = getLogger()

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
  LOGGER.debug(req.query)
  return res.render('pages/stubs/index.njk', {
    accountAssessmentOutcomeOptions: withSelected(
      accountAssessmentOutcomeOptions,
      req.query['accountAssessment']
    ),
    consentID: req.query['consent_id'],
    consentOutcomeOptions: withSelected(consentOutcomeOptions, req.query['consent'])
  })
}

const resolveWebhookParams = (body: {
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
  const params = resolveWebhookParams(body)

  if (params) {
    const webhook = EcospendWebhookBuilder.create()
      .setConsentID(consentID)
      .setEventID(randomUUID())
      .setEventValue(params.eventValue)
      .setEventTimestamp(new Date())
      .setRecordID(randomUUID())
      .setRecordType(params.recordType)
      .build()

    LOGGER.debug(JSON.stringify(webhook))

    addFlash(req, {
      message: { content: JSON.stringify(webhook, null, '\t'), header: 'Webhook created' },
      type: 'info'
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
