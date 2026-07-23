import type { NextFunction, Request, Response } from 'express'

type Redirect = (...args: RedirectArgs) => void
type RedirectArgs = [status: number, url: string] | [url: string]

// session must be persisted before the user is redirected in order to prevent race conditions
const middleware = (req: Request, res: Response, next: NextFunction) => {
  const originalRedirect = res.redirect.bind(res) as Redirect
  const interceptable = res as { redirect: Redirect }

  interceptable.redirect = (...args: RedirectArgs) => {
    req.session.save((err) => {
      if (err) {
        next(err)
        return
      }
      originalRedirect(...args)
    })
  }

  next()
}

export { middleware }
