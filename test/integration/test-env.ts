import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import nock from 'nock'

// prevent local .envs from leaking into tests
vi.mock('dotenv', () => ({ config: vi.fn(), parsed: [] }))

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect((host) => host.startsWith('127.0.0.1') || host.startsWith('localhost'))
})

afterEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.enableNetConnect()
})
