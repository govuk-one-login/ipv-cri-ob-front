import type { EventValue } from '@src/types/ecospend/webhooks/event-value'
import type { RecordType } from '@src/types/ecospend/webhooks/record-type'

export interface EcospendWebhookData {
  consent_id: string
  event_id: string
  event_timestamp: string
  event_value: string
  record_id: string
  record_type: string
}

/*
{
    "event_timestamp": "2023-10-27T10:15:22Z",
    "event_id": "bf06862a-45c1-4359-86aa-6c57d01aee76",
    "event_value": "Authorized",
    "record_type": "Consent",
    "record_id": "c2b1a134-d9f2-4b21-86aa-6c57d01aee76",
    "consent_id": "c2b1a134-d9f2-4b21-86aa-6c57d01aee76"
}
 */

interface EcospendWebhookBuilderInput {
  consentID: string
  eventID: string
  eventTimestamp: Date
  eventValue: EventValue
  recordID: string
  recordType: RecordType
}

export class EcospendWebhookBuilder<T extends Partial<EcospendWebhookBuilderInput>> {
  private readonly actual: T

  private constructor(actual: T) {
    this.actual = actual
  }

  static create() {
    return new EcospendWebhookBuilder({})
  }

  build(this: EcospendWebhookBuilder<EcospendWebhookBuilderInput>): EcospendWebhookData {
    const input = this.actual
    return {
      consent_id: input.consentID,
      event_id: input.eventID,
      event_timestamp: input.eventTimestamp.toISOString(),
      event_value: input.eventValue,
      record_id: input.recordID,
      record_type: input.recordType
    }
  }

  setConsentID(consentID: string) {
    return new EcospendWebhookBuilder({ ...this.actual, consentID })
  }

  setEventID(eventID: string) {
    return new EcospendWebhookBuilder({ ...this.actual, eventID })
  }

  setEventTimestamp(eventTimestamp: Date) {
    return new EcospendWebhookBuilder({ ...this.actual, eventTimestamp })
  }

  setEventValue(eventValue: EventValue) {
    return new EcospendWebhookBuilder({ ...this.actual, eventValue })
  }

  setRecordID(recordID: string) {
    return new EcospendWebhookBuilder({ ...this.actual, recordID })
  }

  setRecordType(recordType: RecordType) {
    return new EcospendWebhookBuilder({ ...this.actual, recordType })
  }
}
