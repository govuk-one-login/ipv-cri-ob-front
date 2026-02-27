import type express from 'express'

import { getLogger } from '../utils/logger'

const LOGGER = getLogger()

const get = (req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
