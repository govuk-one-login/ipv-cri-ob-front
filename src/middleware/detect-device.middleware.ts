import type { NextFunction, Request, Response } from 'express'

import { UAParser } from 'ua-parser-js'

const middleware = (req: Request, _res: Response, next: NextFunction) => {
  req.session.isMobile = new UAParser(req.headers['user-agent']).getDevice().type === 'mobile'
  next()
}

export { middleware }
