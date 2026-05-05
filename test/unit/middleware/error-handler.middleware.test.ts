import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const mockLoggerError = vi.fn()

vi.mock('@src/utils/logger', () => ({
  getLogger: () => ({ error: mockLoggerError })
}))

const { errorHandler } = await import('@src/middleware')

describe('error handler middleware', () => {
  it('logs the error type and location', () => {
    const err = new Error('something went wrong')
    const res = {
      headersSent: false,
      render: vi.fn(),
      status: vi.fn().mockReturnThis()
    } as unknown as Response

    errorHandler.middleware(err, {} as Request, res, vi.fn() as NextFunction)

    expect(mockLoggerError).toHaveBeenCalledWith(
      {
        location: expect.any(String) as string,
        type: 'Error'
      },
      'something went wrong'
    )
  })

  it('renders the error page with 500 status', () => {
    const err = new Error('something went wrong')
    const render = vi.fn()
    const status = vi.fn().mockReturnValue({ render })
    const res = { headersSent: false, status } as unknown as Response

    errorHandler.middleware(err, {} as Request, res, vi.fn() as NextFunction)

    expect(status).toHaveBeenCalledWith(500)
    expect(render).toHaveBeenCalledWith('errors/error', { error: err })
  })

  it('does not render if headers already sent', () => {
    const err = new Error('something went wrong')
    const render = vi.fn()
    const status = vi.fn().mockReturnValue({ render })
    const res = { headersSent: true, status } as unknown as Response

    errorHandler.middleware(err, {} as Request, res, vi.fn() as NextFunction)

    expect(status).not.toHaveBeenCalled()
    expect(render).not.toHaveBeenCalled()
  })
})
