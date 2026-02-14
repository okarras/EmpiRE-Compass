import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // Optional: enable PWA in dev for testing
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'EmpiRE Compass',
        short_name: 'EmpiRE Compass',
        description: 'EmpiRE Compass a dashboard for research in RE',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/node_modules/**/*', '**/firebase-backup*'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/orkg\.org\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache statistics API calls (both relative and absolute URLs)
            urlPattern: ({ url }) => {
              return (
                url.pathname.includes('/api/templates/') &&
                url.pathname.includes('/statistics')
              );
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'statistics-cache',
              expiration: {
                maxAgeSeconds: 1 * 60 * 60, // 1 hour - statistics don't change frequently
                maxEntries: 50, // Limit cache entries
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': [
            '@mui/material',
            '@mui/icons-material',
            '@mui/x-charts',
            '@mui/x-data-grid',
          ],
          'ai-vendor': [
            'ai',
            '@ai-sdk/groq',
            '@ai-sdk/anthropic',
            '@ai-sdk/openai',
          ],
          'utils-vendor': [
            'react-router',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-charts',
      '@mui/x-data-grid',
    ],
  },
});
