import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        VitePWA({
            strategies: 'generateSW',
            // when using strategies 'injectManifest' you need to provide the srcDir
            // srcDir: './service-worker/',
            // when using strategies 'injectManifest' use claims-sw.js or prompt-sw.js
            // filename: 'sw.js',
            registerType: 'prompt',
            injectRegister: false,
            includeAssets: ['favicon.svg', 'favicon.ico', 'javascript.svg'],
            pwaAssets: { disabled: false, config: true, htmlPreset: '2023', overrideManifestIcons: true },
            manifest: {
                name: 'Application name',
                short_name: 'App short name',
                description: 'Application description',
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
            // only when using strategies 'generateSW'
            // this entry WILL BE IGNORED when using strategies 'injectManifest'
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
            },
            devOptions: {
                enabled: false,
                navigateFallback: 'index.html',
                suppressWarnings: true,
                /* when using generateSW the PWA plugin will switch to classic */
                type: 'module',
            },
        })
    ]
})
