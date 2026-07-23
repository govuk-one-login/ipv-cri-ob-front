import type { Express } from 'express'

import { GenericContainer, type StartedTestContainer } from 'testcontainers'
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import paths from '@src/config/paths'
import request from 'supertest'

describe('app-bootstrap', () => {
  let app: Express
  let dynamo: StartedTestContainer
  let mockAgent: MockAgent
  let originalDispatcher: ReturnType<typeof getGlobalDispatcher>

  beforeAll(async () => {
    originalDispatcher = getGlobalDispatcher()
    mockAgent = new MockAgent()
    setGlobalDispatcher(mockAgent)

    dynamo = await new GenericContainer('amazon/dynamodb-local')
      .withCommand(['-jar', 'DynamoDBLocal.jar', '-sharedDb', '-inMemory'])
      .withExposedPorts(8000)
      .start()

    process.env['LOCAL_DYNAMO_ENDPOINT_OVERRIDE'] = `http://localhost:${dynamo.getMappedPort(8000)}`

    const { createApp } = await import('@src/app-bootstrap')
    const created = await createApp()
    app = created.app
  }, 60_000)

  afterAll(async () => {
    await mockAgent.close()
    setGlobalDispatcher(originalDispatcher)
    await dynamo.stop()
  })

  it('starts with a valid config', async () => {
    const res = await request(app).get('/')

    expect(res.status).toBe(302)
    expect(res.headers['location']).toBe(paths.steps.start)
  })

  it('rejects a POST without a CSRF token', async () => {
    const testAgent = request.agent(app)

    const start = await testAgent.get(paths.steps.start)
    expect(start.status).toBe(200)

    const rejected = await testAgent.post(paths.steps.chooseBank)
    expect(rejected.status).toBe(403)
  })

  it('accepts a POST when a valid CSRF token is provided', async () => {
    const banksApi = mockAgent.get('http://api.ob.cri.gov.uk:1337')
    banksApi
      .intercept({ path: '/banks', method: 'GET' })
      .reply(200, [
        {
          bank_id: 'iron-bank',
          friendly_name: 'Iron Bank',
          is_sandbox: false,
          service_status: true
        }
      ])
      .times(2)

    const testAgent = request.agent(app)
    await testAgent.get(paths.steps.start)
    const chooseBankPage = await testAgent.get(paths.steps.chooseBank)
    expect(chooseBankPage.status).toBe(200)

    const tokenMatch = chooseBankPage.text.match(/name="_csrf" value="([^"]+)"/)
    const csrfToken = tokenMatch?.[1]
    expect(csrfToken).toBeDefined()

    const accepted = await testAgent
      .post(paths.steps.chooseBank)
      .type('form')
      .send({ _csrf: csrfToken, bankSelect: 'iron-bank' })

    expect(accepted.status).toBe(302)
    expect(accepted.headers['location']).toBe(paths.steps.consent)
  })

  it('sets a content-security-policy header via helmet', async () => {
    const res = await request(app).get(paths.steps.start)

    expect(res.status).toBe(200)
    expect(res.headers['content-security-policy']).toContain('default-src')
  })
})
