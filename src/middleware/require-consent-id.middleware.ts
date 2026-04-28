import type { NextFunction, Request, Response } from 'express'

const middleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.consentID) {
    res.status(401).render('errors/session-ended')
    return
  }
  next()
}

export { middleware }
