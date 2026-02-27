import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { GenericContainer } from 'testcontainers'

const APP_URL = 'http://localhost:3001'

// give app 20 seconds to boot
const waitForApp = async (exited: { value: boolean }, attempts = 40) => {
  for (let i = 0; i < attempts; i++) {
    if (exited.value) throw new Error('App process exited before becoming ready')
    if (
      await fetch(APP_URL)
        .then(() => true)
        .catch(() => false)
    )
      return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('App failed to start')
}

export default async function globalSetup() {
  if (!process.env.DOCKER_HOST) {
    const dockerSockets = [
      '/var/run/docker.sock',
      `${process.env.HOME}/.orbstack/run/docker.sock`,
      `${process.env.HOME}/.docker/run/docker.sock`
    ]

    for (const socket of dockerSockets) {
      if (existsSync(socket)) {
        process.env.DOCKER_HOST = `unix://${socket}`
        console.log(`[SYSTEM] using Docker socket: ${socket}`)
        break
      }
    }
  }

  console.log('[SYSTEM] starting DynamoDB container...')
  const dynamoContainer = await new GenericContainer('amazon/dynamodb-local')
    .withCommand(['-jar', 'DynamoDBLocal.jar', '-sharedDb', '-inMemory'])
    .withExposedPorts(8000)
    .start()

  const dynamoEndpoint = `http://localhost:${dynamoContainer.getMappedPort(8000)}`
  console.log(`[SYSTEM] DynamoDB ready at ${dynamoEndpoint}`)

  // TODO wiremock init

  console.log('[SYSTEM] starting app...')
  const appProcess = spawn('node', ['dist/index.js'], {
    env: {
      ...process.env,
      LOCAL_DYNAMO_ENDPOINT_OVERRIDE: dynamoEndpoint,
      NODE_ENV: 'test',
      PORT: '3001',
      USE_PINO_LOGGER: 'true'
    }
  })

  const exited = { value: false }
  appProcess.stdout?.on('data', (d: Buffer) => process.stdout.write(`[APP] ${d.toString()}`))
  appProcess.stderr?.on('data', (d: Buffer) => process.stderr.write(`[APP] ${d.toString()}`))
  appProcess.on('exit', (code) => {
    exited.value = true
    if (code !== 0) console.error(`[SYSTEM] app process exited with code ${code}`)
  })

  console.log('[SYSTEM] waiting for app to be ready...')
  await waitForApp(exited)
  console.log('[SYSTEM] app ready')

  return async () => {
    appProcess.kill('SIGTERM')
    await dynamoContainer.stop()
  }
}
