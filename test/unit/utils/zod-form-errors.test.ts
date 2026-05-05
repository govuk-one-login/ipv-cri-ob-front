import { zodErrorsForView } from '@src/utils/zod-form-errors'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const translate = (key: string) => `translated:${key}`

describe('zodErrorsForView', () => {
  it('builds errorList with kebab-case hrefs and translated messages', () => {
    const result = z.object({ myField: z.string().min(1, 'error.key') }).safeParse({ myField: '' })
    const { errorList } = zodErrorsForView(result.error!, translate)

    expect(errorList).toEqual([{ href: '#my-field', text: 'translated:error.key' }])
  })

  it('builds formErrors keyed by camelCase field name with translated messages', () => {
    const result = z.object({ myField: z.string().min(1, 'error.key') }).safeParse({ myField: '' })
    const { formErrors } = zodErrorsForView(result.error!, translate)

    expect(formErrors).toEqual({ myField: 'translated:error.key' })
  })

  it('handles multiple field errors', () => {
    const schema = z.object({
      fieldOne: z.string().min(1, 'error.one'),
      fieldTwo: z.string().min(1, 'error.two')
    })
    const result = schema.safeParse({ fieldOne: '', fieldTwo: '' })
    const { errorList, formErrors } = zodErrorsForView(result.error!, translate)

    expect(errorList).toHaveLength(2)
    expect(formErrors['fieldOne']).toBe('translated:error.one')
    expect(formErrors['fieldTwo']).toBe('translated:error.two')
  })
})
