import type { Request, Response } from 'express'

import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { z } from 'zod'

import paths from '@src/config/paths'

const chooseBankSchema = (banks: { value: string }[]) =>
  z.object({
    bankSelect: z
      .string()
      .refine((val) => banks.some((b) => b.value === val), 'pages.bankSelect.errorMessage')
  })

const FAKE_BANKS = [
  { text: 'Vault of Ironforge', value: 'ironforge-vault' },
  { text: 'Orgrimmar Counting House', value: 'org-counting-house' },
  { text: 'Royal Bank of Stormwind', value: 'royal-bank-sw' },
  { text: 'Stranglethorn Trust Bank', value: 'stranglethorn-trust-bank' },
  { text: 'Dalaran Merchant Bank', value: 'dalaran-merchant-bank' },
  { text: 'First Bank of Kezan', value: 'first-bank-kezan' }
]

const renderPage = (res: Response, context: Record<string, unknown> = {}) =>
  res.render('pages/steps/bank-select', {
    backLink: paths.steps.start,
    banksList: [...[{ selected: true, text: '', value: '' }], ...FAKE_BANKS], // TODO: use the real banks list provided by the API
    ...context
  })

const get = (_req: Request, res: Response) => renderPage(res)

const post = (req: Request, res: Response) => {
  const result = chooseBankSchema(FAKE_BANKS).safeParse(req.body) // TODO: use the real banks list provided by the API
  if (!result.success) return renderPage(res, zodErrorsForView(result.error, res.locals.translate))
  const { bankSelect } = result.data
  req.session.bankID = bankSelect
  req.session.bankName = FAKE_BANKS.find((b) => b.value === bankSelect)!.text
  return res.redirect(paths.steps.consent)
}

export { get, post }
