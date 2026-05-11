import type { AxiosInstance } from 'axios'

import { createBaseClient } from './base.client'
import { Bank, type BankData } from '@src/models/bank.class'

const DUMMY_BANKS_RESPONSE: BankData[] = [
  {
    bank_id: 'ironforge-vault',
    friendly_name: 'Vault of Ironforge',
    is_sandbox: false,
    service_status: true
  },
  {
    bank_id: 'org-counting-house',
    friendly_name: 'Orgrimmar Counting House',
    is_sandbox: false,
    service_status: true
  },
  {
    bank_id: 'royal-bank-sw',
    friendly_name: 'Royal Bank of Stormwind',
    is_sandbox: false,
    service_status: true
  },
  {
    bank_id: 'stranglethorn-trust-bank',
    friendly_name: 'Stranglethorn Trust Bank',
    is_sandbox: false,
    service_status: true
  },
  {
    bank_id: 'dalaran-merchant-bank',
    friendly_name: 'Dalaran Merchant Bank',
    is_sandbox: false,
    service_status: true
  },
  {
    bank_id: 'first-bank-kezan',
    friendly_name: 'First Bank of Kezan',
    is_sandbox: false,
    service_status: true
  }
]

const banksClient = (axios: AxiosInstance) => {
  const client = createBaseClient(axios)
  return {
    getBanks: (): Promise<Bank[]> =>
      // client.get<BankData[]>(appConfig.API.PATHS.BANKS) TODO: use the banks api instead of returning dummy data
      client.stub<Bank[]>(DUMMY_BANKS_RESPONSE.map((bankData) => Bank.fromData(bankData)))
  }
}

export { banksClient }
