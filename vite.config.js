import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const appOnly = mode === 'app'

  return {
    plugins: [
      react(),
      appOnly && {
        name: 'app-public-assets',
        apply: 'build',
        generateBundle() {
          for (const fileName of ['bg.webp', 'favicon.svg']) {
            this.emitFile({
              type: 'asset',
              fileName,
              source: readFileSync(new URL(`./public/${fileName}`, import.meta.url)),
            })
          }
        },
      },
    ],
    build: {
      outDir: appOnly ? 'dist-app' : 'dist',
      copyPublicDir: !appOnly,
    },
  }
})
