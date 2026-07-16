import type { Request, Response } from 'express'

import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { z } from 'zod'

import paths from '@src/config/paths'

const renderPage = (_req: Request, res: Response, context: Record<string, unknown> = {}) => {
  res.render('pages/failure-steps/bank-problem', {
    ...context
  })
}

const get = (req: Request, res: Response) => {
  renderPage(req, res)
}

const bankProblemSchema = () =>
  z.object({
    bankProblem: z.enum(['try-again', 'prove-another-way'], 'pages.bankProblem.radio.errorMessage')
  })

const post = (req: Request, res: Response) => {
  const result = bankProblemSchema().safeParse(req.body)
  if (!result.success) {
    renderPage(req, res, zodErrorsForView(result.error, res.locals.translate))
    return
  }
  if (result.data.bankProblem === 'try-again') {
    res.redirect(paths.steps.chooseBank)
  } else {
    res.redirect(paths.steps.proveAnotherWay)
  }
}

export { get, post }
