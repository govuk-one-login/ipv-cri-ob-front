import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const { requireConsentID } = await import('@src/middleware')

describe('requireConsentID middleware', () => {
  it('calls next() when consentID is present on the session', () => {
    const next = vi.fn()
    const req = { session: { consentID: 'some-uuid' } } as unknown as Request

    requireConsentID.middleware(req, {} as Response, next as NextFunction)

    expect(next).toHaveBeenCalled()
  })

  it('renders session-ended with 401 when consentID is missing', () => {
    const render = vi.fn()
    const status = vi.fn().mockReturnValue({ render })
    const req = { session: {} } as unknown as Request
    const res = { status } as unknown as Response

    requireConsentID.middleware(req, res, vi.fn() as NextFunction)

    expect(status).toHaveBeenCalledWith(401)
    expect(render).toHaveBeenCalledWith('errors/session-ended')
  })

  it('does not call next() when consentID is missing', () => {
    const next = vi.fn()
    const req = { session: {} } as unknown as Request
    const res = { status: vi.fn().mockReturnValue({ render: vi.fn() }) } as unknown as Response

    requireConsentID.middleware(req, res, next as NextFunction)

    expect(next).not.toHaveBeenCalled()
  })
})
