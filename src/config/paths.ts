const paths = {
  failureSteps: {
    bankUnavailable: '/sorry-problem-bank',
    couldNotConfirmIdentity: '/banking-no-match',
    useACurrentAccount: '/use-current-account'
  },
  index: '/',
  oauth2: {
    callback: '/oauth2/callback',
    index: '/oauth2'
  },
  steps: {
    chooseBank: '/choose-bank',
    checkDetailsHolding: '/confirm-details-bank',
    consent: '/agree-share-bank-information',
    proveAnotherWay: '/prove-another-way',
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
