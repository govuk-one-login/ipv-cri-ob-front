import type {
  AccountAssessmentCompleteEventValue,
  ConsentJourneyCompleteEventValue
} from '@src/types/ecospend/webhooks/event-value'
import type { NextFunction, Request, Response } from 'express'

import { EcospendWebhookBuilder } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import { addFlash } from '@src/utils/flash'
import { getLogger } from '@src/utils/logger'
import { createHmac, randomUUID } from 'node:crypto'
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
  const consentID = req.query['consent_id'] as string
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
  const consentID = req.query['consent_id'] as string

  const consentResult = ConsentBodySchema.safeParse(req.body)
  const accountAssessmentResult = AccountAssessmentBodySchema.safeParse(req.body)

  const config = consentResult.success
    ? { eventValue: consentResult.data.consent, recordType: 'Consent' as const }
    : accountAssessmentResult.success
      ? {
          eventValue: accountAssessmentResult.data.accountAssessment,
          recordType: 'AccountAssessment' as const
        }
      : null

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

    await fetch('http://localhost:9999', { body: webhookBody, headers, method: 'POST' })
      .then(() => {
        addFlash(req, {
          message: { header: 'Webhook sent' },
          type: 'success'
        })
        const sent = (req.session.webhooksSent ??= {})
        sent[consentID] ??= {}
        if (consentResult.success) {
          const text = consentOutcomeOptions.find(
            (o) => o.value === consentResult.data.consent
          )?.text
          if (text) sent[consentID].consent = text
        }
        if (accountAssessmentResult.success) {
          const text = accountAssessmentOutcomeOptions.find(
            (o) => o.value === accountAssessmentResult.data.accountAssessment
          )?.text
          if (text) sent[consentID].accountAssessment = text
        }
      })
      .catch((err: unknown) => {
        getLogger().error('webhook monitor unavailable', err)
        addFlash(req, { message: { header: 'Webhook monitor unavailable' }, type: 'error' })
      })
  }

  const searchParams = new URLSearchParams({ consent_id: consentID })
  if (req.query['consent']) searchParams.set('consent', req.query['consent'] as string)
  if (req.query['accountAssessment'])
    searchParams.set('accountAssessment', req.query['accountAssessment'] as string)
  if (consentResult.success) searchParams.set('consent', consentResult.data.consent)
  if (accountAssessmentResult.success)
    searchParams.set('accountAssessment', accountAssessmentResult.data.accountAssessment)

  return res.redirect(`${paths.stubs.webhook}?${searchParams.toString()}`)
}

export { get, post }
