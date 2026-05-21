import type { Express } from 'express'
import type { ViteDevServer } from 'vite'

import { LOGGER } from '@src/utils/logger'

import commonExpress from '@govuk-one-login/di-ipv-cri-common-express'

const createViteServer = async (): Promise<ViteDevServer> => {
  const { createServer } = await import('vite')
  return createServer({
    appType: 'custom',
    server: {
      middlewareMode: true,
      watch: {
        ignored: ['**/.github/**', '**/deploy/**', '**/playwright-report/**', '**/coverage/**']
      }
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
    if (file.endsWith('.yml') && commonExpress.lib.i18n.i18next.isInitialized) {
      await commonExpress.lib.i18n.i18next.reloadResources(['en', 'cy'])
    }
    if (file.endsWith('.njk') || file.endsWith('.yml') || file.endsWith('.json')) {
      LOGGER.debug(`[vite] reloading: ${file}`)
      vite.hot.send({ path: '*', type: 'full-reload' })
    }
  })
}

export { createViteServer, setupDevServer }
