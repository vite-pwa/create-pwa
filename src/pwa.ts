import type { PromptsData } from './types'

export interface PWAOptions {
  includeAssets?: string[]
  workbox?: any
  injectManifest?: any
  devOptions?: any
}

export function preparePWAOptions(
  ts: boolean,
  prompts: PromptsData,
  swFolder: string,
  options?: PWAOptions,
) {
  const {
    name,
    shortName,
    description,
    themeColor,
    customServiceWorker,
    prompt,
    pwaAssets,
  } = prompts
  const pwaOptions = {} as any
  if (customServiceWorker) {
    pwaOptions.strategies = 'injectManifest'
    pwaOptions.srcDir = swFolder
    pwaOptions.filename = swName(swFolder, ts)
  }

  pwaOptions.registerType = prompt ? 'prompt' : 'autoUpdate'
  pwaOptions.injectRegister = false
  if (options?.includeAssets)
    pwaOptions.includeAssets = options.includeAssets

  if (pwaAssets)
    pwaOptions.pwaAssets = { disabled: false, config: true }

  pwaOptions.manifest = {
    name,
    short_name: shortName,
    description: description ?? name,
    theme_color: themeColor,
  }
  if (!pwaAssets) {
    pwaOptions.manifest.icons = [
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
    ]
  }

  if (!customServiceWorker && options?.workbox)
    pwaOptions.workbox = options.workbox

  if (customServiceWorker && options?.injectManifest)
    pwaOptions.injectManifest = options.injectManifest

  pwaOptions.devOptions = options?.devOptions ?? {
    enabled: false,
    navigateFallback: 'index.html',
    suppressWarnings: true,
    /* when using generateSW the PWA plugin will switch to classic */
    type: 'module',
  }

  return pwaOptions
}

function swName(path: string, ts: boolean) {
  return `${path}/sw.${ts ? 't' : 'j'}s`
}
