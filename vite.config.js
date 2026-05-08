import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpg: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { lossless: false, quality: 80 },
      svg: { multipass: true },
    }),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {},
  },
  optimizeDeps: {
    include: ['react-icons/fa'],
  },
  build: {
    commonjsOptions: {
      include: [/react-icons/, /node_modules/],
    },
  },
})