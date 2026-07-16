import type { Request, Response } from 'express'

const renderPage = (_req: Request, res: Response, context: Record<string, unknown> = {}) => {
  res.render('pages/steps/check-details', {
    ...context
  })
}

const get = (req: Request, res: Response) => {
  renderPage(req, res)
}

export { get }
