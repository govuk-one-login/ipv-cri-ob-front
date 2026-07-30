import { GenericContainer, type StartedTestContainer } from 'testcontainers'

let dynamo: StartedTestContainer

export async function setup() {
  dynamo = await new GenericContainer('amazon/dynamodb-local')
    .withCommand(['-jar', 'DynamoDBLocal.jar', '-sharedDb', '-inMemory'])
    .withExposedPorts(8000)
    .start()

  process.env['LOCAL_DYNAMO_ENDPOINT_OVERRIDE'] = `http://localhost:${dynamo.getMappedPort(8000)}`
}

export async function teardown() {
  await dynamo?.stop()
}
