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
    bankNotListedLink: paths.steps.proveAnotherWay,
    ...context
  })

const get = async (req: Request, res: Response) => {
  const banksList = await banksClient(req.axios).getBanks()
  // This also covers empty banksList
  if (banksList.every((b) => b.status === 'Offline')) {
    res.redirect(paths.steps.proveAnotherWay)
    return
  }
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
  // Second getBanks handles race condition where selected bank has changed status or been removed between page load and submission
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
  const selectedBank = banksList.find((b) => b.bankID === bankSelect)!

  req.session.bankID = bankSelect
  req.session.bankName = selectedBank.friendlyName

  if (selectedBank.status === 'Offline') {
    res.redirect(paths.failureSteps.bankUnavailable)
    return
  }
  res.redirect(paths.steps.consent)
}

export { get, post }
