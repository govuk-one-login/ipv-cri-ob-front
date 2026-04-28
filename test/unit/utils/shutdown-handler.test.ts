import type { Server } from 'node:http'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockLogger = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn() }))

vi.mock('@src/utils/logger', () => ({
  getLogger: () => mockLogger
}))

const { registerShutdownHandler } = await import('@src/utils/shutdown-handler')

describe('registerShutdownHandler', () => {
  let server: { close: ReturnType<typeof vi.fn>; closeAllConnections: ReturnType<typeof vi.fn> }
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    server = { close: vi.fn(), closeAllConnections: vi.fn() }
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    vi.useFakeTimers() // avoids waiting the actual timeout
    registerShutdownHandler(server as unknown as Server)
  })

  afterEach(() => {
    process.removeAllListeners('SIGTERM')
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('calls server.close() on SIGTERM', () => {
    process.emit('SIGTERM')
    expect(server.close).toHaveBeenCalled()
  })

  it('does not call server.close() twice if SIGTERM fires multiple times', () => {
    process.emit('SIGTERM')
    process.emit('SIGTERM')
    expect(server.close).toHaveBeenCalledTimes(1)
  })

  it('force-closes all connections and exits after the shutdown timeout', () => {
    process.emit('SIGTERM')
    vi.runAllTimers()
    expect(server.closeAllConnections).toHaveBeenCalled()
    expect(exitSpy).toHaveBeenCalledWith(0)
  })

  it('exits with code 1 if server.close() errors', () => {
    server.close.mockImplementation((cb: (err: Error) => void) => cb(new Error('gremlins')))
    process.emit('SIGTERM')
    vi.runAllTimers()
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(mockLogger.error).toHaveBeenCalledWith('Error closing HTTP server:', 'gremlins')
  })

  it('logs that close was already called if SIGTERM fires multiple times', () => {
    server.close.mockImplementation((cb: () => void) => cb())
    process.emit('SIGTERM')
    process.emit('SIGTERM')
    expect(mockLogger.info).toHaveBeenCalledWith('SIGTERM received: closing HTTP server')
    expect(mockLogger.info).toHaveBeenCalledWith('SIGTERM received: close already called')
    expect(mockLogger.info).toHaveBeenCalledWith('HTTP server closed')
    expect(mockLogger.info).toHaveBeenCalledTimes(4)
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('exits with code 0 if server.close() succeeds', () => {
    server.close.mockImplementation((cb: () => void) => cb())
    process.emit('SIGTERM')
    vi.runAllTimers()
    expect(exitSpy).toHaveBeenCalledWith(0)
    expect(mockLogger.info).toHaveBeenCalledTimes(3)
    expect(mockLogger.error).not.toHaveBeenCalled()
  })
})
