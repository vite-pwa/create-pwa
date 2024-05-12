import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { RemixVitePWA } from "@vite-pwa/remix";

installGlobals();

const { RemixVitePWAPlugin, RemixPWAPreset } = RemixVitePWA();

export default defineConfig({
  plugins: [
    remix({
      presets: [RemixPWAPreset()],
    }),
    tsconfigPaths(),
    RemixVitePWAPlugin({
      strategies: "generateSW",
      // when using strategies "injectManifest" you need to provide the srcDir
      // srcDir: "app",
      // when using strategies "injectManifest" use claims-sw.ts or prompt-sw.ts
      // filename: "prompt-sw.ts",
      registerType: "prompt",
      injectRegister: false,
      pwaAssets: { disabled: false, config: true, htmlPreset: "2023", overrideManifestIcons: true },
      manifest: {
        name: "Remix PWA",
        short_name: "Remix PWA",
        theme_color: "#ffffff",
        icons: [{
          src: "pwa-64x64.png",
          sizes: "64x64",
          type: "image/png",
        }, {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        }, {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        }, {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        }],
      },
      workbox: {
        globPatterns: ["**/*.{js,html,css,png,svg,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      injectManifest: {
        globPatterns: ["**/*.{js,html,css,png,svg,ico}"],
      },
      devOptions: {
        enabled: false,
        type: "module",
        suppressWarnings: true,
      },
    }),
  ],
});
