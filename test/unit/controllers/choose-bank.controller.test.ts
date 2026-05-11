import type { Bank } from '@src/models/bank.class'
import type { Request, Response } from 'express'

import { describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

const mockBanks: Bank[] = [
  { bankID: 'test-bank-1', friendlyName: 'Test Bank One', sandbox: false, status: 'Online' },
  { bankID: 'test-bank-2', friendlyName: 'Test Bank Two', sandbox: false, status: 'Online' }
]

vi.mock('@src/clients/banks.client', () => ({
  banksClient: () => ({
    getBanks: vi.fn().mockResolvedValue(mockBanks)
  })
}))

const { get, post } = await import('@src/controllers/steps/choose-bank.controller')

describe('choose-bank controller', () => {
  describe('get', () => {
    it('renders the correct view with a banks list and back link', async () => {
      const render = vi.fn()
      const req = { axios: {} } as unknown as Request
      const emptySelectOption = { selected: true, text: '', value: '' }

      await get(req, { render } as unknown as Response)

      expect(render).toHaveBeenCalledWith(
        'pages/steps/choose-bank',
        expect.objectContaining({
          backLink: paths.steps.start,
          banksList: expect.arrayContaining([
            emptySelectOption,
            {
              text: 'Test Bank One',
              value: 'test-bank-1'
            },
            {
              text: 'Test Bank Two',
              value: 'test-bank-2'
            }
          ]) as object[]
        })
      )
    })
  })

  describe('post', () => {
    it('stores the selected bank on the session and redirects to consent', async () => {
      const redirect = vi.fn()
      const req = {
        axios: {},
        body: { bankSelect: 'test-bank-1' },
        session: {}
      } as unknown as Request

      await post(req, { redirect } as unknown as Response)

      expect(req.session.bankID).toBe('test-bank-1')
      expect(req.session.bankName).toBe('Test Bank One')
      expect(redirect).toHaveBeenCalledWith(paths.steps.consent)
    })

    it('re-renders with errors when no bank is selected', async () => {
      const render = vi.fn()
      const req = {
        axios: {},
        body: { bankSelect: '' },
        session: {}
      } as unknown as Request
      const res = {
        locals: { translate: (key: string) => key },
        render
      } as unknown as Response

      await post(req, res)

      expect(render).toHaveBeenCalledWith(
        'pages/steps/choose-bank',
        expect.objectContaining({
          errorList: [{ href: '#bank-select', text: 'pages.chooseBank.errorMessage' }],
          formErrors: { bankSelect: 'pages.chooseBank.errorMessage' }
        })
      )
    })

    it('re-renders with errors when a tampered bank value is submitted', async () => {
      const render = vi.fn()
      const req = {
        axios: {},
        body: { bankSelect: 'not-a-real-bank' },
        session: {}
      } as unknown as Request
      const res = {
        locals: { translate: (key: string) => key },
        render
      } as unknown as Response

      await post(req, res)

      expect(render).toHaveBeenCalledWith(
        'pages/steps/choose-bank',
        expect.objectContaining({
          errorList: [{ href: '#bank-select', text: 'pages.chooseBank.errorMessage' }],
          formErrors: { bankSelect: 'pages.chooseBank.errorMessage' }
        })
      )
    })
  })
})
