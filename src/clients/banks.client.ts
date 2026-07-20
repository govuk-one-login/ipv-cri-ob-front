import type { RawAxiosRequestHeaders } from 'axios'
import type { Request } from 'express'

import { createBaseClient } from './base.client'
import { Bank, type BankData } from '@src/models/bank.class'

import appConfig from '@src/config/app'

const banksClient = (req: Request) => {
  const client = createBaseClient(req)
  return {
    getBanks: async (headers: RawAxiosRequestHeaders = {}): Promise<Bank[]> => {
      const data = await client.get<BankData[]>(appConfig.API.PATHS.BANKS, headers)
      return data.map((data) => Bank.fromData(data))
    }
  }
}

export { banksClient }
