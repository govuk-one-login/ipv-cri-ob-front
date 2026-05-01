import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

const { get } = await import('@src/controllers/steps/start.controller')

vi.mock('@src/utils/logger', () => ({
  getLogger: () => ({ info: vi.fn() })
}))

describe('start controller', () => {
  const render = vi.fn()
  get({} as Request, { render } as unknown as Response, vi.fn() as unknown as NextFunction)

  it('renders the correct view', () => {
    expect(render).toHaveBeenCalledWith('pages/steps/start.njk', expect.anything())
  })

  it('provides the next cri step', () => {
    expect(render).toHaveBeenCalledWith(expect.anything(), {
      nextStep: '/agree-share-bank-information'
    })
  })
})
