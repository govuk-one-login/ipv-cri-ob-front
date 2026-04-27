import type { NextFunction, Request, Response } from 'express'

import { getLogger } from '@src/utils/logger'

/**
 * patches a race condition in common-express where express-session with DynamoDB store
 * doesn't guarantee session persistence before redirect
 */
const forceSessionSaveBeforeRedirect = (req: Request, res: Response, next: NextFunction): void => {
  const originalRedirect = res.redirect.bind(res)

  res.redirect = function (statusOrUrl: number | string, url: string) {
    const actualUrl = typeof statusOrUrl === 'string' ? statusOrUrl : url
    const status = typeof statusOrUrl === 'number' ? statusOrUrl : 302

    if (req?.session?.save) {
      req.session.save((err: Error | null) => {
        if (err) {
          getLogger().error({ error: err.message, url }, 'Error saving session before redirect')
          return originalRedirect(status, actualUrl)
        }
        originalRedirect(status, actualUrl)
      })
    } else {
      originalRedirect(status, actualUrl)
    }
  } as typeof res.redirect

  next()
}

export { forceSessionSaveBeforeRedirect }
