// appConfig must be first: its module body calls loadDotenv(), which must run before common-express libs are evaluated
import appConfig from '@src/config/app'

import { registerShutdownHandler } from '@src/utils/shutdown-handler'
import { config as loadDotenv } from 'dotenv'

const { parsed } = loadDotenv({ quiet: true })
const { arch, platform, version } = process
const BIND_HOST = appConfig.APP.BIND_HOST
const PORT = appConfig.APP.PORT

const banner = `
    ________ _    __  __________  ____  ____
   /  _/ __ \\ |  / / / ____/ __ \\/  _/ / __ \\____  ___  ____
   / // /_/ / | / / / /   / /_/ // /  / / / / __ \\/ _ \\/ __ \\
 _/ // ____/| |/ / / /___/ _, _// /  / /_/ / /_/ /  __/ / / /
/___/_/_    |___/  \\____/_/_|_/___/  \\____/ .___/\\___/_/_/_/
   / __ )____ _____  / /__(_)___  ____ _ /_// ____/ ____/
  / __  / __ \`/ __ \\/ //_/ / __ \\/ __ \`/   / /_  / __/
 / /_/ / /_/ / / / / ,< / / / / / /_/ /   / __/ / /___
/_____/\\__,_/_/ /_/_/|_/_/_/ /_/\\__, /   /_/   /_____/
                               /____/
================ START =======================
PLATFORM: ${platform}/${arch}
NODE_ENV: ${appConfig.APP.NODE_ENV}, ${version}
HOST/PORT: ${BIND_HOST}:${PORT}
.ENV: ${parsed ? `loaded (${Object.keys(parsed).length} vars)` : 'not found'}
==============================================`
// eslint-disable-next-line no-console
console.log(banner)

const { createApp } = await import('./app-bootstrap')
const { app } = await createApp()

const server = app.listen(PORT, BIND_HOST)
server.keepAliveTimeout = 65_000
registerShutdownHandler(server)
