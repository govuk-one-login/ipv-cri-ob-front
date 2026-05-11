export const AccountAssessmentCompleteEventValue = {
  NOT_VALID: 'NotValid' as AccountAssessmentCompleteEventValue,
  VALID: 'Valid' as AccountAssessmentCompleteEventValue
}

export type AccountAssessmentCompleteEventValue = 'NotValid' | 'Valid'

export const ConsentJourneyCompleteEventValue = {
  AUTHORISED: 'Authorized' as ConsentJourneyCompleteEventValue,
  CANCELLED: 'Canceled' as ConsentJourneyCompleteEventValue,
  FAILED: 'Failed' as ConsentJourneyCompleteEventValue,
  REJECTED: 'Rejected' as ConsentJourneyCompleteEventValue
}

export type ConsentJourneyCompleteEventValue = 'Authorized' | 'Canceled' | 'Failed' | 'Rejected'

export const ConsentStatusChangeEventValue = {
  EXPIRATION_WARNING: 'ExpirationWarning' as ConsentStatusChangeEventValue,
  EXPIRED: 'Expired' as ConsentStatusChangeEventValue,
  RECONFIRM_WARNING: 'ReconfirmWarning' as ConsentStatusChangeEventValue,
  REVOKED: 'Revoked' as ConsentStatusChangeEventValue
}

export type ConsentStatusChangeEventValue =
  | 'ExpirationWarning'
  | 'Expired'
  | 'ReconfirmWarning'
  | 'Revoked'

export type EventValue =
  | AccountAssessmentCompleteEventValue
  | ConsentJourneyCompleteEventValue
  | ConsentStatusChangeEventValue
