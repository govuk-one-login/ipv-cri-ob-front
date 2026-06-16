import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

const { get } = await import('@src/controllers/steps/prove-another-way.controller')

describe('prove-another-way controller', () => {
  it('redirects to the oauth2 callback path', () => {
    const redirect = vi.fn()
    const req = {} as unknown as Request
    const res = { redirect } as unknown as Response

    get(req, res, vi.fn() as NextFunction)

    expect(redirect).toHaveBeenCalledWith(paths.oauth2.callback)
  })
})
