import { test } from '../fixtures'
import { wiremock } from '../wiremock'

export const useJourneySetup = () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async () => {
    await wiremock.resetScenarios()
    await wiremock.resetRequests()
  })
}
