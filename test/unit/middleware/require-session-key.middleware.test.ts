import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const { requireSessionKey } = await import('@src/middleware')

describe('requireSessionKey middleware', () => {
  it('calls next() when the session key is present', () => {
    const next = vi.fn()
    const req = { session: { bankID: '1337-bank' } } as unknown as Request

    requireSessionKey.middleware('bankID', '/choose-bank')(
      req,
      {} as Response,
      next as NextFunction
    )

    expect(next).toHaveBeenCalled()
  })

  it('redirects to the provided path when the session key is missing', () => {
    const redirect = vi.fn()
    const req = { session: {} } as unknown as Request
    const res = { redirect } as unknown as Response

    requireSessionKey.middleware('bankID', '/choose-bank')(req, res, vi.fn() as NextFunction)

    expect(redirect).toHaveBeenCalledWith('/choose-bank')
  })

  it('does not call next() when the session key is missing', () => {
    const next = vi.fn()
    const req = { session: {} } as unknown as Request
    const res = { redirect: vi.fn() } as unknown as Response

    requireSessionKey.middleware('bankID', '/choose-bank')(req, res, next as NextFunction)

    expect(next).not.toHaveBeenCalled()
  })
})
