export type AccountAssessmentCompleteEventValue = 'NotValid' | 'Valid'
export type ConsentJourneyCompleteEventValue = 'Authorized' | 'Canceled' | 'Failed' | 'Rejected'
export type ConsentStatusChangeEventValue =
  | 'ExpirationWarning'
  | 'Expired'
  | 'ReconfirmWarning'
  | 'Revoked'

export type EventValue =
  | AccountAssessmentCompleteEventValue
  | ConsentJourneyCompleteEventValue
  | ConsentStatusChangeEventValue
