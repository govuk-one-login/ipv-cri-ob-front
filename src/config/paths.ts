const paths = {
  failureSteps: {
    bankUnavailable: '/sorry-problem-bank',
    couldNotConfirmIdentity: '/banking-no-match',
    hasPhotoIdentification: {
      photoIdentificationPresentFindAnotherWay: '/photo-id-banking-find-another-way',
      photoIdentificationPresentProveAnotherWay: '/photo-id-banking-another-way'
    },
    noPhotoIdentificationAvailable: {
      photoIdentificationNotPresentFindAnotherWay: '/no-photo-id-banking-find-another-way',
      photoIdentificationNotPresentProveAnotherWay: '/no-photo-id-banking-another-way'
    },
    technicalProblem: '/sorry-technical-problem',
    terminalErrorConfirmIdentity: '/sorry-cannot-confirm-banking',
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
