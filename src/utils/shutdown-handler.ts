import type { Server } from 'node:http'

import { getLogger } from '@src/utils/logger'

import appConfig from '@src/config/app'

const SHUTDOWN_TIMEOUT = 30_000

export const registerShutdownHandler = (server: Server) => {
  let serverAlreadyExiting = false
  let exitCode = 0

  if (appConfig.APP.NODE_ENV !== 'development') {
    process.on('SIGTERM', () => {
      if (serverAlreadyExiting) {
        getLogger().info('SIGTERM received: close already called')
        return
      }
      serverAlreadyExiting = true

      getLogger().info('SIGTERM received: closing HTTP server')

      server.close((err) => {
        if (err) {
          getLogger().error('Error closing HTTP server:', err.message)
          exitCode = 1
        } else {
          getLogger().info('HTTP server closed')
        }
      })

      setTimeout(() => {
        server.closeAllConnections()
        process.exit(exitCode)
      }, SHUTDOWN_TIMEOUT)
    })
    getLogger().info('shutdown handler registered')
  }
}
