import { spawnSync } from 'child_process'
import { defineConfig, type Plugin } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import path from 'path'

const serverBuild = (): Plugin => ({
  apply: 'build',
  name: 'server-build',
  async writeBundle() {
    const { build } = await import('vite')
    await build({
      build: {
        emptyOutDir: false,
        minify: false,
        outDir: 'dist',
        rolldownOptions: {
          external: [/\.node$/],
          output: { codeSplitting: false, entryFileNames: '[name].js', format: 'esm' }
        },
        sourcemap: true,
        ssr: 'src/index.ts'
      },
      configFile: false,
      resolve: {
        alias: {
          '@govuk-one-login/frontend-language-toggle/styles': path.resolve(
            __dirname,
            'node_modules/@govuk-one-login/frontend-language-toggle/build/stylesheet/styles.css'
          ),
          '@src': path.resolve(__dirname, 'src')
        }
      }
    })
  }
})

const dockerCompose = (): Plugin => {
  return {
    apply: 'serve',
    configureServer() {
      const { stdout } = spawnSync('docker', [
        'compose',
        'ps',
        '-q',
        '--status',
        'running',
        'dynamodb-local'
      ])
      if (!stdout?.toString().trim()) {
        spawnSync('docker', ['compose', 'up', '-d', '--wait'], { stdio: 'inherit' })
      }
    },
    name: 'docker-compose'
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    rolldownOptions: {
      input: {
        application: 'src/assets/js/application.ts',
        stubs: 'src/assets/scss/stubs.scss'
      },
      output: {
        assetFileNames: ({ names }) =>
          names[0]?.endsWith('.css')
            ? 'public/stylesheets/[name][extname]'
            : 'public/assets/[name][extname]',
        entryFileNames: 'public/javascripts/[name].js'
      }
    },
    sourcemap: true
  },
  css: {
    lightningcss: {
      errorRecovery: true
    },
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import'] // FIXME: remove when migrated to govuk-frontend 6.0
      }
    }
  },
  plugins: [
    serverBuild(),
    dockerCompose(),
    viteStaticCopy({
      targets: [
        {
          dest: 'public',
          rename: { stripBase: 5 },
          src: 'node_modules/govuk-frontend/dist/govuk/assets/{fonts,images,rebrand}'
        },
        {
          dest: 'views',
          rename: { stripBase: 2 },
          src: 'src/views'
        },
        {
          dest: 'src', // needs to be src as hardcoded upstream
          rename: { stripBase: 1 },
          src: 'src/locales'
        },
        {
          dest: 'public/javascripts',
          rename: { stripBase: true },
          src: 'node_modules/@govuk-one-login/frontend-analytics/lib/analytics.js'
        },
        {
          dest: 'public/javascripts',
          rename: { stripBase: true },
          src: 'node_modules/hmpo-components/all.js'
        },
        {
          dest: 'public/javascripts',
          rename: { name: 'deviceIntelligence.js', stripBase: true },
          src: 'node_modules/@govuk-one-login/frontend-device-intelligence/build/esm/index.js'
        }
      ]
    })
  ],
  publicDir: false,
  resolve: {
    alias: {
      '@govuk-one-login/frontend-language-toggle': path.resolve(
        __dirname,
        'node_modules/@govuk-one-login/frontend-language-toggle/build/stylesheet/styles.css'
      ),
      '@govuk-one-login/frontend-ui': path.resolve(
        __dirname,
        'node_modules/@govuk-one-login/frontend-ui/build/all.css'
      ),
      '@src': path.resolve(__dirname, 'src')
    }
  }
})
