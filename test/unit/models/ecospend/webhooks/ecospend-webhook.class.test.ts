import { EcospendWebhookBuilder } from '@src/models/ecospend/webhooks/ecospend-webhook.class'
import { ConsentJourneyCompleteEventValue } from '@src/types/ecospend/webhooks/event-value'
import { RecordType } from '@src/types/ecospend/webhooks/record-type'
import { describe, expect, it } from 'vitest'

describe('EcospendWebhookBuilder', () => {
  it('builds a webhook with correctly mapped snake_case fields', () => {
    const timestamp = new Date('1991-11-22T00:00:00.000Z')

    const webhook = EcospendWebhookBuilder.create()
      .setConsentID('test-consent-id')
      .setEventID('test-event-id')
      .setEventTimestamp(timestamp)
      .setEventValue(ConsentJourneyCompleteEventValue.AUTHORISED)
      .setRecordID('test-record-id')
      .setRecordType(RecordType.CONSENT)
      .build()

    expect(webhook).toEqual({
      consent_id: 'test-consent-id',
      event_id: 'test-event-id',
      event_timestamp: '1991-11-22T00:00:00.000Z',
      event_value: 'Authorized',
      record_id: 'test-record-id',
      record_type: 'Consent'
    })
  })
})
