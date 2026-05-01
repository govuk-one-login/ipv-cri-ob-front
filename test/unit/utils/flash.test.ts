import type { Request } from 'express'

import { addFlash } from '@src/utils/flash'
import { describe, expect, it } from 'vitest'

describe('addFlash', () => {
  it('adds a flash message to the session', () => {
    const req = { session: {} } as unknown as Request

    addFlash(req, { message: { header: 'Success' }, type: 'success' })

    expect(req.session.flash).toEqual([{ message: { header: 'Success' }, type: 'success' }])
  })

  it('appends to existing flash messages', () => {
    const req = {
      session: { flash: [{ message: { header: 'First' }, type: 'info' }] }
    } as unknown as Request

    addFlash(req, { message: { header: 'Second' }, type: 'error' })

    expect(req.session.flash).toHaveLength(2)
    expect(req.session.flash![1]).toEqual({ message: { header: 'Second' }, type: 'error' })
  })
})
