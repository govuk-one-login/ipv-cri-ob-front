import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'

import {
  createWizard,
  type Wizard,
  type WizardSessionSlice,
  type WizardSteps
} from '@src/utils/wizard'
import { describe, expect, it, vi } from 'vitest'

interface TestSession extends WizardSessionSlice {
  bankID?: string
  consentID?: string
}

const noop = () => undefined

// a representative wizard used by most tests. covers an entry-point with `reset`, branching, a `noReturn` gate and a dead-end retry loop
const buildJourney = (): WizardSteps<TestSession> => ({
  '/start': {
    entryPoint: true,
    reset: true,
    next: '/choose',
    controller: { get: noop }
  },
  '/choose': {
    next: ['/consent', '/unavailable'],
    controller: { get: noop, post: noop }
  },
  '/consent': {
    next: ['/sign-in'],
    noReturn: true,
    controller: { get: noop, post: noop }
  },
  '/sign-in': {
    next: ['/done'],
    controller: { get: noop }
  },
  '/done': {
    controller: { get: noop }
  },
  '/unavailable': {
    next: ['/choose'],
    noReturn: true,
    controller: { get: noop }
  },
  '/recover': {
    next: ['/choose'],
    reset: true,
    controller: { get: noop }
  }
})

const sessionWithHistory = (wizard: Wizard<TestSession>, ...history: string[]): TestSession => ({
  wizard: { [wizard.name]: { history } }
})

/**
 * simulate a user navigating to `path` inside `wizard`. registers the wizard on a mock router, pulls the guard out of the handler chain,
 * and invokes it against a fake req/res. after the guard runs `res.redirect` is the wizard's validation wrapper, tests should call it directly
 * to simulate a controller. `redirectMock` is the spy used for asserting.
 */
const visit = (wizard: Wizard<TestSession>, path: string, session: TestSession = {}) => {
  const req = { session } as unknown as Request
  const redirectMock = vi.fn()
  const locals: Record<string, unknown> = {}
  const res = { locals, redirect: redirectMock } as unknown as Response
  const next = vi.fn()

  const mockRouter = { get: vi.fn(), post: vi.fn(), use: vi.fn() }
  wizard.register(mockRouter as unknown as Router)

  const chain = mockRouter.get.mock.calls.find((call) => call[0] === path)
  if (!chain) throw new Error(`No GET handler registered for ${path}`)
  const guard = chain[chain.length - 2] as RequestHandler // position of guard in the chain
  guard(req, res, next)

  return {
    proceeded: next.mock.calls.length > 0,
    redirectedTo: redirectMock.mock.calls[0]?.[0] as string | undefined,
    history: req.session.wizard?.[wizard.name]?.history,
    backLink: locals['backLink'] as null | string,
    res,
    redirectMock,
    nextMock: next
  }
}

