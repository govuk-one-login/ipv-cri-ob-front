export const RecordType = {
  ACCOUNT_ASSESSMENT: 'AccountAssessment',
  CONSENT: 'Consent'
} as const

export type RecordType = (typeof RecordType)[keyof typeof RecordType]
