import type { AxiosError } from 'axios'
import type { NextFunction, Request, Response } from 'express'
import type { ZodSafeParseResult } from 'zod'

import { webhookClient } from '@src/clients/stubs/webhook.client'
import { EcospendWebhookBuilder } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import {
  AccountAssessmentCompleteEventValue,
  ConsentJourneyCompleteEventValue,
  type EventValue
} from '@src/types/ecospend/webhooks/event-value'
import { RecordType } from '@src/types/ecospend/webhooks/record-type'
import { addFlash } from '@src/utils/flash'
import { LOGGER } from '@src/utils/logger'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import paths from '@src/config/paths'

interface OutcomeOption<T = never> {
  text: string
  value: T
}

const consentOutcomeOptions: OutcomeOption<ConsentJourneyCompleteEventValue>[] = [
  { text: 'Authorised', value: 'Authorized' },
  { text: 'Cancelled', value: 'Canceled' },
  { text: 'Failed', value: 'Failed' },
  { text: 'Rejected', value: 'Rejected' }
]

const accountAssessmentOutcomeOptions: OutcomeOption<AccountAssessmentCompleteEventValue>[] = [
  { text: 'Valid', value: 'Valid' },
  { text: 'Not valid', value: 'NotValid' }
]

const withSelected = <T>(
  options: OutcomeOption<T>[],
  selected: unknown
): (OutcomeOption<T> & { selected: boolean })[] =>
  options.map((o) => ({ ...o, selected: o.value === selected }))

const get = (req: Request, res: Response, _next: NextFunction) => {
  const consentID = req.session.consentID!
  const sessionID = req.session.id
  const sent = req.session.webhooksSent?.[consentID] ?? {}
  res.render('pages/stubs/index.njk', {
    accountAssessmentOutcomeOptions: withSelected(
      accountAssessmentOutcomeOptions,
      req.query['accountAssessment']
    ),
    consentID,
    consentOutcomeOptions: withSelected(consentOutcomeOptions, req.query['consent']),
    sentAccountAssessment: sent.accountAssessment,
    sentConsent: sent.consent,
    sessionID
  })
}

const ConsentBodySchema = z.object({
  consent: z.enum([
    ConsentJourneyCompleteEventValue.AUTHORISED,
    ConsentJourneyCompleteEventValue.CANCELLED,
    ConsentJourneyCompleteEventValue.FAILED,
    ConsentJourneyCompleteEventValue.REJECTED
  ])
})

const AccountAssessmentBodySchema = z.object({
  accountAssessment: z.enum([
    AccountAssessmentCompleteEventValue.VALID,
    AccountAssessmentCompleteEventValue.NOT_VALID
  ])
})

const post = async (req: Request, res: Response, _next: NextFunction) => {
  const consentID = req.session.consentID!

  const consentResult = ConsentBodySchema.safeParse(req.body)
  const accountAssessmentResult = AccountAssessmentBodySchema.safeParse(req.body)

  let formVals: undefined | { eventValue: EventValue; recordType: RecordType }
  if (consentResult.success) {
    formVals = { eventValue: consentResult.data.consent, recordType: RecordType.CONSENT }
  } else if (accountAssessmentResult.success) {
    formVals = {
      eventValue: accountAssessmentResult.data.accountAssessment,
      recordType: RecordType.ACCOUNT_ASSESSMENT
    }
  }

  if (!formVals) {
    res.redirect(paths.index) // TODO: continue CRI journey rather than returning to the index
    return
  }

  const webhook = EcospendWebhookBuilder.create()
    .setConsentID(consentID)
    .setEventID(randomUUID())
    .setEventValue(formVals.eventValue)
    .setEventTimestamp(new Date())
    .setRecordID(randomUUID())
    .setRecordType(formVals.recordType)
    .build()

  const WEBHOOK_LOGGER = LOGGER.child({
    component: 'webhook-stub',
    consent_id: consentID,
    webhook_type: webhook.record_type
  })

  addFlash(req, {
    message: { content: JSON.stringify(webhook, null, 2), header: 'Webhook created' },
    type: 'info'
  })

  await webhookClient(req.axios)
    .send(webhook)
    .then(() => {
      storeWebhookHistoryOnSession(req, consentID, consentResult)
      storeWebhookHistoryOnSession(req, consentID, accountAssessmentResult)
      WEBHOOK_LOGGER.info('webhook send success')
      addFlash(req, {
        message: { header: 'Webhook send success' },
        type: 'success'
      })
    })
    .catch((err: AxiosError) => {
      WEBHOOK_LOGGER.error({ code: err.code }, 'webhook send failure')
      addFlash(req, {
        message: { content: err.code ?? err.message, header: 'Webhook send failure' },
        type: 'error'
      })
    })

  const searchParams = new URLSearchParams()
  if (req.query['consent']) {
    searchParams.set('consent', req.query['consent'] as string)
  }
  if (req.query['accountAssessment']) {
    searchParams.set('accountAssessment', req.query['accountAssessment'] as string)
  }
  if (consentResult.success) {
    searchParams.set('consent', consentResult.data.consent)
  }
  if (accountAssessmentResult.success) {
    searchParams.set('accountAssessment', accountAssessmentResult.data.accountAssessment)
  }
  res.redirect(`${paths.stubs.webhook}?${searchParams.toString()}`)
}

const storeWebhookHistoryOnSession = (
  req: Request,
  consentID: string,
  result:
    | ZodSafeParseResult<z.infer<typeof AccountAssessmentBodySchema>>
    | ZodSafeParseResult<z.infer<typeof ConsentBodySchema>>
) => {
  if (!result.success) return
  const { data } = result
  const webhooksSent = req.session.webhooksSent?.[consentID] ?? {}
  if ('consent' in data) {
    webhooksSent.consent = consentOutcomeOptions.find((o) => o.value === data.consent)!.text
  } else {
    webhooksSent.accountAssessment = accountAssessmentOutcomeOptions.find(
      (o) => o.value === data.accountAssessment
    )!.text
  }
  req.session.webhooksSent = { [consentID]: webhooksSent }
}

export { get, post }
