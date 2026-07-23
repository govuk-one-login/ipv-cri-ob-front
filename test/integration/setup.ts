import { vi } from 'vitest'

// prevent local .envs from leaking into tests
vi.mock('dotenv', () => ({ config: vi.fn(), parsed: [] }))
