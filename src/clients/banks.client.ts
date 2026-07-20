import type { Request } from 'express'

import { createBaseClient } from './base.client'
import { Bank, type BankData } from '@src/models/bank.class'

import appConfig from '@src/config/app'

const banksClient = (req: Request) => {
  const client = createBaseClient(req)
  return {
    getBanks: async (headers: Record<string, string> = {}): Promise<Bank[]> => {
      const res = await client.get(appConfig.API.PATHS.BANKS, headers)
      const data = (await res.json()) as BankData[]
      return data.map((entry) => Bank.fromData(entry))
    }
  }
}

export { banksClient }
