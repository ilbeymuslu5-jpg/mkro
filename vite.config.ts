import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// `npm run build:single` inlines every asset into one self-contained index.html
// for the Claude Artifact — a service worker has no real origin to register
// against there, so the PWA plugin only runs for the normal deployable build.
const singleFile = process.env.VITE_SINGLEFILE === '1'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(singleFile
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: 'makromusic',
              short_name: 'makromusic',
              description: 'Müzik zevkine göre insanlarla tanış.',
              lang: 'tr',
              start_url: '/',
              scope: '/',
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#0f0f23',
              theme_color: '#0f0f23',
              icons: [
                { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: '/maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              // Spotify/Supabase calls must always hit the network — caching
              // an auth or now-playing response would show stale data.
              navigateFallbackDenylist: [/^\/auth/, /^\/rest/],
            },
          }),
        ]),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
  },
})
