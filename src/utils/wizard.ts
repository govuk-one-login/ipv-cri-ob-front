import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'

export interface Wizard<S extends WizardSessionSlice> {
  name: string
  register: (router: Router) => void
  steps: Readonly<WizardSteps<S>>
}

export interface WizardSessionSlice {
  wizard?: Record<string, { history: string[] }>
}

export interface WizardStepConfig<S extends WizardSessionSlice> {
  /**
   * GET/POST handler pair for the step. If omitted the step is included in the topology but no route is registered for it.
   */
  controller?: WizardStepController

  /**
   * Mark step as a valid first stop when the wizard history is empty. At least one step in the wizard must be an entry point.
   */
  entryPoint?: boolean

  /**
   * Allow the controller to redirect to an absolute URL (e.g. offsite to a third party). Relative paths still have
   * to be declared in `next`.
   */
  exit?: boolean

  /**
   * Per-step middleware that runs before the guard. Not bound by `next`. Use for preconditions like auth or feature flags.
   * For a "this session key must be set" check, see {@link prereq}.
   */
  middleware?: RequestHandler[]

  /**
   * One or more steps the user may be redirected to from this step.
   */
  next?: string | string[]

  /**
   * Once the user has moved past this step, they can't return to it or to any earlier step in history.
   */
  noReturn?: boolean

  /**
   * Session-key precondition. Before the controller runs, the guard checks `req.session[prereq.key]` and redirects to
   * `prereq.redirectTo` (or the current head, if omitted) when key is missing.
   *
   * `key` is constrained to what is available on S(ession).
   *
   * @example
   * '/consent': {
   *   next: '/sign-in',
   *   prereq: { key: 'bankID', redirectTo: '/choose-bank' },
   *   controller: ...
   * }
   */
  prereq?: WizardPrereq<S>

  /**
   * Clears the `history` when the user visits this step. Combine with `entryPoint: true` to restart the journey from this step.
   */
  reset?: boolean
}

export type WizardSteps<S extends WizardSessionSlice> = Record<string, WizardStepConfig<S>>

interface WizardPrereq<S> {
  /**
   * Keys to look up on the session object
   */
  keys: (keyof S & string)[] | (keyof S & string)
  /**
   * Where to redirect the user to if the prereq is not satisfied
   */
  redirectTo?: string
}

interface WizardStepController {
  /**
   * GET controller for the step, required if `controller` is set on the step config
   */
  get: RequestHandler
  /**
   * Optional POST controller for the step
   */
  post?: RequestHandler
}

const toArray = (next: string | string[] | undefined): string[] => {
  if (next === undefined) return []
  return Array.isArray(next) ? next : [next]
}

const isAbsoluteUrl = (url: string): boolean => /^https?:\/\//i.test(url)

const createWizard = <S extends WizardSessionSlice>(
  name: string,
  steps: WizardSteps<S>
): Wizard<S> => {
  const entryPoints = Object.entries(steps)
    .filter(([, config]) => config.entryPoint)
    .map(([path]) => path)

  if (entryPoints.length === 0) {
    throw new Error(`Wizard "${name}" must declare at least one entryPoint step`)
  }

  const getHistory = (req: Request): string[] => {
    const session = req.session as unknown as WizardSessionSlice
    session.wizard ??= {}
    session.wizard[name] ??= { history: [] }
    return session.wizard[name].history
  }

  const setHistory = (req: Request, history: string[]): void => {
    const session = req.session as unknown as WizardSessionSlice
    session.wizard ??= {}
    session.wizard[name] = { history }
  }

  // a step is accessible from `history` if one of:
  //   - history is empty and step is an entryPoint
  //   - step is a declared `next` of the current head (forward navigation)
  //   - step is already in history, is not behind a noReturn barrier, and is not itself a noReturn step that has been left behind
  const isAccessible = (path: string, history: string[]): boolean => {
    if (!steps[path]) return false
    if (history.length === 0) return steps[path].entryPoint === true

    const head = history.at(-1)!
    if (toArray(steps[head]?.next).includes(path)) return true

    const idx = history.lastIndexOf(path)
    if (idx === -1) return false
    if (idx === history.length - 1) return true // current page is always accessible
    if (steps[path].noReturn) return false // user has moved past a no-return step
    return !history.slice(idx + 1).some((p) => steps[p]?.noReturn === true)
  }

  // navigating to a step already in history rewinds to it, navigating to a new step pushes it on
  const recordVisit = (path: string, history: string[]): string[] => {
    const idx = history.lastIndexOf(path)
    if (idx !== -1) return history.slice(0, idx + 1)
    return [...history, path]
  }

  const fallback = (history: string[]): string => history.at(-1) ?? entryPoints[0]!

  const guard = (path: string): RequestHandler => {
    const prereq = steps[path]?.prereq ?? null

    return (req: Request, res: Response, next: NextFunction) => {
      let history = steps[path]?.reset ? [] : getHistory(req)

      if (!isAccessible(path, history)) {
        res.redirect(fallback(history))
        return
      }

      if (prereq) {
        const session = req.session as unknown as Record<string, unknown>
        for (const sessionKey of toArray(prereq.keys)) {
          if (!session[sessionKey]) {
            res.redirect(prereq.redirectTo ?? fallback(history))
            return
          }
        }
      }

      history = recordVisit(path, history)
      setHistory(req, history)

      const allowedNext = new Set(toArray(steps[path]?.next))
      const exitAllowed = steps[path]?.exit === true
      type RedirectArgs = [status: number, url: string] | [url: string]
      const originalRedirect = res.redirect.bind(res) as (...args: RedirectArgs) => void
      const interceptable = res as { redirect: (...args: RedirectArgs) => void }
      interceptable.redirect = (...args: RedirectArgs) => {
        const url = args.length === 1 ? args[0] : args[1]
        if (isAbsoluteUrl(url)) {
          if (!exitAllowed) {
            throw new Error(
              `Wizard step "${path}" attempted to redirect to absolute URL "${url}" but is not declared as exit: true`
            )
          }
        } else {
          const pathname = url.split('?')[0]
          if (!pathname || !allowedNext.has(pathname)) {
            throw new Error(
              `Wizard step "${path}" attempted to redirect to "${url}" but it is not in next`
            )
          }
        }
        originalRedirect(...args)
      }

      const previousStep = history.length >= 2 ? history.at(-2) : null
      const previousStepAccessible = !!(previousStep && isAccessible(previousStep, history))
      res.locals['backLink'] = previousStepAccessible ? previousStep : null
      next()
    }
  }

  const register = (router: Router) => {
    for (const [stepPath, config] of Object.entries(steps)) {
      if (!config.controller) continue
      const middleware = config.middleware ?? []
      router.get(stepPath, ...middleware, guard(stepPath), config.controller.get)
      if (config.controller.post) {
        router.post(stepPath, ...middleware, guard(stepPath), config.controller.post)
      }
    }
  }

  return { name, register, steps: steps }
}

export { createWizard }
