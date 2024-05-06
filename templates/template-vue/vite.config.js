import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
      vue(),
    VitePWA({
      strategies: 'injectManifest',
      // when using strategies 'injectManifest' you need to provide the srcDir
      srcDir: 'src',
      // when using strategies 'injectManifest' use claims-sw.js or prompt-sw.js
      filename: 'prompt-sw.js',
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { disabled: false, config: true, htmlPreset: '2023', overrideManifestIcons: true },
      manifest: {
        name: 'Vite PWA Vue',
        short_name: 'Vite PWA',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
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
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}'],
      },
      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        /* when using generateSW the PWA plugin will switch to classic */
        type: 'module',
      },
    }),
  ],
})
