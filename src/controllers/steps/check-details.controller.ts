import type { NextFunction, Request, Response } from 'express'

const renderPage = (_req: Request, res: Response, context: Record<string, unknown> = {}) => {
  res.render('pages/steps/check-details', {
    ...context
  })
}

const get = (req: Request, res: Response, _next: NextFunction) => {
  renderPage(req, res)
}

export { get }
