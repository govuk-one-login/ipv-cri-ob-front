import type { NextFunction, Request, Response } from 'express'

import { beforeAll, describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

vi.mock('@src/utils/logger', () => ({
  getLogger: () => ({ info: vi.fn() })
}))

const { get } = await import('@src/controllers/steps/start.controller')

describe('start controller', () => {
  const render = vi.fn()

  beforeAll(() => {
    get({} as Request, { render } as unknown as Response, vi.fn() as NextFunction)
  })

  it('renders the correct view', () => {
    expect(render).toHaveBeenCalledWith('pages/steps/start.njk', expect.anything())
  })

  it('provides the next step link in the context', () => {
    expect(render).toHaveBeenCalledWith(expect.anything(), {
      nextStep: paths.steps.chooseBank
    })
  })
})
