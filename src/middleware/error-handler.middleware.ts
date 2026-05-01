import type { ErrorRequestHandler, NextFunction, Request } from 'express'

import { getLogger } from '@src/utils/logger'

export const middleware: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res,
  _next: NextFunction
) => {
  getLogger().error(
    {
      location: err.stack?.split('\n')[1]?.trim(),
      type: err.constructor.name
    },
    err.message
  )
  if (res.headersSent) return
  res.status(500).render('errors/error', {
    error: err
  })
}
