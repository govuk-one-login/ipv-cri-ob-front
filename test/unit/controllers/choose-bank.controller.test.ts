import type { Bank } from '@src/models/bank.class'
import type { Request, Response } from 'express'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import paths from '@src/config/paths'

const onlineBank: Bank = {
  bankID: 'test-online-bank',
  friendlyName: 'Test Online Bank',
  sandbox: false,
  status: 'Online'
}
const offlineBank: Bank = {
  bankID: 'test-offline-bank',
  friendlyName: 'Test Offline Bank',
  sandbox: false,
  status: 'Offline'
}

const mockGetBanks = vi.fn()

vi.mock('@src/clients/banks.client', () => ({
  banksClient: () => ({
    getBanks: mockGetBanks
  })
}))

const { get, post } = await import('@src/controllers/steps/choose-bank.controller')

describe('choose-bank controller', () => {
  const emptySelectOption = { selected: true, text: '', value: '' }

  beforeEach(() => {
    mockGetBanks.mockReset()
  })

  describe('get', () => {
    it('renders the page with the banks list', async () => {
      mockGetBanks.mockResolvedValue([onlineBank, offlineBank])
      const render = vi.fn()
      const req = { axios: {} } as unknown as Request

      await get(req, { render } as unknown as Response)

      expect(render).toHaveBeenCalledWith(
        'pages/steps/choose-bank',
        expect.objectContaining({
          bankNotListedLink: paths.steps.proveAnotherWay,
          banksList: [
            emptySelectOption,
            { text: 'Test Online Bank', value: 'test-online-bank' },
            { text: 'Test Offline Bank', value: 'test-offline-bank' }
          ]
        })
      )
    })

    it('renders the page when there is only one online bank', async () => {
      mockGetBanks.mockResolvedValue([onlineBank])
      const render = vi.fn()
      const req = { axios: {} } as unknown as Request

      await get(req, { render } as unknown as Response)

      expect(render).toHaveBeenCalledWith(
        'pages/steps/choose-bank',
        expect.objectContaining({
          banksList: [emptySelectOption, { text: 'Test Online Bank', value: 'test-online-bank' }]
        })
      )
    })

    it('redirects to prove-another-way when all banks are offline', async () => {
      const anotherOfflineBank = {
        ...offlineBank,
        bankID: 'another-offline-bank',
        friendlyName: 'Another Test Offline Bank'
      }
      mockGetBanks.mockResolvedValue([offlineBank, anotherOfflineBank])
      const redirect = vi.fn()
      const render = vi.fn()
      const req = { axios: {} } as unknown as Request

      await get(req, { redirect, render } as unknown as Response)

      expect(redirect).toHaveBeenCalledWith(paths.steps.proveAnotherWay)
      expect(render).not.toHaveBeenCalled()
    })

    it('redirects to prove-another-way when only one bank exists and it is offline', async () => {
      mockGetBanks.mockResolvedValue([offlineBank])
      const redirect = vi.fn()
      const render = vi.fn()
      const req = { axios: {} } as unknown as Request

      await get(req, { redirect, render } as unknown as Response)

      expect(redirect).toHaveBeenCalledWith(paths.steps.proveAnotherWay)
      expect(render).not.toHaveBeenCalled()
    })

    it('redirects to prove-another-way when banks list is empty', async () => {
      mockGetBanks.mockResolvedValue([])
      const redirect = vi.fn()
      const render = vi.fn()
      const req = { axios: {} } as unknown as Request

      await get(req, { redirect, render } as unknown as Response)

      expect(redirect).toHaveBeenCalledWith(paths.steps.proveAnotherWay)
      expect(render).not.toHaveBeenCalled()
    })

    it('lets the error propagate when getBanks rejects on page load', async () => {
      mockGetBanks.mockRejectedValue(new Error('DynamoDB timeout'))
      const req = { axios: {} } as unknown as Request
      const res = { redirect: vi.fn(), render: vi.fn() } as unknown as Response

      await expect(get(req, res)).rejects.toThrow('DynamoDB timeout')
    })
  })

  describe('post', () => {
    it('stores the selected bank on the session and redirects to consent when bank is online', async () => {
      mockGetBanks.mockResolvedValue([onlineBank, offlineBank])
      const redirect = vi.fn()
      const req = {
        axios: {},
        body: { bankSelect: 'test-online-bank' },
        session: {}
      } as unknown as Request

      await post(req, { redirect } as unknown as Response)

      expect(req.session.bankID).toBe('test-online-bank')
      expect(req.session.bankName).toBe('Test Online Bank')
      expect(redirect).toHaveBeenCalledWith(paths.steps.consent)
    })

    it('redirects to sorry-problem-bank when selected bank is offline', async () => {
      mockGetBanks.mockResolvedValue([onlineBank, offlineBank])
      const redirect = vi.fn()
      const req = {
        axios: {},
        body: { bankSelect: 'test-offline-bank' },
        session: {}
      } as unknown as Request

      await post(req, { redirect } as unknown as Response)

      expect(req.session.bankID).toBe('test-offline-bank')
      expect(req.session.bankName).toBe('Test Offline Bank')
      expect(redirect).toHaveBeenCalledWith(paths.failureSteps.bankUnavailable)
    })

    it('re-renders with errors when no bank is selected', async () => {
      mockGetBanks.mockResolvedValue([onlineBank, offlineBank])
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

    it('re-renders with errors when an unknown bank is submitted', async () => {
      mockGetBanks.mockResolvedValue([onlineBank, offlineBank])
      const render = vi.fn()
      const req = {
        axios: {},
        body: { bankSelect: 'tampered-bank-value' },
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

    it('lets the error propagate when getBanks rejects on submission', async () => {
      mockGetBanks.mockRejectedValue(new Error('DynamoDB timeout'))
      const req = {
        axios: {},
        body: { bankSelect: 'test-online-bank' },
        session: {}
      } as unknown as Request
      const res = { redirect: vi.fn(), render: vi.fn() } as unknown as Response

      await expect(post(req, res)).rejects.toThrow('DynamoDB timeout')
    })
  })
})
