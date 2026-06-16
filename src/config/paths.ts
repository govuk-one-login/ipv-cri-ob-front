const paths = {
  errors: {
    sessionEnded: '/session-ended',
    sessionMissing: '/session-missing'
  },
  failureSteps: {
    bankUnavailable: '/sorry-problem-bank',
    couldNotConfirmIdentity: '/banking-no-match',
    useACurrentAccount: '/use-current-account'
  },
  index: '/',
  oauth2: '/oauth2',
  steps: {
    chooseBank: '/choose-bank',
    confirmBankDetails: '/confirm-details-bank',
    consent: '/agree-share-bank-information',
    return: '/return',
    scannedQuickResponseCodeHolding: '/scanned-qr-code-online-banking',
    scanQuickResponseCode: '/scan-qr-code-sign-in-online-banking',
    selectSignInMethod: '/how-sign-in-bank',
    start: '/finish-proving-identity-online-banking'
  },
  stubs: {
    webhook: '/stubs/webhook'
  }
}

export default paths
