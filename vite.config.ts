import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base: './' — сайт працює з будь-якої адреси, зокрема https://<логін>.github.io/<репозиторій>/
export default defineConfig({
  base: './',
  build: { outDir: 'docs', emptyOutDir: true, chunkSizeWarningLimit: 900 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Fatscore',
        short_name: 'Fatscore',
        description: 'Здоров\'я і фітнес з персонажем, який росте разом з тобою',
        lang: 'uk',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF1D6',
        theme_color: '#FFF1D6',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/ponyfill-*.js'],
        runtimeCaching: [
          { urlPattern: /zxing_reader\.wasm$|ponyfill-.*\.js$/, handler: 'CacheFirst', options: { cacheName: 'scanner', expiration: { maxEntries: 4 } } }
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html'
      }
    })
  ]
});
