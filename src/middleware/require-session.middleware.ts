import type { RequestHandler } from 'express'

import { LOGGER } from '@src/utils/logger'

import paths from '@src/config/paths'

const middleware: RequestHandler = (req, res, next) => {
  if (!req.session) {
    LOGGER.warn(
      {
        event: 'SESSION_MISSING',
        userAgent: req.get('user-agent')
      },
      'User accessed protected route without session - redirecting to session missing page'
    )

    return res.redirect(paths.errors.sessionMissing)
  }
  next()
}

export { middleware }
