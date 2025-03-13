import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './', // Ensures assets load properly when hosted externally (e.g., ngrok)
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Screen Share PWA',
        short_name: 'ScreenShare',
        description: 'A PWA with screen sharing support',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        display: 'standalone',
        start_url: '/', // Ensures PWA opens properly from home screen
      },
    }),
  ],
  server: {
    port: 3000, 
    host: '0.0.0.0',  // Required for ngrok to work properly
    // https: true,  // Ensures secure connection for PWA and getDisplayMedia()
  },
});
