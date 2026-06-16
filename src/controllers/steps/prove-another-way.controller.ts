import type { NextFunction, Request, Response } from 'express'

import paths from '@src/config/paths'

const get = (_req: Request, res: Response, _next: NextFunction) => {
  res.redirect(paths.oauth2.callback)
}

export { get }
