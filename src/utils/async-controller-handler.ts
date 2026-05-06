import type { NextFunction, Request, RequestHandler, Response } from 'express'

const asyncControllerHandler =
  (
    controller: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ): RequestHandler =>
  (req, res, next) => {
    controller(req, res, next).catch(next)
  }

export { asyncControllerHandler }
