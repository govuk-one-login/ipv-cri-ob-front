import type { NextFunction, Request, Response } from 'express'
import type { TOptions } from 'i18next'

import i18next from 'i18next'
import backend from 'i18next-fs-backend'

import * as middleware from 'i18next-http-middleware'

await i18next
  .use(backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: './src/locales/{{lng}}/{{ns}}.yml'
    },
    defaultNS: 'default',
    detection: {
      caches: ['cookie'],
      cookieSameSite: '',
      cookieSecure: true,
      ignoreCase: true,
      lookupCookie: 'lng',
      lookupQuerystring: 'lng',
      order: ['querystring', 'cookie']
    },
    fallbackLng: ['en'],
    fallbackNS: ['fields', 'pages', 'errors'],
    initImmediate: false,
    ns: ['default', 'fields', 'pages', 'errors'],
    nsSeparator: '.',
    preload: ['en', 'cy'],
    returnEmptyString: true,
    returnObjects: true,
    supportedLngs: ['en', 'cy']
  })

const handler = middleware.handle(i18next, { ignoreRoutes: ['/public'] })

export default (req: Request, res: Response, next: NextFunction) => {
  handler(req, res, () => {
    res.locals.translate = (key: string, options?: TOptions & { default?: string }) => {
      const { default: defaultValue, ...rest } = options ?? {}
      return req.t(key, { defaultValue, ...rest })
    }
    next()
  })
}
