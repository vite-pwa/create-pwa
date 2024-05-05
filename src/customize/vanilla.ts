import type { PromptsData } from '../types'
import { editFile } from '../utils'

export function customize(prompts: PromptsData) {
  const {
    rootPath,
    name,
    shortName,
    description,
    themeColor,
    framework,
    customServiceWorker,
    prompt,
    offline,
    reloadSW,
    pwaAssets,
  } = prompts
  const ts = framework === 'vanilla-ts'
  const viteConfig = `${rootPath}/vite.config.${ts ? 't' : 'j'}s`
  editFile(viteConfig, (content) => {
    let newContent = content
      .replace('Application name', `${name}`)
      .replace('App short name', `${shortName}`)
      .replace('Application description', `${description ?? name}`)
      .replace('#ffffff', `${themeColor}`)
      .replace('generateSW', `${customServiceWorker ? 'injectManifest' : 'generateSW'}`)
      .replace('prompt', `'${prompt ? 'prompt' : 'autoUpdate'}'`)

    if (!pwaAssets)
      newContent = newContent.replace('{ disabled: false,', '{ disabled: true,')

    if (customServiceWorker) {
      newContent = newContent
        .replace(
          ts ? '// srcDir: \'./src/service-worker/\',' : '// srcDir: \'./service-worker/\',',
          ts ? 'srcDir: \'./src/service-worker/\',' : 'srcDir: \'./service-worker/\',',
        )
        .replace('// filename: \'sw.js\',', `filename: '${prompt ? 'prompt' : 'claims'}-sw.js',`)
    }

    return newContent
  })
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
        .replace('const period = 0', 'const period = 24 * 60 * 60000')
    }
    else {
      newContent = newContent.replace('PERIODIC_SYNC_COMMENT', `periodic sync is disabled, change the value to enable it, the period is in milliseconds
   // You can remove onRegisteredSW callbacl and registerPeriodicSync function`)
    }

    return newContent.replace(
      'PROMPT_COMMENT',
      prompt
        ? 'Show the prompt to update the service worker when a new version is available'
        : `This method will not be called using registerType with 'autoUpdate' behavior: you can change the behavior in the ${viteConfig} file using \'registerType\' property.`,
    )
  })
  editFile(`${rootPath}/index.html`, (content) => {
    return pwaAssets
      ? content.replace('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />', '')
      : content
        .replace('Vite VanillaJS PWA', `'${name}'`)
        .replace('Vite TypeScript PWA', `'${name}'`)
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
      .replace('Vite VanillaJS PWA', `'${name}'`)
      .replace('Vite TypeScript PWA', `'${name}'`)
  })
}
