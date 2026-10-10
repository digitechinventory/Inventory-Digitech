import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'digitech-emblem.png', 'digitech-logo-light.png', 'digitech-logo-dark.png', 'logo_animation.mp4'],
      workbox: {
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024, // 25 MiB
        globIgnores: ['**/spline-robot.html'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'video' || request.url.endsWith('.mp4'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pwa-video-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 60 // 60 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Digitech IMS',
        short_name: 'Digitech IMS',
        description: 'Digitech IMS — Inventory Management System',
        theme_color: '#DC2626',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '540x568',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'icon-vendor': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: true,
    allowedHosts: true,
    cors: true,
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

