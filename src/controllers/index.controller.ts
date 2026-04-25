import type { NextFunction, Request, Response } from 'express'

import { getLogger } from '@src/utils/logger'
import { randomUUID } from 'node:crypto'

const LOGGER = getLogger()

const get = (_req: Request, res: Response, _next: NextFunction) => {
  LOGGER.info('hello from the logger')
  const consentID = randomUUID()
  res.render('pages/index.njk', {
    consentID
  })
}

export { get }
