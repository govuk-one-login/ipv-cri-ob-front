import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn().mockResolvedValue(undefined) }))
const { mockAddFlash } = vi.hoisted(() => ({ mockAddFlash: vi.fn() }))
const { mockChildLogger, mockLogger } = vi.hoisted(() => {
  const mockChildLogger = { error: vi.fn(), info: vi.fn() }
  return { mockChildLogger, mockLogger: { child: vi.fn().mockReturnValue(mockChildLogger) } }
})

vi.mock('@src/clients/stubs/webhook.client', () => ({
  webhookClient: () => ({ send: mockSend })
}))

vi.mock('@src/utils/flash', () => ({ addFlash: mockAddFlash }))
vi.mock('@src/utils/logger', () => ({ LOGGER: mockLogger }))

const { get, post } = await import('@src/controllers/stubs/webhook.controller')

describe('webhook stub controller', () => {
  describe('get', () => {
    it('renders the stub page with session data', () => {
      const render = vi.fn()
      const req = {
        query: {},
        session: { consentID: 'test-consent-id', id: 'test-session-id' }
      } as unknown as Request

      get(req, { render } as unknown as Response, vi.fn() as NextFunction)

      expect(render).toHaveBeenCalledWith(
        'pages/stubs/index.njk',
        expect.objectContaining({ consentID: 'test-consent-id', sessionID: 'test-session-id' })
      )
    })

    it('marks the previous outcome options as selected from query param', () => {
      const render = vi.fn()
      const req = {
        query: { accountAssessment: 'NotValid', consent: 'Canceled' },
        session: { consentID: 'test-consent-id', id: 'test-session-id' }
      } as unknown as Request

      get(req, { render } as unknown as Response, vi.fn() as NextFunction)

      expect(render).toHaveBeenCalledWith(
        'pages/stubs/index.njk',
        expect.objectContaining({
          accountAssessmentOutcomeOptions: expect.arrayContaining([
            expect.objectContaining({ selected: false, text: 'Valid', value: 'Valid' }),
            expect.objectContaining({ selected: true, text: 'Not valid', value: 'NotValid' })
          ]) as object[],
          consentOutcomeOptions: expect.arrayContaining([
            expect.objectContaining({ selected: false, text: 'Authorised', value: 'Authorized' }),
            expect.objectContaining({ selected: true, text: 'Cancelled', value: 'Canceled' })
          ]) as object[]
        })
      )
    })

    it('includes sent webhook history from session', () => {
      const render = vi.fn()
      const req = {
        query: {},
        session: {
          consentID: 'test-consent-id',
          id: 'test-session-id',
          webhooksSent: { 'test-consent-id': { accountAssessment: 'Valid', consent: 'Authorised' } }
        }
      } as unknown as Request

      get(req, { render } as unknown as Response, vi.fn() as NextFunction)

      expect(render).toHaveBeenCalledWith(
        'pages/stubs/index.njk',
        expect.objectContaining({ sentAccountAssessment: 'Valid', sentConsent: 'Authorised' })
      )
    })
  })

  describe('post', () => {
    it('redirects when body contains no valid webhook values', async () => {
      const redirect = vi.fn()
      const req = {
        body: {},
        query: {},
        session: { consentID: 'test-consent-id' }
      } as unknown as Request

      await post(req, { redirect } as unknown as Response, vi.fn() as NextFunction)

      expect(redirect).toHaveBeenCalledWith(paths.index)
    })

    it.each([
      {
        body: { consent: 'Authorized' },
        expectedRedirect: `${paths.stubs.webhook}?consent=Authorized`
      },
      {
        body: { accountAssessment: 'Valid' },
        expectedRedirect: `${paths.stubs.webhook}?accountAssessment=Valid`
      }
    ])(
      'sends the webhook and redirects with the outcome as a query param',
      async ({ body, expectedRedirect }) => {
        const redirect = vi.fn()
        const req = {
          axios: vi.fn(),
          body,
          query: {},
          session: { consentID: 'test-consent-id' }
        } as unknown as Request

        await post(req, { redirect } as unknown as Response, vi.fn() as NextFunction)

        expect(mockSend).toHaveBeenCalled()
        expect(mockLogger.child).toHaveBeenCalledWith(
          expect.objectContaining({ component: 'webhook-stub', consent_id: 'test-consent-id' })
        )
        expect(mockChildLogger.info).toHaveBeenCalledWith('webhook send success')
        expect(redirect).toHaveBeenCalledWith(expectedRedirect)
      }
    )

    it.each([
      { body: { consent: 'Authorized' }, expected: 'Authorised', key: 'consent' },
      { body: { accountAssessment: 'Valid' }, expected: 'Valid', key: 'accountAssessment' }
    ])(
      'stores $key webhook history on the session after a successful send',
      async ({ body, expected, key }) => {
        const req = {
          axios: vi.fn(),
          body,
          query: {},
          session: { consentID: 'test-consent-id' }
        } as unknown as Request

        await post(req, { redirect: vi.fn() } as unknown as Response, vi.fn() as NextFunction)

        expect(
          req.session.webhooksSent?.['test-consent-id']?.[key as 'accountAssessment' | 'consent']
        ).toBe(expected)
      }
    )

    it('adds an error flash when the webhook send fails', async () => {
      mockSend.mockRejectedValueOnce(
        Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' })
      )

      const req = {
        axios: vi.fn(),
        body: { consent: 'Authorized' },
        query: {},
        session: { consentID: 'test-consent-id' }
      } as unknown as Request

      await post(req, { redirect: vi.fn() } as unknown as Response, vi.fn() as NextFunction)

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ECONNREFUSED' }),
        'webhook send failure'
      )
      expect(mockAddFlash).toHaveBeenCalledWith(req, expect.objectContaining({ type: 'error' }))
    })
  })
})
