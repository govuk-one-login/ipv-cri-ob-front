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
        minify: true,
        outDir: 'dist',
        rollupOptions: {
          external: [/\.node$/],
          output: { entryFileNames: '[name].js', format: 'esm', inlineDynamicImports: true }
        },
        sourcemap: true,
        ssr: 'src/index.ts'
      },
      configFile: false
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
    rollupOptions: {
      input: { application: 'src/assets/js/application.ts' },
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
          src: 'node_modules/govuk-frontend/dist/govuk/assets/{fonts,images,rebrand}'
        },
        {
          dest: 'views',
          src: 'src/views/*'
        },
        {
          dest: 'src',
          src: 'src/locales'
        },
        {
          dest: 'public/javascripts',
          src: 'node_modules/@govuk-one-login/frontend-analytics/lib/analytics.js'
        },
        {
          dest: 'public/javascripts',
          src: 'node_modules/hmpo-components/all.js'
        },
        {
          dest: 'public/javascripts',
          rename: 'deviceIntelligence.js',
          src: 'node_modules/@govuk-one-login/frontend-device-intelligence/build/esm/index.js'
        }
      ]
    })
  ],
  publicDir: false,
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
