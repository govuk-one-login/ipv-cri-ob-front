import type { NextFunction, Request, Response } from 'express'

import { consentsClient } from '@src/clients/consents.client'
import { ConsentRequest } from '@src/models/consent.class'
import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { isMobileDevice } from '@src/utils/device-detection'
import { z } from 'zod'

import appConfig from '@src/config/app'
import paths from '@src/config/paths'

const renderPage = (req: Request, res: Response, context: Record<string, unknown> = {}) => {
  const isMobile = isMobileDevice(req)
  res.locals['selectedBankName'] = req.session.bankName
  res.locals['isMobile'] = isMobile
  res.render('pages/steps/consent', {
    backLink: paths.steps.chooseBank,
    ...context
  })
}

const get = (req: Request, res: Response, _next: NextFunction) => {
  renderPage(req, res)
}

const consentSchema = () =>
  z.object({
    consent: z.literal('consent', 'pages.consent.checkbox.errorMessage')
  })

const post = async (req: Request, res: Response) => {
  const result = consentSchema().safeParse(req.body)
  if (!result.success) {
    renderPage(req, res, zodErrorsForView(result.error, res.locals.translate))
    return
  }

  const bankID = req.session.bankID! // guaranteed by require-session-key middleware
  const consentResponse = await consentsClient(req.axios).createConsent(
    new ConsentRequest(req.sessionID, bankID).toData()
  )
  req.session.consentID = consentResponse.consentID

  const isMobile = isMobileDevice(req)

  if (appConfig.STUBS.ENABLED) {
    res.redirect(paths.stubs.webhook)
  } else if (isMobile) {
    // Spike: Test mobile detection
    res.status(501).json({
      message: 'Mobile bank redirect not implemented',
      device: 'mobile',
      userAgent: req.headers['user-agent']
    })
  } else {
    // Spike: Test desktop detection
    res.status(501).json({
      message: 'Desktop flow - would redirect to device selection',
      device: 'desktop',
      userAgent: req.headers['user-agent']
    })
  }
}

export { get, post }
