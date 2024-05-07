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
  const ts = framework === 'lit-ts'
  editFile(`${rootPath}/src/pwa-badge.${ts ? 't' : 'j'}s`, (content) => {
    let newContent = content

    if (reloadSW)
      newContent = newContent.replace('_period = 0', '_period = 60 * 60 * 1000 // check for updates every hour')

    else
      newContent = newContent.replace('_period = 0', '_period = 0 // check for updates disabled')

    if (!offline) {
      // remove offline callback
      newContent = newContent.replace('onOfflineReady: () => (this._offlineReady = true),', '')
    }

    return newContent
  })
  editFile(`${rootPath}/index.html`, (content) => {
    const newContent = content.replaceAll('Vite PWA + Lit', `${name}`)
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
  editFile(`${rootPath}/src/my-element.${ts ? 't' : 'j'}s`, (content) => {
    return content.replace('Vite logo', `${name} logo`)
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

// https://vitejs.dev/config/
export default defineConfig({})
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
