import type { PromptsData } from '../types'
import { editFile } from '../utils'

export function customize(prompts: PromptsData) {
  const {
    rootPath,
    name,
    description,
    themeColor,
    framework,
    customServiceWorker,
    prompt,
    offline,
    reloadSW,
  } = prompts
  const viteConfig = `${rootPath}/vite.config.${framework === 'vanilla' ? 'j' : 't'}s`
  editFile(viteConfig, (content) => {
    return content
      .replaceAll('NAME', `'${name}'`)
      .replace('DESCRIPTION', `'${description ?? name}'`)
      .replace('THEME_COLOR', `'${themeColor}'`)
      .replace('STRATEGIES', `'${customServiceWorker ? 'injectManifest' : 'generateSW'}'`)
      .replace('REGISTER_TYPE', `'${prompt ? 'prompt' : 'autoUpdate'}'`)
  })
  editFile(`${rootPath}/pwa.${framework === 'vanilla' ? 'j' : 't'}s`, (content) => {
    let newContent = content
      .replace('OFFLINE_COMMENT', `${offline ? 'comment out the next 2 lines to show offline ready prompt' : 'uncomment the next 2 lines to hide offline ready prompt'}`)

    if (!offline) {
      newContent = newContent.replace('pwaToastMessage.innerHTML = \'App ready to work offline\'', '// pwaToastMessage.innerHTML = \'App ready to work offline\'')
      newContent = newContent.replace('showPwaToast(true)', '// showPwaToast(true)')
    }

    return newContent.replace(
      'PROMPT_COMMENT',
      reloadSW
        ? 'Show the prompt to update the service worker when a new version is available'
        : `This method will not be called using registerType with 'autoUpdate' behavior: you can change the behavior in the ${viteConfig} file using \'registerType\' property.`,
    )
  })
}
