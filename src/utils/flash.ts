import type { Request } from 'express'

type FlashMessage = NonNullable<Request['session']['flash']>[number]

const addFlash = (req: Request, flash: FlashMessage): void => {
  ;(req.session.flash ??= []).push(flash)
}

export { addFlash }
