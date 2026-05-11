import type { RequestHandler } from 'express'
import type { SessionData } from 'express-session'

const middleware =
  (key: keyof SessionData, redirectTo: string): RequestHandler =>
  (req, res, next) => {
    if (!req.session[key]) {
      res.redirect(redirectTo)
      return
    }
    next()
  }

export { middleware }
