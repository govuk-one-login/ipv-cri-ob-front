import {
  BillingMode,
  CreateTableCommand,
  DescribeTableCommand,
  type DynamoDBClient,
  KeyType,
  ResourceInUseException,
  ResourceNotFoundException,
  ScalarAttributeType,
  waitUntilTableExists
} from '@aws-sdk/client-dynamodb'
import { getLogger } from '@src/utils/logger'

const dynamoDevOverrides = process.env['LOCAL_DYNAMO_ENDPOINT_OVERRIDE']
  ? {
      credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local' // pragma: allowlist secret
      },
      endpoint: process.env['LOCAL_DYNAMO_ENDPOINT_OVERRIDE']
    }
  : {}

const createTable = async (client: DynamoDBClient, tableName: string) => {
  const createTableParams = {
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: ScalarAttributeType.S
      }
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST,
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: KeyType.HASH
      }
    ],
    TableName: tableName
  }

  try {
    await client.send(new CreateTableCommand(createTableParams))
    getLogger().info(`[local DynamoDB] table '${tableName}' created successfully`)

    await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: tableName })
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      getLogger().info(`[local DynamoDB] table '${tableName}' already exists`)
    } else {
      getLogger().error(`[local DynamoDB] problem creating table '${tableName}':`, error)
      throw error
    }
  }
}

const checkTableExists = async (client: DynamoDBClient, tableName: string) => {
  getLogger().info(`[local DynamoDB] looking for existing table '${tableName}'`)
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    getLogger().info(`[local DynamoDB] table '${tableName}' exists`)
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      getLogger().info(`[local DynamoDB] table '${tableName}' not found, creating...`)
      await createTable(client, tableName)
    } else {
      throw error
    }
  }
  getLogger().info(`[local DynamoDB] table '${tableName}' ready`)
}

export { checkTableExists, dynamoDevOverrides }
