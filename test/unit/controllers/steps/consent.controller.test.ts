import type { ConsentResponse } from '@src/models/consent.class'
import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

const BANK_CONSENT_URL = new URL('https://bank.example/consent/abc')

vi.mock('@src/clients/consents.client', () => ({
  consentsClient: () => ({
    createConsent: vi.fn().mockResolvedValue({
      bankConsentURL: BANK_CONSENT_URL,
      bankID: '1337-bank-id',
      consentID: '0451-consent-id'
    } satisfies Partial<ConsentResponse>)
  })
}))

const { get, post } = await import('@src/controllers/steps/consent.controller')

const buildReq = (overrides: Partial<Request['session']> = {}): Request =>
  ({
    axios: vi.fn(),
    body: { consent: 'consent' },
    session: { bankID: 'test-bank-1', ...overrides },
    sessionID: 'test-session-id'
  }) as unknown as Request

describe('consent controller', () => {
  describe('get', () => {
    it('renders the correct view and sets selectedBankName on locals', () => {
      const render = vi.fn()
      const req = { session: { bankName: 'Test Bank One' } } as unknown as Request
      const res = { locals: {}, render } as unknown as Response

      get(req, res, vi.fn() as NextFunction)

      expect(res.locals['selectedBankName']).toBe('Test Bank One')
      expect(render).toHaveBeenCalledWith('pages/steps/consent', {
        proveAnotherWay: paths.steps.proveAnotherWay
      })
    })
  })

  describe('post', () => {
    it('stores the consentID and bankConsentURL from the API response on the session', async () => {
      const req = buildReq()
      const res = { redirect: vi.fn() } as unknown as Response

      await post(req, res)

      expect(req.session.consentID).toBe('0451-consent-id')
      expect(req.session.bankConsentURL).toBe(BANK_CONSENT_URL.toString())
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

    it('redirects to the bank consent url when the session is flagged as mobile', async () => {
      const req = buildReq({ isMobile: true })
      const redirect = vi.fn()
      const res = { redirect } as unknown as Response

      await post(req, res)

      expect(redirect).toHaveBeenCalledWith(BANK_CONSENT_URL.toString())
    })

    it('redirects to the select sign-in method step when the session is not flagged as mobile', async () => {
      const req = buildReq({ isMobile: false })
      const redirect = vi.fn()
      const res = { redirect } as unknown as Response

      await post(req, res)

      expect(redirect).toHaveBeenCalledWith(paths.steps.selectSignInMethod)
    })

    it('redirects to the select sign-in method step when isMobile is not set on the session', async () => {
      const req = buildReq()
      const redirect = vi.fn()
      const res = { redirect } as unknown as Response

      await post(req, res)

      expect(redirect).toHaveBeenCalledWith(paths.steps.selectSignInMethod)
    })
  })
})
