import { APP_URL } from '../../playwright.config'
import { spawn } from 'child_process'
import { existsSync } from 'node:fs'
import { GenericContainer, Wait } from 'testcontainers'

import path from 'node:path'
import PinoPretty from 'pino-pretty'

// give app 20 seconds to boot
const appReady = async (exited: { value: boolean }, attempts = 40) => {
  for (let i = 0; i < attempts; i++) {
    if (exited.value) throw new Error('app process exited before becoming ready')
    if (
      await fetch(APP_URL.origin)
        .then(() => true)
        .catch(() => false)
    )
      return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('app failed to start')
}

const initWiremockContainer = async () => {
  console.log('[SYSTEM] starting Wiremock container...')
  const wiremockContainer = await new GenericContainer('wiremock/wiremock:3.13.1')
    .withCommand(['--local-response-templating'])
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHttp('/__admin/mappings', 8080))
    .withCopyDirectoriesToContainer([
      {
        source: path.resolve(import.meta.dirname, 'wiremock/mappings'),
        target: '/home/wiremock/mappings'
      }
    ])
    .start()
  const wiremockEndpoint = `http://localhost:${wiremockContainer.getMappedPort(8080)}`
  console.log(`[SYSTEM] Wiremock ready at ${wiremockEndpoint}`)
  return { wiremockContainer, wiremockEndpoint }
}

const initDynamoContainer = async () => {
  console.log('[SYSTEM] starting DynamoDB container...')
  const dynamoContainer = await new GenericContainer('amazon/dynamodb-local')
    .withCommand(['-jar', 'DynamoDBLocal.jar', '-sharedDb', '-inMemory'])
    .withExposedPorts(8000)
    .start()

  const dynamoEndpoint = `http://localhost:${dynamoContainer.getMappedPort(8000)}`
  console.log(`[SYSTEM] DynamoDB ready at ${dynamoEndpoint}`)
  return { dynamoContainer, dynamoEndpoint }
}

const findAvailableDockerSockets = () => {
  if (!process.env['DOCKER_HOST']) {
    const dockerSockets = [
      '/var/run/docker.sock',
      `${process.env['HOME']}/.orbstack/run/docker.sock`,
      `${process.env['HOME']}/.colima/default/docker.sock`,
      `${process.env['HOME']}/.docker/run/docker.sock`
    ]

    const socket = dockerSockets.find(existsSync)
    if (!socket) throw new Error('no socket found, is Docker running on your system?')
    process.env['DOCKER_HOST'] = `unix://${socket}`
    console.log(`[SYSTEM] using Docker socket: ${socket}`)
  }
}

export default async function mockSetup() {
  if (process.env['APP_URL']) return
  findAvailableDockerSockets()

  const [{ dynamoContainer, dynamoEndpoint }, { wiremockContainer, wiremockEndpoint }] =
    await Promise.all([initDynamoContainer(), initWiremockContainer()])

  process.env['WIREMOCK_URL'] = wiremockEndpoint // used by browser tests, not app

  console.log('[SYSTEM] starting app...')
  const appProcess = spawn('node', ['dist/index.js'], {
    env: {
      ...process.env,
      API_BASE_URL: `${wiremockEndpoint}/`,
      LOCAL_DYNAMO_ENDPOINT_OVERRIDE: dynamoEndpoint,
      LOG_LEVEL: 'debug',
      NODE_ENV: 'test',
      PORT: APP_URL.port,
      SESSION_SECRET: 'hunter2', // pragma: allowlist secret
      USE_PINO_LOGGER: 'true'
    }
  })

  const exited = { value: false }
  const prettyStream = PinoPretty({ messageKey: 'message' })
  appProcess.stdout?.pipe(prettyStream)
  appProcess.stderr?.on('data', (d: Buffer) => process.stderr.write(d.toString()))
  appProcess.on('exit', (code) => {
    exited.value = true
    if (code !== 0) console.error(`[SYSTEM] app process terminated`)
  })

  console.log('[SYSTEM] waiting for app to be ready...')
  await appReady(exited)
  console.log('[SYSTEM] app ready')

  process.on('exit', () => appProcess.kill('SIGTERM'))

  return async () => {
    appProcess.kill('SIGTERM')
    await Promise.all([dynamoContainer.stop(), wiremockContainer.stop()])
  }
}
