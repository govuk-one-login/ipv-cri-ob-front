import type { Express } from 'express'

import { beforeAll, describe, expect, it } from 'vitest'

import paths from '@src/config/paths'
import nock from 'nock'
import request from 'supertest'

describe('open banking front', () => {
  let app: Express

  beforeAll(async () => {
    const { createApp } = await import('@src/app-bootstrap')
    const created = await createApp()
    app = created.app
  }, 30_000)

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
    nock('http://api.ob.cri.gov.uk:1337')
      .get('/banks')
      .times(2)
      .reply(200, [
        {
          bank_id: 'iron-bank',
          friendly_name: 'Iron Bank',
          is_sandbox: false,
          service_status: true
        }
      ])

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

  it('sets required headers', async () => {
    const res = await request(app).get(paths.steps.start)

    expect(res.status).toBe(200)
    expect(res.headers['content-security-policy']).toContain('default-src')
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})
