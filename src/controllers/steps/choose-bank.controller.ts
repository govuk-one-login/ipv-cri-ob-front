import type { Bank } from '@src/models/bank.class'
import type { Request, Response } from 'express'

import { banksClient } from '@src/clients/banks.client'
import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { z } from 'zod'

import paths from '@src/config/paths'

const transformBanksForView = (banks: Bank[]) => {
  return banks.map((bank) => ({ text: bank.friendlyName, value: bank.bankID }))
}

const renderPage = (
  res: Response,
  banksList: { text: string; value: string }[],
  context: Record<string, unknown> = {}
) =>
  res.render('pages/steps/choose-bank', {
    banksList: [{ selected: true, text: '', value: '' }, ...banksList],
    ...context
  })

const get = async (req: Request, res: Response) => {
  const banksList = await banksClient(req.axios).getBanks()
  renderPage(res, transformBanksForView(banksList))
}

const chooseBankSchema = (banksList: Bank[]) =>
  z.object({
    bankSelect: z
      .string()
      .refine(
        (val) => banksList.some((bank) => bank.bankID === val),
        'pages.chooseBank.errorMessage'
      )
  })

const post = async (req: Request, res: Response) => {
  const banksList = await banksClient(req.axios).getBanks()
  const result = chooseBankSchema(banksList).safeParse(req.body)
  if (!result.success) {
    renderPage(
      res,
      transformBanksForView(banksList),
      zodErrorsForView(result.error, res.locals.translate)
    )
    return
  }
  const { bankSelect } = result.data
  req.session.bankID = bankSelect
  req.session.bankName = banksList.find((b) => b.bankID === bankSelect)!.friendlyName
  res.redirect(paths.steps.consent)
}

export { get, post }
