import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const { saveSessionOnRedirect } = await import('@src/middleware')

const buildReq = (save: (cb: (err?: Error) => void) => void) =>
  ({ session: { save } }) as unknown as Request

const buildRes = () => {
  const originalRedirect = vi.fn()
  const res = { redirect: originalRedirect } as unknown as Response
  return { originalRedirect, res }
}

describe('saveSessionOnRedirect middleware', () => {
  it('calls next() to pass control down the chain', () => {
    const next = vi.fn()
    const req = buildReq(vi.fn())
    const { res } = buildRes()

    saveSessionOnRedirect.middleware(req, res, next as NextFunction)

    expect(next).toHaveBeenCalledOnce()
  })

  it('saves the session before invoking the original redirect', () => {
    const save = vi.fn((cb: (err?: Error) => void) => cb())
    const req = buildReq(save)
    const { originalRedirect, res } = buildRes()

    saveSessionOnRedirect.middleware(req, res, vi.fn() as NextFunction)
    res.redirect('/next')

    expect(save).toHaveBeenCalledOnce()
    expect(originalRedirect).toHaveBeenCalledWith('/next')
    expect(save.mock.invocationCallOrder[0]!).toBeLessThan(
      originalRedirect.mock.invocationCallOrder[0]!
    )
  })

  it('forwards status and url to the original redirect', () => {
    const save = vi.fn((cb: (err?: Error) => void) => cb())
    const req = buildReq(save)
    const { originalRedirect, res } = buildRes()

    saveSessionOnRedirect.middleware(req, res, vi.fn() as NextFunction)
    res.redirect(302, '/next')

    expect(originalRedirect).toHaveBeenCalledWith(302, '/next')
  })

  it('passes a session-save error to next() and does not redirect', () => {
    const error = new Error('save failed')
    const save = vi.fn((cb: (err?: Error) => void) => cb(error))
    const req = buildReq(save)
    const { originalRedirect, res } = buildRes()
    const next = vi.fn()

    saveSessionOnRedirect.middleware(req, res, next as NextFunction)
    res.redirect('/next')

    expect(next).toHaveBeenLastCalledWith(error)
    expect(originalRedirect).not.toHaveBeenCalled()
  })
})
