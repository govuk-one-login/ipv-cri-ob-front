import { afterEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

vi.mock('@src/utils/logger', () => ({
  getLogger: () => ({ warn: vi.fn() })
}))

describe('session', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('throws error when SESSION_SECRET is not set', async () => {
    vi.stubEnv('SESSION_SECRET', '')
    vi.resetModules()

    await expect(import('@src/utils/session')).rejects.toThrow(ZodError)
  })

  it('applies configured env vars to the session config', async () => {
    vi.stubEnv('SESSION_SECRET', 'test-secret-value') // pragma: allowlist secret
    vi.stubEnv('SESSION_TABLE_NAME', 'test-sessions-table')
    vi.stubEnv('SESSION_TTL', '3600000')
    vi.resetModules()

    const { default: initSessionStore } = await import('@src/utils/session')
    const config = await initSessionStore()

    expect(config.secret).toBe('test-secret-value')
    expect(config.cookieName).toBe('ob_session')
    expect(config.sessionStore).toHaveProperty('table', 'test-sessions-table')
    expect(config.cookieOptions).toEqual({ maxAge: 3600000 })
  })

  it('uses local dynamodb when endpoint override is set', async () => {
    const checkTableExists = vi.fn().mockResolvedValue(undefined)
    const DynamoDBClient = vi.fn()
    vi.doMock(import('@src/utils/dev-tooling/local-dynamodb'), async (importOriginal) => {
      const originalModule = await importOriginal()
      return {
        checkTableExists,
        dynamoDevOverrides: originalModule.dynamoDevOverrides
      }
    })
    vi.doMock(import('@aws-sdk/client-dynamodb'), () => ({ DynamoDBClient }))
    vi.stubEnv('LOCAL_DYNAMO_ENDPOINT_OVERRIDE', 'http://localdynamo:9999')
    vi.resetModules()

    const { default: initSessionStore } = await import('@src/utils/session')
    await initSessionStore()

    expect(DynamoDBClient).toHaveBeenCalledWith({
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' }, // pragma: allowlist secret
      endpoint: 'http://localdynamo:9999',
      region: 'eu-west-2'
    })
    expect(checkTableExists).toHaveBeenCalled()
  })

  it('does not use local dynamodb when no endpoint override is set', async () => {
    const checkTableExists = vi.fn()
    const DynamoDBClient = vi.fn()
    vi.doMock(import('@src/utils/dev-tooling/local-dynamodb'), async (importOriginal) => {
      const originalModule = await importOriginal()
      return {
        checkTableExists,
        dynamoDevOverrides: originalModule.dynamoDevOverrides
      }
    })
    vi.doMock('@aws-sdk/client-dynamodb', () => ({
      DynamoDBClient
    }))
    vi.stubEnv('LOCAL_DYNAMO_ENDPOINT_OVERRIDE', undefined)
    vi.resetModules()

    const { default: initSessionStore } = await import('@src/utils/session')
    await initSessionStore()

    expect(DynamoDBClient).toHaveBeenCalledWith({ region: 'eu-west-2' })
    expect(checkTableExists).not.toHaveBeenCalled()
  })
})
