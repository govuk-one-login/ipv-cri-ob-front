import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@src/utils/logger', () => ({
  getLogger: () => ({ error: vi.fn() })
}))

const { forceSessionSave } = await import('@src/middleware')

describe('forceSessionSaveBeforeRedirect middleware', () => {
  it('calls next()', () => {
    const next = vi.fn()
    forceSessionSave.middleware(
      {} as Request,
      { redirect: vi.fn() } as unknown as Response,
      next as NextFunction
    )
    expect(next).toHaveBeenCalled()
  })

  it('saves the session before redirecting', () => {
    const save = vi.fn((cb: (_: null) => void) => cb(null))
    const redirectSpy = vi.fn()
    const req = { session: { save } } as unknown as Request
    const res = { redirect: redirectSpy } as unknown as Response

    forceSessionSave.middleware(req, res, vi.fn())
    res.redirect('/next')

    expect(save).toHaveBeenCalled()
    expect(redirectSpy).toHaveBeenCalledWith(302, '/next')
  })

  it('redirects even if session save errors', () => {
    const save = vi.fn((cb: (_: Error) => void) => cb(new Error('save failure')))
    const redirectSpy = vi.fn()
    const req = { session: { save } } as unknown as Request
    const res = { redirect: redirectSpy } as unknown as Response

    forceSessionSave.middleware(req, res, vi.fn())
    res.redirect('/next')

    expect(redirectSpy).toHaveBeenCalledWith(302, '/next')
  })

  it('redirects when there is no session', () => {
    const redirectSpy = vi.fn()
    const req = {} as Request
    const res = { redirect: redirectSpy } as unknown as Response

    forceSessionSave.middleware(req, res, vi.fn())
    res.redirect('/next')

    expect(redirectSpy).toHaveBeenCalledWith(302, '/next')
  })

  it('uses the provided status code', () => {
    const redirectSpy = vi.fn()
    const req = {} as Request
    const res = { redirect: redirectSpy } as unknown as Response

    forceSessionSave.middleware(req, res, vi.fn())
    res.redirect(301, '/next')

    expect(redirectSpy).toHaveBeenCalledWith(301, '/next')
  })
})
