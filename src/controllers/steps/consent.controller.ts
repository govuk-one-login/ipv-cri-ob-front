import type { NextFunction, Request, Response } from 'express'

import { consentsClient } from '@src/clients/consents.client'
import { ConsentRequest } from '@src/models/consent.class'
import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { z } from 'zod'

import appConfig from '@src/config/app'
import paths from '@src/config/paths'

const consentSchema = () =>
  z.object({
    consent: z.literal('consent', 'pages.consent.checkbox.errorMessage')
  })

const renderPage = (res: Response, context: Record<string, unknown> = {}) =>
  res.render('pages/steps/consent', {
    backLink: paths.steps.chooseBank,
    ...context
  })

const get = (req: Request, res: Response, _next: NextFunction) => {
  res.locals['selectedBankName'] = req.session.bankName // hmpo translate looks in `locals` for context keys
  renderPage(res)
}

const post = async (req: Request, res: Response) => {
  const result = consentSchema().safeParse(req.body)
  if (!result.success) {
    renderPage(res, zodErrorsForView(result.error, res.locals.translate))
    return
  }
  const bankID = req.session.bankID! // guaranteed by require-session-key middleware
  const consentResponse = await consentsClient(req.axios).createConsent(
    new ConsentRequest(req.sessionID, bankID).toData()
  )
  req.session.consentID = consentResponse.consentID
  if (appConfig.STUBS.ENABLED) {
    res.redirect(paths.stubs.webhook)
  } else {
    res.status(501).json({ message: 'Not implemented' }) // TODO
  }
}

export { get, post }
