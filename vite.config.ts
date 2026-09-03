import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

function precacheSw() {
  return {
    name: 'precache-sw',
    apply: 'build' as const,
    closeBundle() {
      const outDir = path.resolve(root, 'dist')
      const swPath = path.join(outDir, 'sw.js')
      if (!existsSync(swPath)) return
      const assetsDir = path.join(outDir, 'assets')
      const hashed = existsSync(assetsDir)
        ? readdirSync(assetsDir)
            .filter((file) => /\.(js|css)$/.test(file))
            .map((file) => `./assets/${file}`)
        : []
      const precache = [
        './',
        './index.html',
        './manifest.webmanifest',
        './icon.svg',
        './icon-192.png',
        './icon-512.png',
        ...hashed,
      ]
      const id = createHash('sha256')
        .update(precache.join('|'))
        .digest('hex')
        .slice(0, 8)
      let sw = readFileSync(swPath, 'utf8')
      sw = sw.replace(/const CACHE = '[^']+'/, `const CACHE = 'casa-shell-${id}'`)
      sw = sw.replace(
        /const PRECACHE = \[[\s\S]*?\]/,
        `const PRECACHE = ${JSON.stringify(precache)}`,
      )
      writeFileSync(swPath, sw)
    },
  }
}

export default defineConfig({
  base: '/home-stock/',
  plugins: [react(), tailwindcss(), precacheSw()],
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
  test: {
    environment: 'node',
  },
  server: {
    port: 5173,
  },
})
