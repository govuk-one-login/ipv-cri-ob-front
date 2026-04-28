import type { NextFunction, Request, Response } from 'express'

import { getLogger } from '@src/utils/logger'
import { randomUUID } from 'node:crypto'

const get = (_req: Request, res: Response, _next: NextFunction) => {
  const consentID = randomUUID()
  getLogger().info(`consent id: ${consentID}`)
  res.render('pages/index.njk', {
    consentID
  })
}

export { get }
