declare module 'accessible-autocomplete' {
  interface AccessibleAutocomplete {
    (options: { element: HTMLElement; source: string[] } & AutocompleteOptions): void
    enhanceSelectElement: (options: EnhanceSelectElementOptions) => void
  }

  interface AutocompleteOptions {
    autoselect?: boolean
    confirmOnBlur?: boolean
    defaultValue?: string
    dropdownArrow?: (config: { className: string }) => string
    id?: string
    inputClasses?: null | string
    menuClasses?: null | string
    minLength?: number
    name?: string
    onConfirm?: (confirmed: string | undefined) => void
    placeholder?: string
    preserveNullOptions?: boolean
    required?: boolean
    showAllValues?: boolean
    showNoOptionsFound?: boolean
    tAssistiveHint?: () => string
    tNoResults?: () => string
    tStatusNoResults?: () => string
    tStatusQueryTooShort?: (minQueryLength: number) => string
    tStatusResults?: (length: number, contentSelectedOption: string) => string
    tStatusSelectedOption?: (selectedOption: string, length: number, index: number) => string
  }

  interface EnhanceSelectElementOptions extends AutocompleteOptions {
    selectElement: HTMLSelectElement
  }

  const accessibleAutocomplete: AccessibleAutocomplete
  export default accessibleAutocomplete
}
