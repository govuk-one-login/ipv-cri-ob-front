import { initialiseProgressButtons } from '@govuk-one-login/frontend-ui/frontend'
import { initAll } from 'govuk-frontend'

// @ts-expect-error vite entry point
import '../scss/application.scss'

initAll()
initialiseProgressButtons()
