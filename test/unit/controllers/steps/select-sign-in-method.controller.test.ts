import type { Request, Response } from 'express'
import type { SessionData } from 'express-session'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

const BANK_CONSENT_URL = 'https://bank.example/consent/abc'

const mockRender = vi.fn()

const buildReq = (body: { selectSignInMethod: string }): Request =>
  ({
    body,
    session: { bankConsentURL: BANK_CONSENT_URL } satisfies Partial<SessionData>
  }) as Request

const buildRes = (): Response =>
  ({
    locals: { translate: (key: string) => key },
    render: mockRender
  }) as unknown as Response

const { get, post } = await import('@src/controllers/steps/select-sign-in-method.controller')

describe('select-sign-in-method controller', () => {
  beforeEach(() => {
    mockRender.mockReset()
  })

  describe('get', () => {
    it('renders the page ', () => {
      const render = vi.fn()

      get({} as Request, { render } as unknown as Response)

      expect(render).toHaveBeenCalledWith('pages/steps/select-sign-in-method', expect.anything())
    })
  })

  describe('post', () => {
    it('redirects appropriately when "use-different-device" is selected', () => {
      const redirect = vi.fn()
      const req = buildReq({ selectSignInMethod: 'use-different-device' })

      post(req, { redirect } as unknown as Response)

      expect(redirect).toHaveBeenCalledWith(paths.steps.scanQuickResponseCode)
    })

    it('redirects appropriately when "stay-on-current-device" is selected', () => {
      const redirect = vi.fn()
      const req = buildReq({ selectSignInMethod: 'stay-on-current-device' })
      post(req, { redirect } as unknown as Response)

      expect(redirect).toHaveBeenCalledWith(BANK_CONSENT_URL)
    })

    it('re-renders with errors when no option is selected', () => {
      const req = buildReq({ selectSignInMethod: '' })
      const res = buildRes()

      post(req, res)

      expect(mockRender).toHaveBeenCalledWith(
        'pages/steps/select-sign-in-method',
        expect.objectContaining({
          errorList: [
            { href: '#select-sign-in-method', text: 'pages.selectSignInMethod.radio.errorMessage' }
          ],
          formErrors: { selectSignInMethod: 'pages.selectSignInMethod.radio.errorMessage' }
        })
      )
    })

    it('re-renders with errors when a tampered value is submitted', () => {
      const req = buildReq({ selectSignInMethod: 'tampered-radio-value' })
      const res = buildRes()

      post(req, res)

      expect(mockRender).toHaveBeenCalledWith(
        'pages/steps/select-sign-in-method',
        expect.objectContaining({
          errorList: [
            { href: '#select-sign-in-method', text: 'pages.selectSignInMethod.radio.errorMessage' }
          ],
          formErrors: { selectSignInMethod: 'pages.selectSignInMethod.radio.errorMessage' }
        })
      )
    })
  })
})
