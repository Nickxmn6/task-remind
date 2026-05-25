import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'OneSignalSDKWorker.js', // Memaksa PWA menggunakan nama worker OneSignal
      workbox: {
        // Gabungkan script asli OneSignal ke dalam Service Worker PWA ini
        importScripts: ['https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000 // 5MB
      },
      manifest: false // Kita menggunakan manifest.json statis di folder public
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['lucide-react', 'date-fns']
        }
      }
    }
  }
})
