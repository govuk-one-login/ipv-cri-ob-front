import type { NextFunction, Request, Response } from 'express'

import paths from '@src/config/paths'

const get = (_req: Request, res: Response, _next: NextFunction) => {
  res.render('pages/steps/start.njk', {
    nextStep: paths.steps.consent
  })
}

export { get }
