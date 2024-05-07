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
  const ts = framework === 'vanilla-ts'
  editFile(`${rootPath}/${ts ? 'src/' : ''}pwa.${ts ? 't' : 'j'}s`, (content) => {
    let newContent = content
      .replace('OFFLINE_COMMENT', `${offline ? 'comment out the next 2 lines to show offline ready prompt' : 'uncomment the next 2 lines to hide offline ready prompt'}`)

    if (offline) {
      newContent = newContent.replace('// pwaToastMessage.innerHTML = \'App ready to work offline\'', 'pwaToastMessage.innerHTML = \'App ready to work offline\'')
      newContent = newContent.replace('// showPwaToast(true)', 'showPwaToast(true)')
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

    return newContent.replace(
      'PROMPT_COMMENT',
      prompt
        ? 'Show the prompt to update the service worker when a new version is available'
        : `This method will not be called using registerType with 'autoUpdate' behavior: you can change the behavior in the Vite config file using \'registerType\' property.`,
    )
  })
  editFile(`${rootPath}/index.html`, (content) => {
    const newContent = content
      .replace('Vite VanillaJS PWA', `${name}`)
      .replace('Vite TypeScript PWA', `${name}`)
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
  editFile(`${rootPath}/${ts ? 'src/' : ''}/main.${ts ? 't' : 'j'}s`, (content) => {
    return content
      .replace('Vite VanillaJS PWA', `${name}`)
      .replace('Vite TypeScript PWA', `${name}`)
      .replace('Vite PWA logo', `${name} logo`)
  })
  if (customServiceWorker) {
    const toDelete = prompt ? 'claims' : 'prompt'
    rmSync(`${rootPath}/${ts ? 'src/' : ''}service-worker/${toDelete}-sw.${ts ? 't' : 'j'}s`)
    const toRename = prompt ? 'prompt' : 'claims'
    renameSync(`${rootPath}/${ts ? 'src/' : ''}service-worker/${toRename}-sw.${ts ? 't' : 'j'}s`, `${rootPath}/${ts ? 'src/' : ''}service-worker/sw.${ts ? 't' : 'j'}s`)
  }
  else {
    rmSync(`${prompts.rootPath}/${ts ? 'src/' : ''}service-worker`, { recursive: true })
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
`${ts ? 'src/' : ''}service-worker`,
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
