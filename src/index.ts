import { config as loadDotenv } from 'dotenv'

const { parsed } = loadDotenv({ quiet: true })

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
PLATFORM: ${process.platform}/${process.arch}
NODE_ENV: ${process.env.NODE_ENV}, ${process.version}
HOST/PORT: ${process.env.BIND_HOST ?? '127.0.0.1'}:${process.env.PORT ?? 3000}
.ENV: ${parsed ? `loaded (${Object.keys(parsed).length} vars)` : 'not found'}
==============================================`
console.log(banner)
const { createApp } = await import('./app-bootstrap')
const { app } = await createApp()

const host = process.env.BIND_HOST ?? '127.0.0.1'
const port = Number(process.env.PORT) || 3000
app.listen(port, host)
