import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const { get } = await import('@src/controllers/index.controller')

describe('index controller', () => {
  it('returns the english message by default', () => {
    const render = vi.fn()
    get({} as Request, { render } as unknown as Response, vi.fn() as unknown as NextFunction)
    expect(render).toHaveBeenCalledWith('index.njk', { message: 'hello from the controller' })
  })

  it('returns the welsh message when language is cy', () => {
    const render = vi.fn()
    get(
      { language: 'cy' } as Request,
      { render } as unknown as Response,
      vi.fn() as unknown as NextFunction
    )
    expect(render).toHaveBeenCalledWith('index.njk', { message: 'helo gan y rheolydd' })
  })
})
