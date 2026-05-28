export const AccountAssessmentCompleteEventValue = {
  NOT_VALID: 'NotValid',
  VALID: 'Valid'
} as const

export type AccountAssessmentCompleteEventValue =
  (typeof AccountAssessmentCompleteEventValue)[keyof typeof AccountAssessmentCompleteEventValue]

export const ConsentJourneyCompleteEventValue = {
  AUTHORISED: 'Authorized',
  CANCELLED: 'Canceled',
  FAILED: 'Failed',
  REJECTED: 'Rejected'
} as const

export type ConsentJourneyCompleteEventValue =
  (typeof ConsentJourneyCompleteEventValue)[keyof typeof ConsentJourneyCompleteEventValue]

export const ConsentStatusChangeEventValue = {
  EXPIRATION_WARNING: 'ExpirationWarning',
  EXPIRED: 'Expired',
  RECONFIRM_WARNING: 'ReconfirmWarning',
  REVOKED: 'Revoked'
} as const

export type ConsentStatusChangeEventValue =
  (typeof ConsentStatusChangeEventValue)[keyof typeof ConsentStatusChangeEventValue]

export type EventValue =
  | AccountAssessmentCompleteEventValue
  | ConsentJourneyCompleteEventValue
  | ConsentStatusChangeEventValue
