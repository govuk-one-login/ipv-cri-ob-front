import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const { flash } = await import('@src/middleware')

describe('flash middleware', () => {
  it('copies session flash messages to res.locals and clears the session', () => {
    const messages = [{ message: { header: 'Success' }, type: 'success' }]
    const req = { session: { flash: messages } } as unknown as Request
    const res = { locals: {} } as unknown as Response

    flash.middleware(req, res, vi.fn() as NextFunction)

    expect(res.locals['flash']).toEqual(messages)
    expect(req.session.flash).toBeUndefined()
  })

  it('sets res.locals.flash to an empty array when there are no flash messages', () => {
    const req = { session: {} } as unknown as Request
    const res = { locals: {} } as unknown as Response

    flash.middleware(req, res, vi.fn() as NextFunction)

    expect(res.locals['flash']).toEqual([])
  })

  it('calls next()', () => {
    const next = vi.fn()
    const req = { session: {} } as unknown as Request
    const res = { locals: {} } as unknown as Response

    flash.middleware(req, res, next as NextFunction)

    expect(next).toHaveBeenCalled()
  })
})
