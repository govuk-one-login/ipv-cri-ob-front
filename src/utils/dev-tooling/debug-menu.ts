import type { RequestHandler, Router } from 'express'

import { alarmBadge, LOGGER } from '@src/utils/logger'

import path from 'node:path'

const debugMenuMiddleware: RequestHandler = (req, res, next) => {
  res.locals['debug'] = true
  res.locals['sessionId'] = req.sessionID
  res.locals['oauthSession'] = {
    authParams: req.session?.authParams,
    tokenId: req.session?.tokenId
  }
  next()
}

export const debugMenu = {
  viewsDir: path.resolve(import.meta.dirname, 'views'),

  register(router: Router): void {
    LOGGER.warn(`${alarmBadge} debug menu enabled`)
    router.use(debugMenuMiddleware)
    LOGGER.warn(`${alarmBadge} oauth session data is present in locals`)
  }
}
