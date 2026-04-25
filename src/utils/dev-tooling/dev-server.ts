import type { Express } from 'express'
import type { i18n } from 'i18next'
import type { ViteDevServer } from 'vite'

import { getLogger } from '@src/utils/logger'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const i18next = require('i18next') as i18n

const LOGGER = getLogger()

const createViteServer = async (): Promise<ViteDevServer> => {
  const { createServer } = await import('vite')
  return createServer({
    appType: 'custom',
    server: {
      middlewareMode: true,
      watch: { ignored: ['**/.github/**', '**/deploy/**'] }
    }
  })
}

const setupDevServer = (app: Express, vite: ViteDevServer): void => {
  const sessionId = crypto.randomUUID()

  app.locals['devServer'] = true

  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
    res.json({
      workspace: {
        root: process.env['PROJECT_DIR'],
        uuid: sessionId
      }
    })
  })

  app.use(vite.middlewares)
  LOGGER.info(`[vite] local dev middlewares loaded`)

  vite.watcher.add('src/**/*.{njk,yml,json}')
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  vite.watcher.on('change', async (file) => {
    if (file.endsWith('.yml') && i18next.isInitialized) {
      await i18next.reloadResources(['en', 'cy'])
    }
    if (file.endsWith('.njk') || file.endsWith('.yml') || file.endsWith('.json')) {
      LOGGER.debug(`[vite] reloading: ${file}`)
      vite.hot.send({ path: '*', type: 'full-reload' })
    }
  })
}

export { createViteServer, setupDevServer }
