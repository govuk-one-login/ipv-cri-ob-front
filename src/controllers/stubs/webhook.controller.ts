import type { AxiosError } from 'axios'
import type { NextFunction, Request, Response } from 'express'
import type { ZodSafeParseResult } from 'zod'

import { EcospendWebhookBuilder } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import {
  AccountAssessmentCompleteEventValue,
  ConsentJourneyCompleteEventValue
} from '@src/types/ecospend/webhooks/event-value'
import { RecordType } from '@src/types/ecospend/webhooks/record-type'
import { addFlash } from '@src/utils/flash'
import { getLogger } from '@src/utils/logger'
import { createHmac, randomUUID } from 'node:crypto'
import { z } from 'zod'

import appConfig from '@src/config/app'
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
  const sent = req.session.webhooksSent?.[consentID] ?? {}
  return res.render('pages/stubs/index.njk', {
    accountAssessmentOutcomeOptions: withSelected(
      accountAssessmentOutcomeOptions,
      req.query['accountAssessment']
    ),
    consentID,
    consentOutcomeOptions: withSelected(consentOutcomeOptions, req.query['consent']),
    sentAccountAssessment: sent.accountAssessment,
    sentConsent: sent.consent
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

  const formVals = consentResult.success
    ? { eventValue: consentResult.data.consent, recordType: RecordType.CONSENT }
    : accountAssessmentResult.success
      ? {
          eventValue: accountAssessmentResult.data.accountAssessment,
          recordType: RecordType.ACCOUNT_ASSESSMENT
        }
      : null

  if (!formVals) {
    return res.redirect(paths.index) // TODO: continue CRI journey rather than returning to the start point
  }

  const webhook = EcospendWebhookBuilder.create()
    .setConsentID(consentID)
    .setEventID(randomUUID())
    .setEventValue(formVals.eventValue)
    .setEventTimestamp(new Date())
    .setRecordID(randomUUID())
    .setRecordType(formVals.recordType)
    .build()

  const webhookBody = JSON.stringify(webhook)

  addFlash(req, {
    message: { content: JSON.stringify(webhook, null, 2), header: 'Webhook created' },
    type: 'info'
  })

  const headers = {
    'Content-Type': 'application/json',
    'X-Signature': createHmac('sha256', appConfig.STUBS.WEBHOOK_SIGNING_SECRET)
      .update(webhookBody)
      .digest('hex')
  }

  await req.axios
    .post(appConfig.API.PATHS.WEBHOOK, webhookBody, { headers })
    .then(() => {
      storeWebhookHistoryOnSession(req, consentID, consentResult)
      storeWebhookHistoryOnSession(req, consentID, accountAssessmentResult)
      addFlash(req, {
        message: { header: 'Webhook send success' },
        type: 'success'
      })
    })
    .catch((err: AxiosError) => {
      getLogger().error('webhook endpoint failure', err)
      const detail = err.response
        ? `${err.response.status} ${err.response.statusText}`
        : (err.code ?? err.message)
      addFlash(req, { message: { content: detail, header: 'Webhook send fail' }, type: 'error' })
    })

  const searchParams = new URLSearchParams()
  if (req.query['consent']) searchParams.set('consent', req.query['consent'] as string)
  if (req.query['accountAssessment'])
    searchParams.set('accountAssessment', req.query['accountAssessment'] as string)
  if (consentResult.success) searchParams.set('consent', consentResult.data.consent)
  if (accountAssessmentResult.success)
    searchParams.set('accountAssessment', accountAssessmentResult.data.accountAssessment)

  return res.redirect(`${paths.stubs.webhook}?${searchParams.toString()}`)
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
