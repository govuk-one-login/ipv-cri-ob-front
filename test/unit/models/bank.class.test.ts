import { Bank } from '@src/models/bank.class'
import { describe, expect, it } from 'vitest'

describe('Bank', () => {
  describe('fromData', () => {
    it('maps snake_case data to camelCase properties', () => {
      const bank = Bank.fromData({
        bank_id: 'test-bank-1',
        friendly_name: 'Test Bank',
        is_sandbox: false,
        service_status: true
      })

      expect(bank.bankID).toBe('test-bank-1')
      expect(bank.friendlyName).toBe('Test Bank')
      expect(bank.sandbox).toBe(false)
    })

    it('sets status to Online when service_status is true', () => {
      const bank = Bank.fromData({
        bank_id: 'b',
        friendly_name: 'B',
        is_sandbox: false,
        service_status: true
      })
      expect(bank.status).toBe('Online')
    })

    it('sets status to Offline when service_status is false', () => {
      const bank = Bank.fromData({
        bank_id: 'b',
        friendly_name: 'B',
        is_sandbox: false,
        service_status: false
      })
      expect(bank.status).toBe('Offline')
    })
  })
})
