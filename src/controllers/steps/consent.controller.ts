import type { NextFunction, Request, Response } from 'express'

import { randomUUID } from 'node:crypto'

import paths from '@src/config/paths'

const get = (req: Request, res: Response, _next: NextFunction) => {
  req.session.consentID = randomUUID()
  res.render('pages/steps/consent.njk', {
    nextStep: paths.stubs.webhook
  })
}

export { get }
