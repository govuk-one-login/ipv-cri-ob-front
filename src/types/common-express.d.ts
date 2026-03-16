declare module '@govuk-one-login/di-ipv-cri-common-express' {
  import type { OverloadProtectionConfig } from '@src/config/overload-protection'
  import type { DynamoDBStore } from 'connect-dynamodb'
  import type { Request, Response } from 'express'
  import type { Express, RequestHandler, Router } from 'express'

  export interface AppLogger {
    debug(message: string, ...args: unknown[]): void
    error(messageOrMeta: Error | Record<string, unknown> | string, ...args: unknown[]): void
    fatal(messageOrMeta: Error | Record<string, unknown> | string, ...args: unknown[]): void
    info(message: string, ...args: unknown[]): void
    request(message: string, ...args: unknown[]): void
    warn(message: string, ...args: unknown[]): void
  }

  export interface BootstrapSetupOptions {
    config: { APP_ROOT: string }
    /** disable response compression. default: false */
    disableCompression?: boolean
    env?: string // sets app "dev" to true when not 'production'
    /**
     * error handler options. false to disable.
     * configures both the 404 and generic error handlers.
     */
    errors?:
      | false
      | {
          /** template for unhandled errors. default: 'errors/error' */
          defaultErrorView?: string
          /** template for SESSION_TIMEOUT errors. default: 'errors/session-ended' */
          sessionEndedView?: string
          /** URL to redirect to for MISSING_PREREQ errors. default: '/' */
          startUrl?: ((err: Error, req: Express.Request, res: Express.Response) => string) | string
        }
    /** helmet security headers config */
    helmet?: CommonExpressHelmetConfig
    host?: false
    /** locale directories relative to APP_ROOT. defaults to '.'. */
    locales?: string | string[]
    /** hmpo-logger config - only used when USE_PINO_LOGGER is not 'true', pino reads LOGS_LEVEL from env */
    logs?:
      | false
      | {
          app?: boolean | string // path to app log file. false disables file logging. default: false
          console?: boolean // enable console (stdout) transport. default: false
          consoleJSON?: boolean // format console output as logstash JSON. false uses human-readable pretty format. default: false
          /**
           * minimum severity level for console output. default: 'debug'
           * levels available: fatal, error, warn, request, outbound, info, verbose, debug, silly
           */
          consoleLevel?: HMPOLogLevel
        }
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
    port: false
    /**
     * opts passed to express.static for all public asset dirs.
     * false to disable static file serving entirely.
     * default: { maxAge: 86400000 } (1 day)
     */
    public?:
      | false
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
    /** directories to serve as static files under urls.public */
    publicDirs?: string[]
    /** directories to serve as static files under urls.publicImages */
    publicImagesDirs?: string[]
    redis: false
    /** enable request/response logging middleware. default: true */
    requestLogging?: boolean
    session?:
      | false
      | {
          cookieName: string
          cookieOptions: { maxAge: number }
          secret: string
          sessionStore: DynamoDBStore
        }
    /** hmpo-i18n translation options */
    translation?: {
      /** supported languages. default: ['en', 'cy'] */
      allowedLangs?: string[]
      /** cookie used to persist language choice. default: { name: 'lang' } */
      cookie?: { name: string }
      /** fallback languages */
      fallbackLang?: string[]
      /** query param used to switch language. default: 'lang' */
      query?: string
    }
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

  export interface CommonExpressHelmetConfig {
    contentSecurityPolicy: {
      directives: {
        connectSrc: string[]
        defaultSrc: string[]
        formAction: string[]
        imgSrc: string[]
        objectSrc: string[]
        scriptSrc: (((req: Request, res: Response) => string) | string)[]
        styleSrc: string[]
        upgradeInsecureRequests: null | string[] // not actually in ce config but autoconfigured by helmet
        workerSrc: string[] // not actually in ce config but autoconfigured by helmet
      }
    }
    crossOriginEmbedderPolicy: boolean
    dnsPrefetchControl: { allow: boolean }
    expectCt: boolean
    frameguard: { action: string }
    hsts: false | { includeSubDomains: boolean; maxAge: number; preload: boolean }
    permittedCrossDomainPolicies: boolean
    referrerPolicy: boolean
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
      axios: RequestHandler // attaches a configured axios instance to req.axios, using API.BASE_URL from app settings
      headers: RequestHandler // security headers middleware
      helmet: CommonExpressHelmetConfig
      i18n: {
        setI18n: (options: {
          config: { cookieDomain?: string; debug?: boolean; secure?: boolean }
          router: Express | Router
        }) => void
      }
      locals: {
        getAssetPath: RequestHandler // sets res.locals.assetPath from app setting
        getDeviceIntelligence: RequestHandler
        getGTM: RequestHandler // copies GTM app settings into res.locals for templates
        getLanguageToggle: RequestHandler // copies language toggle state into res.locals, sets res.locals.htmlLang from req.i18n.language
      }
      settings: {
        setDeviceIntelligence: (settings: DeviceIntelligenceSettings) => void
        setGTM: (settings: GTMSettings) => void // sets GA4/UA analytics config on app settings
        setLanguageToggle: (settings: LanguageToggleSettings) => void
      }
    }
    routes: {
      oauth2: Router
    }
  }

  interface DeviceIntelligenceSettings {
    app: Express
    deviceIntelligenceDomain: string
    deviceIntelligenceEnabled: string
  }

  type GTMSettings = {
    analyticsCookieDomain: string
    analyticsDataSensitive: boolean
    app: Express
    ga4ContainerId: string
    ga4Enabled: boolean
    ga4FormChangeEnabled: boolean
    ga4FormErrorEnabled: boolean
    ga4FormResponseEnabled: boolean
    ga4NavigationEnabled: boolean
    ga4PageViewEnabled: boolean
    ga4SelectContentEnabled: boolean
  } & ({ uaContainerId: string; uaEnabled: true } | { uaContainerId?: never; uaEnabled: false })

  type HMPOLogLevel =
    | 'debug'
    | 'error'
    | 'fatal'
    | 'info'
    | 'outbound'
    | 'request'
    | 'silly'
    | 'verbose'
    | 'warn'

  interface LanguageToggleSettings {
    app: Express
    showLanguageToggle: '0' | '1' // must be the string "1" to enable, "0" or any other value disables
  }

  const commonExpress: CommonExpress
  export default commonExpress
}
