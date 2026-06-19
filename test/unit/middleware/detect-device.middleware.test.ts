import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const { detectDevice } = await import('@src/middleware')

describe('detect-device middleware', () => {
  it('sets isMobile to true for mobile user agents', () => {
    const req = {
      headers: {
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1)'
      },
      session: {}
    } as unknown as Request
    const res = {} as unknown as Response

    detectDevice.middleware(req, res, vi.fn() as NextFunction)

    expect(req.session.isMobile).toBe(true)
  })

  it('sets isMobile to false for desktop user agents', () => {
    const req = {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
      },
      session: {}
    } as unknown as Request
    const res = {} as unknown as Response

    detectDevice.middleware(req, res, vi.fn() as NextFunction)

    expect(req.session.isMobile).toBe(false)
  })

  it('sets isMobile to false for tablet user agents', () => {
    const req = {
      headers: {
        'user-agent':
          'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      },
      session: {}
    } as unknown as Request
    const res = {} as unknown as Response

    detectDevice.middleware(req, res, vi.fn() as NextFunction)

    expect(req.session.isMobile).toBe(false)
  })

  it('sets isMobile to false when no user-agent header is present', () => {
    const req = { headers: {}, session: {} } as unknown as Request
    const res = {} as unknown as Response

    detectDevice.middleware(req, res, vi.fn() as NextFunction)

    expect(req.session.isMobile).toBe(false)
  })

  it('sets isMobile to false when no user-agent header is present', () => {
    const req = { headers: {}, session: {} } as unknown as Request
    const res = {} as unknown as Response

    detectDevice.middleware(req, res, vi.fn() as NextFunction)

    expect(req.session.isMobile).toBe(false)
  })

  it('calls next()', () => {
    const next = vi.fn()
    const req = { headers: {}, session: {} } as unknown as Request
    const res = {} as unknown as Response

    detectDevice.middleware(req, res, next as NextFunction)

    expect(next).toHaveBeenCalledOnce()
  })
})
