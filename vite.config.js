import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: "/my-qrs-pwa",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['app-icons/icon.svg', 'app-icons/apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/my-qrs-pwa/index.html'
      },
      manifest: {
        name: 'My QRs',
        short_name: 'My QRs',
        description: 'PWA for storing and managing QR codes',
        theme_color: '#ffffff',
        background_color: '#1c1c1e',
        display: 'standalone',
        start_url: '/my-qrs-pwa/',
        scope: '/my-qrs-pwa/',
        icons: [
          {
            src: 'app-icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000, // Increase the warning limit
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // All dependencies from node_modules will be collected in a separate chunk
          }
        }
      }
    }
  },
});