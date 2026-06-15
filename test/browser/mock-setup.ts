import { APP_URL } from './playwright.mock.config'
import { spawn } from 'child_process'
import { existsSync } from 'node:fs'
import { GenericContainer, Wait } from 'testcontainers'

import path from 'node:path'
import PinoPretty from 'pino-pretty'

// give app 30 seconds to boot with more robust checking
const appReady = async (exited: { value: boolean }, attempts = 60) => {
  for (let i = 0; i < attempts; i++) {
    if (exited.value) throw new Error('app process exited before becoming ready')

    try {
      // Check both root endpoint and a simple health endpoint
      const response = await fetch(APP_URL.origin, {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok || response.status === 302) {
        // Additional check to ensure the app is fully responsive
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
      }
    } catch {
      // Network errors are expected while app is starting
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('app failed to start within timeout period')
}

const initWiremockContainer = async () => {
  console.log('[SYSTEM] starting Wiremock container...')
  const wiremockContainer = await new GenericContainer('wiremock/wiremock:3.13.1')
    .withCommand(['--local-response-templating'])
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHttp('/__admin/mappings', 8080).forStatusCode(200))
    .withStartupTimeout(60_000) // 60 second timeout
    .withCopyDirectoriesToContainer([
      {
        source: path.resolve(import.meta.dirname, 'wiremock/mappings'),
        target: '/home/wiremock/mappings'
      }
    ])
    .start()

  const wiremockEndpoint = `http://localhost:${wiremockContainer.getMappedPort(8080)}`

  // Verify wiremock is actually responding
  let retries = 10
  while (retries > 0) {
    try {
      const response = await fetch(`${wiremockEndpoint}/__admin/mappings`)
      if (response.ok) break
    } catch {
      // Expected while service is starting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
    retries--
  }

  if (retries === 0) {
    throw new Error('Wiremock failed to become responsive')
  }

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
  findAvailableDockerSockets()

  const [{ dynamoContainer, dynamoEndpoint }, { wiremockContainer, wiremockEndpoint }] =
    await Promise.all([initDynamoContainer(), initWiremockContainer()])

  process.env['WIREMOCK_URL'] = wiremockEndpoint // used by browser tests, not app

  console.log('[SYSTEM] starting app...')
  const appProcess = spawn('node', ['dist/index.js'], {
    env: {
      ...process.env,
      API_BASE_URL: `${wiremockEndpoint}/`,
      DEPLOYMENT_ENV: 'local',
      LOCAL_DYNAMO_ENDPOINT_OVERRIDE: dynamoEndpoint,
      LOG_LEVEL: 'debug',
      NODE_ENV: 'test',
      PORT: APP_URL.port,
      SESSION_SECRET: 'hunter2', // pragma: allowlist secret
      CSRF_SECRET: 'Tr0ub4dor&3', // pragma: allowlist secret
      STUBS_ENABLED: 'true',
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
