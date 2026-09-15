import { Bank, type BankData } from '@src/models/bank.class'
import { describe, expect, it } from 'vitest'

const createBankFromData = (overrides: Partial<BankData>) => {
  return Bank.fromData({
    bankId: 'test-bank-1',
    friendlyName: 'Test Bank',
    serviceStatus: true,
    ...overrides
  })
}

describe('Bank', () => {
  describe('fromData', () => {
    it('creates a new bank class with expected properties', () => {
      const bank = createBankFromData({})

      expect(bank.bankID).toBe('test-bank-1')
      expect(bank.friendlyName).toBe('Test Bank')
    })

    it('sets status to Online when serviceStatus is true', () => {
      const bank = createBankFromData({
        serviceStatus: true
      })
      expect(bank.status).toBe('Online')
    })

    it('sets status to Offline when serviceStatus is false', () => {
      const bank = createBankFromData({
        serviceStatus: false
      })
      expect(bank.status).toBe('Offline')
    })
  })
})
