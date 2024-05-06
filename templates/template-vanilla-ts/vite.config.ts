import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        VitePWA({
            strategies: 'generateSW',
            // when using strategies 'injectManifest' you need to provide the srcDir
            // srcDir: './src/service-worker/',
            // when using strategies 'injectManifest' use claims-sw.ts or prompt-sw.ts
            // filename: 'sw.js',
            registerType: 'prompt',
            injectRegister: false,
            pwaAssets: { disabled: false, config: true, htmlPreset: '2023', overrideManifestIcons: true },
            manifest: {
                name: 'TypeScript Vite PWA',
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
            // only when using strategies 'generateSW'
            // this entry WILL BE IGNORED when using strategies 'injectManifest'
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
            },
            // only when using strategies 'injectManifest'
            // this entry WILL BE IGNORED when using strategies 'generateSW'
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,svg,png,svg,ico}'],
            },
            devOptions: {
                enabled: false,
                navigateFallback: 'index.html',
                suppressWarnings: true,
                /* when using generateSW the PWA plugin will switch to classic */
                type: 'module',
            }
        })
    ]
})
