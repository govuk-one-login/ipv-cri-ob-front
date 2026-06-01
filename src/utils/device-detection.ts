import { UAParser } from 'ua-parser-js'
import type { Request } from 'express'

export const isMobileDevice = (req: Request): boolean => {
  const parser = new UAParser(req.headers['user-agent'])
  return parser.getDevice().type === 'mobile'
}
