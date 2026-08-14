import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

// `npm run build:single` inlines every asset into one self-contained index.html.
const singleFile = process.env.VITE_SINGLEFILE === '1'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(singleFile ? [viteSingleFile()] : [])],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
  },
})
