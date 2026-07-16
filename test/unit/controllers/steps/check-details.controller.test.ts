import type { Request, Response } from 'express'

import { beforeAll, describe, expect, it, vi } from 'vitest'

const { get } = await import('@src/controllers/steps/check-details.controller')

describe('check-details controller', () => {
  const render = vi.fn()

  beforeAll(() => {
    get({} as Request, { render } as unknown as Response)
  })

  it('renders the correct view', () => {
    expect(render).toHaveBeenCalledWith('pages/steps/check-details', expect.anything())
  })
})
