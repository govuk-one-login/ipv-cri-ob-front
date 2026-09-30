import type { NextFunction, Request, Response } from 'express'

import { consentsClient } from '@src/clients/consents.client'
import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { z } from 'zod'

import appConfig from '@src/config/app'
import paths from '@src/config/paths'

const RETURN_URL = new URL(paths.steps.checkDetailsHolding, appConfig.APP.PUBLIC_ORIGIN).href // must match a return URL registered with the ecospend client for this environment

const renderPage = (req: Request, res: Response, context: Record<string, unknown> = {}) => {
  res.locals['selectedBankName'] = req.session.bankName
  res.locals['isMobile'] = req.session.isMobile
  res.render('pages/steps/consent', {
    ...context,
    proveAnotherWay: paths.steps.proveAnotherWay
  })
}

const get = (req: Request, res: Response, _next: NextFunction) => {
  renderPage(req, res)
}

const consentsSchema = () =>
  z.object({
    consent: z.literal('consent', 'pages.consent.checkbox.errorMessage')
  })

const post = async (req: Request, res: Response) => {
  const result = consentsSchema().safeParse(req.body)
  if (!result.success) {
    renderPage(req, res, zodErrorsForView(result.error, res.locals.translate))
    return
  }
  const bankID = req.session.bankID!
  const consentsResponse = await consentsClient(req).createConsent({
    bank_id: bankID,
    return_url: RETURN_URL
  })
  req.session.consentID = consentsResponse.id
  req.session.bankConsentURL = consentsResponse.url
  req.session.urlExpiresAtSeconds = consentsResponse.urlExpiresAtSeconds

  if (req.session.isMobile) {
    res.redirect(req.session.bankConsentURL)
    return
  }
  res.redirect(paths.steps.selectSignInMethod)
}

export { get, post }
