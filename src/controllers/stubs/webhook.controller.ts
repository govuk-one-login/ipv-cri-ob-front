import type {
  AccountAssessmentCompleteEventValue,
  ConsentJourneyCompleteEventValue
} from '@src/types/ecospend/webhooks/event-value'
import type { AxiosError } from 'axios'
import type { NextFunction, Request, Response } from 'express'

import { EcospendWebhookBuilder } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
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

const ConsentBodySchema = z.object({
  consent: z.enum(['Authorized', 'Canceled', 'Failed', 'Rejected'])
})

const AccountAssessmentBodySchema = z.object({
  accountAssessment: z.enum(['Valid', 'NotValid'])
})

const withSelected = <T>(
  options: OutcomeOption<T>[],
  selected: unknown
): (OutcomeOption<T> & { selected: boolean })[] =>
  options.map((o) => ({ ...o, selected: o.value === selected }))

const get = (req: Request, res: Response, _next: NextFunction) => {
  const consentID = req.session.consentID!
  const sent = req.session.webhooksSent?.[consentID] ?? {}
  getLogger().debug(req.query)
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

  if (formVals) {
    const webhook = EcospendWebhookBuilder.create()
      .setConsentID(consentID)
      .setEventID(randomUUID())
      .setEventValue(formVals.eventValue)
      .setEventTimestamp(new Date())
      .setRecordID(randomUUID())
      .setRecordType(formVals.recordType)
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

    await req.axios
      .post(appConfig.API.PATHS.WEBHOOK, webhookBody, { headers })
      .then(() => {
        addFlash(req, {
          message: { header: 'Webhook send success' },
          type: 'success'
        })
        const entry = req.session.webhooksSent?.[consentID] ?? {}
        if (consentResult.success) {
          const text = consentOutcomeOptions.find(
            (o) => o.value === consentResult.data.consent
          )?.text
          if (text) entry.consent = text
        }
        if (accountAssessmentResult.success) {
          const text = accountAssessmentOutcomeOptions.find(
            (o) => o.value === accountAssessmentResult.data.accountAssessment
          )?.text
          if (text) entry.accountAssessment = text
        }
        req.session.webhooksSent = { [consentID]: entry }
      })
      .catch((err: AxiosError) => {
        getLogger().error('webhook endpoint failure', err)
        const detail = err.response
          ? `${err.response.status} ${err.response.statusText}`
          : (err.code ?? err.message)
        addFlash(req, { message: { content: detail, header: 'Webhook send fail' }, type: 'error' })
      })
  }

  const searchParams = new URLSearchParams()
  if (req.query['consent']) searchParams.set('consent', req.query['consent'] as string)
  if (req.query['accountAssessment'])
    searchParams.set('accountAssessment', req.query['accountAssessment'] as string)
  if (consentResult.success) searchParams.set('consent', consentResult.data.consent)
  if (accountAssessmentResult.success)
    searchParams.set('accountAssessment', accountAssessmentResult.data.accountAssessment)

  return res.redirect(`${paths.stubs.webhook}?${searchParams.toString()}`)
}

export { get, post }
