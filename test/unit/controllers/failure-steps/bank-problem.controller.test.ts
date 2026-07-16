import type { Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

const { get, post } = await import('@src/controllers/failure-steps/bank-problem.controller')

describe('bank-problem controller', () => {
  describe('get', () => {
    it('renders the page ', () => {
      const render = vi.fn()

      get({} as Request, { render } as unknown as Response)

      expect(render).toHaveBeenCalledWith('pages/failure-steps/bank-problem', expect.anything())
    })
  })

  describe('post', () => {
    it('redirects appropriately when "try again" is selected', () => {
      const redirect = vi.fn()
      const req = {
        body: { bankProblem: 'try-again' }
      } as Request

      post(req, { redirect } as unknown as Response)

      expect(redirect).toHaveBeenCalledWith(paths.steps.chooseBank)
    })

    it('redirects appropriately when "prove another way" is selected', () => {
      const redirect = vi.fn()
      const req = {
        body: { bankProblem: 'prove-another-way' }
      } as Request

      post(req, { redirect } as unknown as Response)

      expect(redirect).toHaveBeenCalledWith(paths.steps.proveAnotherWay)
    })

    it('re-renders with errors when no option is selected', () => {
      const render = vi.fn()
      const req = {
        body: { bankProblem: '' }
      } as Request
      const res = {
        locals: { translate: (key: string) => key },
        render
      } as unknown as Response

      post(req, res)

      expect(render).toHaveBeenCalledWith(
        'pages/failure-steps/bank-problem',
        expect.objectContaining({
          errorList: [{ href: '#bank-problem', text: 'pages.bankProblem.radio.errorMessage' }],
          formErrors: { bankProblem: 'pages.bankProblem.radio.errorMessage' }
        })
      )
    })

    it('re-renders with errors when a tampered value is submitted', () => {
      const render = vi.fn()
      const req = {
        body: { bankProblem: 'tampered-radio-value' }
      } as Request
      const res = {
        locals: { translate: (key: string) => key },
        render
      } as unknown as Response

      post(req, res)

      expect(render).toHaveBeenCalledWith(
        'pages/failure-steps/bank-problem',
        expect.objectContaining({
          errorList: [{ href: '#bank-problem', text: 'pages.bankProblem.radio.errorMessage' }],
          formErrors: { bankProblem: 'pages.bankProblem.radio.errorMessage' }
        })
      )
    })
  })
})
