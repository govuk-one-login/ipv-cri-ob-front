declare module '@govuk-one-login/di-ipv-cri-common-express' {
  import type { OverloadProtectionConfig } from '@src/config/overload-protection'
  import type { DynamoDBStore } from 'connect-dynamodb'
  import type { ErrorRequestHandler, Express, RequestHandler, Router } from 'express'
  import type { HelmetOptions } from 'helmet'
  import type { i18n } from 'i18next'

  export interface AppLogger {
    child(bindings: Record<string, unknown>): AppLogger
    debug(obj: Record<string, unknown>, msg: string, ...args: unknown[]): void
    debug(msg: string, ...args: unknown[]): void
    error(obj: Error | Record<string, unknown>, msg: string, ...args: unknown[]): void
    error(msg: string, ...args: unknown[]): void
    fatal(obj: Error | Record<string, unknown>, msg: string, ...args: unknown[]): void
    fatal(msg: string, ...args: unknown[]): void
    info(obj: Record<string, unknown>, msg: string, ...args: unknown[]): void
    info(msg: string, ...args: unknown[]): void
    isLevelEnabled(level: string): boolean
    request(msg: string, ...args: unknown[]): void
    warn(obj: Record<string, unknown>, msg: string, ...args: unknown[]): void
    warn(msg: string, ...args: unknown[]): void
  }

  export interface BootstrapSetupOptions {
    config?: { APP_ROOT: string }
    csrf?: {
      secret: string | string[]
    }
    /** disable response compression. default: false */
    disableCompression?: boolean
    env?: string // sets app "dev" to true when not 'production'
    /**
     * error handler options. false to disable.
     * configures both the 404 and generic error handlers.
     */
    errors?:
      | {
          /** template for unhandled errors. default: 'errors/error' */
          defaultErrorView?: string
          /** template for SESSION_TIMEOUT errors. default: 'errors/session-ended' */
          sessionEndedView?: string
          /** URL to redirect to for MISSING_PREREQ errors. default: '/' */
          startUrl?: ((err: Error, req: Express.Request, res: Express.Response) => string) | string
        }
      | false
    /** helmet security headers config */
    helmet?: HelmetOptions
    host?: false
    /** locale directories relative to APP_ROOT. defaults to '.'. */
    locales?: string | string[]
    /** called after middleware is wired up but before the router is created. use for app.locals, custom middleware etc */
    middlewareSetupFn?: (app: Express) => void
    /** additional nunjucks environment options, views/express/dev/noCache/watch are set automatically */
    nunjucks?: {
      autoescape?: boolean // auto-escape output variables. Default: true
      lstripBlocks?: boolean // strip leading whitespace from the start of a line to a block tag. Default: false
      throwOnUndefined?: boolean // throw on undefined/null variable output instead of rendering empty string. Default: false
      trimBlocks?: boolean // strip the first newline after a block tag. Default: false
      web?: {
        async?: boolean // load templates asynchronously. Default: false
        useCache?: boolean // cache templates in the browser. Default: false
      }
    }
    overloadProtection?: OverloadProtectionConfig
    port?: false
    /**
     * opts passed to express.static for all public asset dirs.
     * false to disable static file serving entirely.
     * default: { maxAge: 86400000 } (1 day)
     */
    public?:
      | {
          /** dotfile handling: 'allow', 'deny', or 'ignore'. default: 'ignore' */
          dotfiles?: 'allow' | 'deny' | 'ignore'
          /** enable or disable etag generation. Default: true */
          etag?: boolean
          /** enable or disable the immutable directive in Cache-Control. default: false */
          immutable?: boolean
          /** browser cache max-age in milliseconds or a string accepted by the ms module. default: 86400000 (1 day) */
          maxAge?: number | string
        }
      | false
    /** directories to serve as static files under urls.public */
    publicDirs?: string[]
    /** directories to serve as static files under urls.publicImages */
    publicImagesDirs?: string[]
    redis?: false
    /** enable request/response logging middleware. default: true */
    requestLogging?: boolean
    session?:
      | {
          cookieName: string
          cookieOptions: { maxAge: number }
          secret: string
          sessionStore: DynamoDBStore
        }
      | false
    /** trust the X-Forwarded-For proxy header. default: true */
    trustProxy?: boolean
    /** URL path prefixes used throughout the app */
    urls?: {
      /** path for healthcheck endpoint. default: '/healthcheck'. false to disable */
      healthcheck?: false | string
      /** path for static public assets. default: '/public' */
      public?: string
      /** path for public images. default: '/public/images' */
      publicImages?: string
      /** path for version endpoint. default: '/version'. false to disable */
      version?: false | string
    }
    /** nunjucks template directories */
    views?: string[]
  }

  /** path must start with '/'. resolves to the raw Response; rejects with CustomFetchHttpError on non-2xx. */
  export type CustomFetch = (path: string, options?: CustomFetchOptions) => Promise<Response>

  /**
   * fetch(2)-compatible options with two extras handled by customFetch:
   * - `jsonBody` is JSON-stringified into `body` with Content-Type: application/json
   * - `timeoutMs` becomes an AbortSignal.timeout
   */
  export interface CustomFetchOptions extends Omit<RequestInit, 'body'> {
    body?: RequestInit['body']
    jsonBody?: unknown
    timeoutMs?: number
  }

  interface BootstrapSetupResult {
    app: Express
    /** router mounted after session, wrapped in overload protection */
    errorRouter: Router
    /** main router, mount routes here */
    router: Router
    /** router mounted before middlewareSetupFn, wrapped in overload protection */
    staticRouter: Router
  }

  interface CommonExpress {
    bootstrap: {
      logger: { get(name: string): AppLogger }
      setup: (options: BootstrapSetupOptions) => BootstrapSetupResult
    }
    lib: {
      customFetch: {
        CustomFetchHttpError: typeof CustomFetchHttpError
        /** attaches a configured fetch instance to req.customFetch, using API.BASE_URL from app settings */
        customFetchMiddleware: RequestHandler
      }
      errorHandling: {
        redirectAsErrorToCallback: ErrorRequestHandler
      }
      headers: RequestHandler // security headers middleware
      i18n: {
        i18next: i18n
        setI18n: (options: {
          config: {
            additionalNamespaces?: string[]
            cookieDomain?: string
            debug?: boolean
            secure?: boolean
          }
          onInit?: (i18next: i18n) => void
          router: Express | Router
        }) => void
      }
    }
    routes: {
      oauth2: Router
    }
  }

  export class CustomFetchHttpError extends Error {
    body: string
    code: number
    headers: Response['headers']
    constructor(response: Response, bodyString: string)
  }

  const commonExpress: CommonExpress
  export default commonExpress
}
