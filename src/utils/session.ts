import { appConfig } from '../config'
import { checkTableExists, dynamoDevOverrides } from './dev-tooling/local-dynamodb'
import { getLogger } from './logger'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

import connectDynamoDB from 'connect-dynamodb'
import session from 'express-session'

const DynamoDBStore = connectDynamoDB(session)
const LOGGER = getLogger()

const createSessionStore = async () => {
  const clientConfig = {
    region: 'eu-west-2',
    ...dynamoDevOverrides
  }
  const dynamodbClient = new DynamoDBClient(clientConfig)
  const table = appConfig.APP.SESSION.TABLE_NAME ?? 'ob-sessions-local'
  if ('endpoint' in clientConfig) {
    LOGGER.warn(`[local DynamoDB] endpoint override is set: ${dynamoDevOverrides.endpoint}`)

    await checkTableExists(dynamodbClient, table).catch((error) => {
      LOGGER.error('[local DynamoDB] problem creating table:', error)
    })
  }

  return new DynamoDBStore({
    client: dynamodbClient,
    table
  })
}

const initSessionStore = async () => {
  if (!appConfig.APP.SESSION.SECRET) {
    LOGGER.warn('SESSION_SECRET is not set, using default value')
  }

  if (!appConfig.APP.SESSION.TABLE_NAME) {
    LOGGER.warn('SESSION_TABLE_NAME is not set, using default value')
  }

  return {
    cookieName: appConfig.APP.SESSION.COOKIE_NAME,
    cookieOptions: { maxAge: appConfig.APP.SESSION.TTL },
    secret: appConfig.APP.SESSION.SECRET ?? 'hunter2', // pragma: allowlist secret
    sessionStore: await createSessionStore()
  }
}

export default initSessionStore
