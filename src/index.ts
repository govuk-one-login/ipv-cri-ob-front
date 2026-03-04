import { config as loadDotenv } from 'dotenv'

const { parsed } = loadDotenv({ quiet: true })
const { arch, env, platform, version } = process
const BIND_HOST = env.BIND_HOST || '127.0.0.1'
const PORT = env.PORT || '3000'

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
NODE_ENV: ${env.NODE_ENV}, ${version}
HOST/PORT: ${BIND_HOST}:${PORT}
.ENV: ${parsed ? `loaded (${Object.keys(parsed).length} vars)` : 'not found'}
==============================================`
console.log(banner)
const { createApp } = await import('./app-bootstrap')
const { app } = await createApp()

app.listen(Number(PORT), BIND_HOST)
