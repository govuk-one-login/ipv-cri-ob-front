import type { Server } from 'node:http'

import { getLogger } from './logger'

const SHUTDOWN_TIMEOUT = 30_000

export const registerShutdownHandler = (server: Server) => {
  const LOGGER = getLogger()
  let serverAlreadyExiting = false
  let exitCode = 0

  process.on('SIGTERM', () => {
    if (serverAlreadyExiting) {
      LOGGER.info('SIGTERM received: close already called')
      return
    }
    serverAlreadyExiting = true

    LOGGER.info('SIGTERM received: closing HTTP server')

    server.close((err) => {
      if (err) {
        LOGGER.error('Error closing HTTP server:', err.message)
        exitCode = 1
      } else {
        LOGGER.info('HTTP server closed')
      }
    })

    setTimeout(() => {
      server.closeAllConnections()
      process.exit(exitCode)
    }, SHUTDOWN_TIMEOUT)
  })
}
