import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const apiCacheDuration = 24 * 60 * 60; // 1 day in seconds

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        runtimeCaching: [
          {
            // Cache API requests
            urlPattern: /^https:\/\/orkg\.org\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxAgeSeconds: apiCacheDuration, // Cache for 1 day
              },
              cacheableResponse: {
                statuses: [0, 200], // Only cache valid responses
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Optional: enable PWA in dev for testing
      },
    }),
  ],
});
