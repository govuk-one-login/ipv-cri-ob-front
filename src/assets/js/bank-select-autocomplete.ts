import accessibleAutocomplete from 'accessible-autocomplete'

const interpolate = (template: string, values: Record<string, number | string>) =>
  template.replace(/%(\w+)%/g, (placeholder, key: string) => String(values[key] ?? placeholder))

const chevronDown = ({ className }: { className: string }) =>
  `<svg class="${className}" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path d="M256,298.3L256,298.3L256,298.3l174.2-167.2c4.3-4.2,11.4-4.1,15.8,0.2l30.6,29.9c4.4,4.3,4.5,11.3,0.2,15.5L264.1,380.9c-2.2,2.2-5.2,3.2-8.1,3c-3,0.1-5.9-0.9-8.1-3L35.2,176.7c-4.3-4.2-4.2-11.2,0.2-15.5L66,131.3c4.4-4.3,11.5-4.4,15.8-0.2L256,298.3z"/></svg>`

const clearSelectWhenInputEmptied = (input: HTMLInputElement, select: HTMLSelectElement) => {
  input.addEventListener('input', () => {
    if (input.value.trim() === '') select.value = ''
  })
}

const returnFocusToInputOnEscape = (input: HTMLInputElement) => {
  input.parentElement?.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && document.activeElement !== input) input.focus()
    },
    { capture: true }
  )
}

export const initialiseBankSelectAutocomplete = () => {
  const select = document.querySelector('select[data-module="bank-autocomplete"]')
  if (!(select instanceof HTMLSelectElement)) return

  const translation = (key: string) => select.dataset[key] ?? ''
  const inputId = select.id
  const hasError = select.classList.contains('govuk-select--error')

  accessibleAutocomplete.enhanceSelectElement({
    autoselect: false,
    defaultValue: '',
    dropdownArrow: chevronDown,
    inputClasses: hasError ? 'govuk-input--error' : null,
    selectElement: select,
    showAllValues: true,
    tAssistiveHint: () => translation('i18nAssistiveHint'),
    tNoResults: () => translation('i18nNoResults'),
    tStatusNoResults: () => translation('i18nStatusNoResults'),
    tStatusResults: (length, contentSelectedOption) => {
      const key = length === 1 ? 'i18nStatusResultsOne' : 'i18nStatusResultsOther'
      return `${interpolate(translation(key), { count: length })} ${contentSelectedOption}`
    },
    tStatusSelectedOption: (selectedOption, length, index) =>
      interpolate(translation('i18nStatusSelectedOption'), {
        option: selectedOption,
        position: index + 1,
        total: length
      })
  })

  const input = document.getElementById(inputId)
  if (!(input instanceof HTMLInputElement)) return

  input.spellcheck = false
  clearSelectWhenInputEmptied(input, select)
  returnFocusToInputOnEscape(input)
}
