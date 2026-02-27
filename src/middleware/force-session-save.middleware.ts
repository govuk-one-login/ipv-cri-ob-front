import type express from 'express'

import { getLogger } from '../utils/logger'

const LOGGER = getLogger()

/**
 * patches a race condition in common-express where express-session with DynamoDB store
 * doesn't guarantee session persistence before redirect
 */
const forceSessionSaveBeforeRedirect = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const originalRedirect = res.redirect.bind(res)

  res.redirect = function (statusOrUrl: number | string, url: string) {
    const actualUrl = typeof statusOrUrl === 'string' ? statusOrUrl : url
    const status = typeof statusOrUrl === 'number' ? statusOrUrl : 302

    if (req?.session?.save) {
      req.session.save((err: Error | null) => {
        if (err) {
          LOGGER.error({ error: err.message, url }, 'Error saving session before redirect')
          return originalRedirect.call(res, actualUrl, status)
        }
        originalRedirect.call(res, actualUrl, status)
      })
    } else {
      originalRedirect.call(res, actualUrl, status)
    }
  } as typeof res.redirect

  next()
}

export { forceSessionSaveBeforeRedirect }
