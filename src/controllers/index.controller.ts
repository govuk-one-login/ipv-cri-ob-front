import type { NextFunction, Request, Response } from 'express'

import { getLogger } from '../utils/logger'

const LOGGER = getLogger()

const get = (req: Request, res: Response, _next: NextFunction) => {
  LOGGER.info('hello from the logger')
  let message = 'hello from the controller'
  if (req.language === 'cy') {
    message = 'helo gan y rheolydd'
  }

  res.render('index.njk', {
    message
  })
}

export { get }
