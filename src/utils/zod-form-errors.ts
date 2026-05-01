/**
 * converts zod errors into govuk ds compatible error objects for use in nunjucks views
 * zod error messages are i18n keys and passed through `translate`
 * input field names are assumed to be camelCase, hrefs are converted to kebab-case
 *
 * @param error - ZodError from a failed `safeParse`
 * @param translate - i18n translate function, called with each Zod issue message as the key
 * @returns
 *   - `errorList` — usage `govukErrorSummary({ errorList: errorList })`
 *   - `formErrors` — keyed by field name (camelCase); usage in macros: `errorMessage: { text: formErrors["fieldName"] } if formErrors["fieldName"] else false`
 */

import type { ZodError } from 'zod'

const toKebabCase = (str: string) => str.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`)

export const zodErrorsForView = (error: ZodError, translate: (key: string) => string) => ({
  errorList: error.issues.map(({ message, path }) => ({
    href: `#${toKebabCase(String(path[0]))}`,
    text: translate(message)
  })),
  formErrors: Object.fromEntries(
    error.issues.map(({ message, path }) => [String(path[0]), translate(message)])
  ) as Record<string, string>
})
