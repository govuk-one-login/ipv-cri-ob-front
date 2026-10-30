import appConfig from '@src/config/app'
import { createApp } from '@src/app-bootstrap'
import { registerShutdownHandler } from '@src/utils/shutdown-handler'

const { arch, platform, version } = process
const BIND_HOST = appConfig.APP.BIND_HOST
const PORT = appConfig.APP.PORT

const banner = String.raw`
  ________  ____  __   ______  _______
 / ___/ _ \/  _/ / /  /  _/  |/  / __/
/ /__/ , _// /  / /___/ // /|_/ / _/
\___/_/|_/___/_/____/___/_/  /_/___/  ____ _______  _______
 / __ \/ _ \/ __/ |/ / / _ )/ _ | / |/ / //_/  _/ |/ / ___/
/ /_/ / ___/ _//    / / _  / __ |/    / ,< _/ //    / (_ /
\____/_/  /___/_/|_/ /____/_/ |_/_/|_/_/|_/___/_/|_/\___/

================ START =======================
PLATFORM: ${platform}/${arch}
NODE_ENV: ${appConfig.APP.NODE_ENV}, ${version}
DEPLOYMENT_ENV: ${appConfig.APP.DEPLOYMENT_ENV}
HOST/PORT: ${BIND_HOST}:${PORT}
==============================================`
console.log(banner)

const { app } = await createApp()

const server = app.listen(PORT, BIND_HOST)
server.keepAliveTimeout = 65_000
registerShutdownHandler(server)
