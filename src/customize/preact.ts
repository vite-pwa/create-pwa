import { renameSync, rmSync } from 'node:fs'
import { generateCode, parseModule } from 'magicast'
import { addVitePlugin } from 'magicast/helpers'
import type { PromptsData } from '../types'
import { editFile } from '../utils'
import { preparePWAOptions } from '../pwa'
import { MagicastViteOptions } from '../vite'

export function customize(prompts: PromptsData) {
  const {
    rootPath,
    name,
    themeColor,
    framework,
    customServiceWorker,
    prompt,
    offline,
    reloadSW,
    pwaAssets,
  } = prompts
  const ts = framework === 'preact-ts'
  editFile(`${rootPath}/src/PWABadge.${ts ? 't' : 'j'}sx`, (content) => {
    let newContent = content

    if (!offline) {
      newContent = newContent
        .replace(
          'offlineReady: [offlineReady, setOfflineReady],',
          '',
        )
        .replace(
          'setOfflineReady(false)',
          '',
        )
        .replace(
          '{ (offlineReady || needRefresh)',
          '{ (needRefresh)',
        )
        .replace('{ offlineReady', '<span id="toast-message">New content available, click on reload button to update.</span>')
        .replace('? <span id="toast-message">App ready to work offline</span>', '')
        .replace(': <span id="toast-message">New content available, click on reload button to update.</span>}', '')
        .replace(
          '{ needRefresh && <button className="PWABadge-toast-button" onClick={() => updateServiceWorker(true)}>Reload</button> }',
          '<button className="PWABadge-toast-button" onClick={() => updateServiceWorker(true)}>Reload</button>',
        )
    }

    if (reloadSW) {
      newContent = newContent
        .replace('PERIODIC_SYNC_COMMENT', 'check for updates every hour')
        .replace('const period = 0', 'const period = 60 * 60 * 1000')
    }
    else {
      newContent = newContent.replace('PERIODIC_SYNC_COMMENT', `periodic sync is disabled, change the value to enable it, the period is in milliseconds
// You can remove onRegisteredSW callback and registerPeriodicSync function`)
    }

    return newContent
  })
  editFile(`${rootPath}/index.html`, (content) => {
    const newContent = content.replace('Vite PWA + Preact', `${name}`)
    return pwaAssets
      ? newContent.replace('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />', '')
      : newContent
        .replace(
          '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
                    `    <meta name="theme-color" content="${themeColor}">
    <link rel="icon" href="/favicon.ico" sizes="48x48">
    <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
`,
        )
  })
  editFile(`${rootPath}/src/app.${ts ? 't' : 'j'}sx`, (content) => {
    return content
      .replace('App logo', `${name} logo`)
      .replace('<h1>Vite PWA + Preact</h1>', `<h1>${name}</h1>`)
  })
  if (customServiceWorker) {
    const toDelete = prompt ? 'claims' : 'prompt'
    rmSync(`${rootPath}/src/${toDelete}-sw.${ts ? 't' : 'j'}s`)
    const toRename = prompt ? 'prompt' : 'claims'
    renameSync(`${rootPath}/src/${toRename}-sw.${ts ? 't' : 'j'}s`, `${rootPath}/src/sw.${ts ? 't' : 'j'}s`)
  }
  else {
    rmSync(`${prompts.rootPath}/src/prompt-sw.${ts ? 't' : 'j'}s`, { recursive: true })
    rmSync(`${prompts.rootPath}/src/claims-sw.${ts ? 't' : 'j'}s`, { recursive: true })
  }
  const viteConf = parseModule(`
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
  ],
})
`)

  addVitePlugin(viteConf, {
    from: 'vite-plugin-pwa',
    imported: 'VitePWA',
    constructor: 'VitePWA',
    options: preparePWAOptions(
      ts,
      prompts,
      'src',
      {
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        },
      },
    ),
  })
  editFile(`${rootPath}/vite.config.${ts ? 't' : 'j'}s`, () => {
    return generateCode(viteConf, MagicastViteOptions).code
  })
}
