import type { ConsentResponse } from '@src/models/consent.class'
import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

vi.mock('@src/config/app', () => ({
  default: { STUBS: { ENABLED: false } }
}))

vi.mock('@src/clients/consents.client', () => ({
  consentsClient: () => ({
    createConsent: vi.fn().mockResolvedValue({
      bankID: '1337-bank-id',
      consentID: '0451-consent-id'
    } satisfies Partial<ConsentResponse>)
  })
}))

const { get, post } = await import('@src/controllers/steps/consent.controller')

describe('consent controller', () => {
  describe('get', () => {
    it('renders the correct view and sets selectedBankName on locals', () => {
      const render = vi.fn()
      const req = { session: { bankName: 'Test Bank One' } } as unknown as Request
      const res = { locals: {}, render } as unknown as Response

      get(req, res, vi.fn() as NextFunction)

      expect(res.locals['selectedBankName']).toBe('Test Bank One')
      expect(render).toHaveBeenCalledWith('pages/steps/consent', expect.anything())
    })
  })

  describe('post', () => {
    it('stores the consentID from the API response on the session', async () => {
      const req = {
        axios: vi.fn(),
        body: { consent: 'consent' },
        session: { bankID: 'test-bank-1' },
        sessionID: 'test-session-id'
      } as unknown as Request
      const res = {
        redirect: vi.fn(),
        status: vi.fn().mockReturnValue({ json: vi.fn() })
      } as unknown as Response

      await post(req, res)

      expect(req.session.consentID).toBe('0451-consent-id')
    })

    it('re-renders with errors when consent is not given', async () => {
      const render = vi.fn()
      const req = {
        axios: vi.fn(),
        body: {},
        session: { bankID: 'test-bank-1' },
        sessionID: 'test-session-id'
      } as unknown as Request
      const res = {
        locals: { translate: (key: string) => key },
        render
      } as unknown as Response

      await post(req, res)

      expect(render).toHaveBeenCalledWith(
        'pages/steps/consent',
        expect.objectContaining({
          errorList: [{ href: '#consent', text: 'pages.consent.checkbox.errorMessage' }],
          formErrors: { consent: 'pages.consent.checkbox.errorMessage' }
        })
      )
    })

    it('redirects to the webhook stub when stubs are enabled', async () => {
      vi.resetModules()
      vi.doMock('@src/config/app', () => ({ default: { STUBS: { ENABLED: true } } }))

      const { post } = await import('@src/controllers/steps/consent.controller')
      const redirect = vi.fn()
      const req = {
        axios: {},
        body: { consent: 'consent' },
        session: { bankID: 'test-bank-1' },
        sessionID: 'test-session-id'
      } as unknown as Request
      const res = {
        redirect
      } as unknown as Response

      await post(req, res)

      expect(redirect).toHaveBeenCalledWith(paths.stubs.webhook)
    })

    it('returns 501 when stubs are not enabled', async () => {
      const status = vi.fn().mockReturnValue({ json: vi.fn() })
      const req = {
        axios: vi.fn(),
        body: { consent: 'consent' },
        session: { bankID: 'test-bank-1' },
        sessionID: 'test-session-id'
      } as unknown as Request
      const res = {
        status
      } as unknown as Response

      await post(req, res)

      expect(status).toHaveBeenCalledWith(501)
    })
  })
})
