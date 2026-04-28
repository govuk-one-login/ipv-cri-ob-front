import type { NextFunction, Request, Response } from 'express'

const middleware = (req: Request, res: Response, next: NextFunction) => {
  res.locals['flash'] = req.session.flash ?? []
  delete req.session.flash
  next()
}

export { middleware }