describe('wizard', () => {
  describe('configuration', () => {
    it('throws when no step is declared as an entryPoint', () => {
      expect(() => createWizard<TestSession>('broken', { '/a': { next: '/b' }, '/b': {} })).toThrow(
        /must declare at least one entryPoint/
      )
    })
  })

  describe('access control with empty history', () => {
    it('allows entryPoint steps', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/start')
      expect(result.proceeded).toBe(true)
    })

    it('redirects non-entryPoint steps to the entryPoint', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/consent')
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/start')
    })

    it('allows entryPoint steps even when history has stale content the step is not part of', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/start', sessionWithHistory(wizard, '/recover', '/choose'))
      expect(result.proceeded).toBe(true)
      expect(result.history).toEqual(['/start'])
    })
  })

  describe('forward navigation', () => {
    it('allows navigating to a declared next-step from the current head', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      expect(result.proceeded).toBe(true)
    })

    it('blocks navigating to a step that is not a declared next-step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/sign-in', sessionWithHistory(wizard, '/start'))
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/start')
    })
  })

  describe('history tracking', () => {
    it('pushes the visited step onto history', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      expect(result.history).toEqual(['/start', '/choose'])
    })

    it('truncates history when navigating back to a step already visited', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/choose',
        sessionWithHistory(wizard, '/start', '/choose', '/unavailable')
      )
      expect(result.proceeded).toBe(true)
      expect(result.history).toEqual(['/start', '/choose'])
    })

    it('leaves history unchanged when refreshing the current step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start', '/choose'))
      expect(result.history).toEqual(['/start', '/choose'])
    })

    it('wipes history when visiting a reset step from an accessible position', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/start', sessionWithHistory(wizard, '/start', '/choose'))
      expect(result.proceeded).toBe(true)
      expect(result.history).toEqual(['/start'])
    })

    it('rejects a non-entryPoint reset step that is blocked by a noReturn barrier', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/recover',
        sessionWithHistory(wizard, '/recover', '/choose', '/consent')
      )
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/consent')
    })
  })

  describe('noReturn barriers', () => {
    it('blocks return to a noReturn step once the user has moved past it', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/consent',
        sessionWithHistory(wizard, '/start', '/choose', '/consent', '/sign-in')
      )
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/sign-in')
    })

    it('blocks return to a step that sits before a noReturn barrier', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/choose',
        sessionWithHistory(wizard, '/start', '/choose', '/consent', '/sign-in')
      )
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/sign-in')
    })

    it('allows refreshing a noReturn step while it is still the current step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/consent',
        sessionWithHistory(wizard, '/start', '/choose', '/consent')
      )
      expect(result.proceeded).toBe(true)
    })

    it('allows forward navigation through a noReturn step via its declared next steps', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/sign-in',
        sessionWithHistory(wizard, '/start', '/choose', '/consent')
      )
      expect(result.proceeded).toBe(true)
    })

    it('allows forward navigation out of a noReturn step that loops back to an earlier step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/choose',
        sessionWithHistory(wizard, '/start', '/choose', '/unavailable')
      )
      expect(result.proceeded).toBe(true)
      expect(result.history).toEqual(['/start', '/choose'])
    })
  })

  describe('prereq', () => {
    it('allows the step when all prereq keys are set on the session', () => {
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/gated', controller: { get: noop } },
        '/gated': {
          prereq: { keys: ['bankID'], redirectTo: '/start' },
          controller: { get: noop }
        }
      })
      const result = visit(wizard, '/gated', {
        ...sessionWithHistory(wizard, '/start'),
        bankID: 'abc'
      })
      expect(result.proceeded).toBe(true)
    })

    it('redirects to `redirectTo` when a prereq key is missing', () => {
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/gated', controller: { get: noop } },
        '/gated': {
          prereq: { keys: ['bankID'], redirectTo: '/start' },
          controller: { get: noop }
        }
      })
      const result = visit(wizard, '/gated', sessionWithHistory(wizard, '/start'))
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/start')
    })

    it('falls back to the current head when redirectTo is omitted from prereq', () => {
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/choose', controller: { get: noop } },
        '/choose': { next: '/gated', controller: { get: noop } },
        '/gated': {
          prereq: { keys: ['bankID'] },
          controller: { get: noop }
        }
      })
      const result = visit(wizard, '/gated', sessionWithHistory(wizard, '/start', '/choose'))
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/choose')
    })

    it('blocks when any one of multiple prereq keys is missing', () => {
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/gated', controller: { get: noop } },
        '/gated': {
          prereq: { keys: ['bankID', 'consentID'], redirectTo: '/start' },
          controller: { get: noop }
        }
      })
      const result = visit(wizard, '/gated', {
        ...sessionWithHistory(wizard, '/start'),
        bankID: 'abc'
        // consentID missing
      })
      expect(result.proceeded).toBe(false)
      expect(result.redirectedTo).toBe('/start')
    })

    it('allows the step when every one of multiple prereq keys is set', () => {
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/gated', controller: { get: noop } },
        '/gated': {
          prereq: { keys: ['bankID', 'consentID'], redirectTo: '/start' },
          controller: { get: noop }
        }
      })
      const result = visit(wizard, '/gated', {
        ...sessionWithHistory(wizard, '/start'),
        bankID: 'abc',
        consentID: 'xyz'
      })
      expect(result.proceeded).toBe(true)
    })
  })

  describe('controller redirect guard', () => {
    it('allows redirects to a declared next-step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      result.res.redirect('/consent')
      expect(result.redirectMock).toHaveBeenCalledWith('/consent')
    })

    it('passes an error to next when a controller redirects to a path not declared as a next-step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      result.res.redirect('/sign-in')
      expect(result.nextMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/not in next/) as string })
      )
      expect(result.redirectMock).not.toHaveBeenCalled()
    })

    it('allows redirects with a query string when the pathname matches', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      result.res.redirect('/consent?foo=bar')
      expect(result.redirectMock).toHaveBeenCalledWith('/consent?foo=bar')
    })

    it('supports the (status, url) overload and forwards both arguments', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      result.res.redirect(301, '/consent')
      expect(result.redirectMock).toHaveBeenCalledWith(301, '/consent')
    })

    it('passes an error to next on the (status, url) overload when the url is not a declared next-step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      result.res.redirect(302, '/sign-in')
      expect(result.nextMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/not in next/) as string })
      )
      expect(result.redirectMock).not.toHaveBeenCalled()
    })

    it('passes an error to next when a step without `exit` redirects to an absolute URL', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      result.res.redirect('https://bank.example.com/auth')
      expect(result.nextMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/is not declared as exit: true/) as string
        })
      )
      expect(result.redirectMock).not.toHaveBeenCalled()
    })
  })

  describe('exit', () => {
    const buildExitJourney = (): WizardSteps<TestSession> => ({
      '/start': { entryPoint: true, next: '/handoff', controller: { get: noop } },
      '/handoff': {
        next: ['/unavailable'],
        exit: true,
        controller: { get: noop, post: noop }
      },
      '/unavailable': { controller: { get: noop } }
    })

    it('allows a redirect to an absolute https URL', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildExitJourney())
      const result = visit(wizard, '/handoff', sessionWithHistory(wizard, '/start'))
      result.res.redirect('https://bank.example.com/auth?state=xyz')
      expect(result.redirectMock).toHaveBeenCalledWith('https://bank.example.com/auth?state=xyz')
    })

    it('allows a redirect to an absolute http URL', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildExitJourney())
      const result = visit(wizard, '/handoff', sessionWithHistory(wizard, '/start'))
      result.res.redirect('http://bank.example.com/auth')
      expect(result.redirectMock).toHaveBeenCalledWith('http://bank.example.com/auth')
    })

    it('still enforces the `next` allowlist for relative redirects on an exit step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildExitJourney())
      const result = visit(wizard, '/handoff', sessionWithHistory(wizard, '/start'))
      result.res.redirect('/unavailable')
      expect(result.redirectMock).toHaveBeenCalledWith('/unavailable')
    })

    it('passes an error to next when an exit step redirects to a relative path not in `next`', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildExitJourney())
      const result = visit(wizard, '/handoff', sessionWithHistory(wizard, '/start'))
      result.res.redirect('/some-other-step')
      expect(result.nextMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/not in next/) as string })
      )
      expect(result.redirectMock).not.toHaveBeenCalled()
    })

    it('supports the (status, url) overload for an absolute URL', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildExitJourney())
      const result = visit(wizard, '/handoff', sessionWithHistory(wizard, '/start'))
      result.res.redirect(302, 'https://bank.example.com/auth')
      expect(result.redirectMock).toHaveBeenCalledWith(302, 'https://bank.example.com/auth')
    })
  })

  describe('backLink', () => {
    it('is null on the entry step', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/start')
      expect(result.backLink).toBeNull()
    })

    it('points to the previous step in history', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/start'))
      expect(result.backLink).toBe('/start')
    })

    it('is null when the current step is noReturn', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/consent', sessionWithHistory(wizard, '/start', '/choose'))
      expect(result.backLink).toBeNull()
    })

    it('is null when the previous step is no longer accessible because of an intervening noReturn', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(
        wizard,
        '/sign-in',
        sessionWithHistory(wizard, '/start', '/choose', '/consent')
      )
      expect(result.backLink).toBeNull()
    })

    it('is null when the previous step is noReturn, even if the current step lists it as a forward next', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const result = visit(wizard, '/choose', sessionWithHistory(wizard, '/unavailable'))
      expect(result.backLink).toBeNull()
    })
  })

  describe('router registration', () => {
    it('registers GET and POST handlers only for steps that declare them', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const router = { get: vi.fn(), post: vi.fn(), use: vi.fn() }
      wizard.register(router as unknown as Router)

      const getCalls = router.get.mock.calls.map((calls) => calls[0] as string)
      const postCalls = router.post.mock.calls.map((calls) => calls[0] as string)

      expect(getCalls).toEqual(
        expect.arrayContaining([
          '/start',
          '/choose',
          '/consent',
          '/sign-in',
          '/done',
          '/unavailable'
        ])
      )
      expect(postCalls).toEqual(expect.arrayContaining(['/choose', '/consent']))
      expect(postCalls).not.toContain('/start')
      expect(postCalls).not.toContain('/sign-in')
      expect(postCalls).not.toContain('/done')
      expect(postCalls).not.toContain('/unavailable')
    })

    it('skips steps that do not declare a controller', () => {
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/next', controller: { get: noop } },
        '/next': { next: '/middleware-only' },
        '/middleware-only': { middleware: [] }
      })
      const router = { get: vi.fn(), post: vi.fn(), use: vi.fn() }
      wizard.register(router as unknown as Router)
      const registered = router.get.mock.calls.map((c) => c[0] as string)
      expect(registered).toEqual(['/start'])
    })

    it('registers per-step middleware before the guard so middleware may redirect freely', () => {
      const stepMiddleware = vi.fn()
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/gated', controller: { get: noop } },
        '/gated': {
          next: ['/forward-only'],
          middleware: [stepMiddleware],
          controller: { get: noop }
        },
        '/forward-only': { controller: { get: noop } }
      })
      const router = { get: vi.fn(), post: vi.fn(), use: vi.fn() }
      wizard.register(router as unknown as Router)
      const call = router.get.mock.calls.find((calls) => calls[0] === '/gated')!
      expect(call[1]).toBe(stepMiddleware)
    })

    it('lets per-step middleware redirect outside the declared next-step set', () => {
      const bailOut: RequestHandler = (_req, res) => {
        res.redirect('/narnia')
      }
      const wizard = createWizard<TestSession>('the-great-journey', {
        '/start': { entryPoint: true, next: '/gated', controller: { get: noop } },
        '/gated': {
          next: ['/forward-only'],
          middleware: [bailOut],
          controller: { get: noop }
        },
        '/forward-only': { controller: { get: noop } }
      })
      const router = { get: vi.fn(), post: vi.fn(), use: vi.fn() }
      wizard.register(router as unknown as Router)
      // chain shape: [path, ...middleware, guard, controller]
      const [middleware] = router.get.mock.calls
        .find((calls) => calls[0] === '/gated')!
        .slice(1) as RequestHandler[]

      const req = { session: sessionWithHistory(wizard, '/start') } as unknown as Request
      const redirect = vi.fn()
      const res = { locals: {}, redirect } as unknown as Response
      middleware!(req, res, vi.fn() as NextFunction)
      expect(redirect).toHaveBeenCalledWith('/narnia')
    })

    it('lets downstream error handlers redirect outside the declared next-step set', () => {
      const wizard = createWizard<TestSession>('the-great-journey', buildJourney())
      const router = { get: vi.fn(), post: vi.fn(), use: vi.fn() }
      wizard.register(router as unknown as Router)

      const chain = router.get.mock.calls.find((c) => c[0] === '/choose')!
      const guard = chain[chain.length - 2] as RequestHandler
      // the wizard's contribution to the express error chain restores res.redirect and passes the error on
      const [wizardErrorPrep] = router.use.mock.calls[0] as [
        (err: unknown, req: Request, res: Response, next: NextFunction) => void
      ]

      const redirect = vi.fn()
      const req = { session: sessionWithHistory(wizard, '/start') } as unknown as Request
      const res = { locals: {}, redirect } as unknown as Response
      const errorHandler: NextFunction = () => {
        res.redirect('https://rp.example/cb?error=access_denied')
      }

      guard(req, res, vi.fn() as NextFunction)
      wizardErrorPrep(new Error('oh no'), req, res, errorHandler)

      expect(redirect).toHaveBeenCalledWith('https://rp.example/cb?error=access_denied')
    })
  })
})
