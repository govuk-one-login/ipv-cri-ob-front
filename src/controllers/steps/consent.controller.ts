import type { NextFunction, Request, Response } from 'express'

import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { randomUUID } from 'node:crypto'
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
  return renderPage(res)
}

const post = (req: Request, res: Response) => {
  const result = consentSchema().safeParse(req.body)
  if (!result.success) return renderPage(res, zodErrorsForView(result.error, res.locals.translate))
  req.session.consentID = randomUUID() // TODO: generate a real consent ID via the API
  if (appConfig.STUBS.ENABLED) {
    return res.redirect(paths.stubs.webhook)
  } else {
    return res.status(501).json({ message: 'Not implemented' })
  }
}

export { get, post }
