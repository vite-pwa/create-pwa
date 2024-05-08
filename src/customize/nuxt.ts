import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { addNuxtModule } from 'magicast/helpers'
import { generateCode, parseModule } from 'magicast'
import type { PromptsData } from '../types'
import { preparePWAOptions } from '../pwa'
import { includeDependencies } from '../dependencies'

export function customize(prompts: PromptsData) {
  const {
    cdProjectName,
    templateDir,
    rootPath,
    customServiceWorker,
    prompt,
    pwaAssets,
  } = prompts
  // cleanup target folder
  rmSync(path.join(rootPath, 'app.vue'), { recursive: true })
  rmSync(path.join(rootPath, 'nuxt.config.ts'), { recursive: true })
  rmSync(path.join(rootPath, 'public'), { recursive: true })
  // extract template-nuxt folder
  copyFileSync(path.join(templateDir, 'app.vue'), path.join(rootPath, 'app.vue'))
  mkdirSync(path.join(rootPath, 'layouts'))
  writeFileSync(
    path.join(rootPath, 'layouts', 'default.vue'),
    createLayout(prompts),
    'utf-8',
  )
  mkdirSync(path.join(rootPath, 'pages'))
  copyFileSync(
    path.join(templateDir, 'pages', 'index.vue'),
    path.join(rootPath, 'pages', 'index.vue'),
  )
  mkdirSync(path.join(rootPath, 'public'))
  copyFileSync(path.join(templateDir, 'public', 'favicon.svg'), path.join(rootPath, 'public', 'favicon.svg'))
  copyFileSync(path.join(templateDir, 'pwa-assets.config.ts'), path.join(rootPath, 'pwa-assets.config.ts'))
  if (customServiceWorker) {
    mkdirSync(path.join(rootPath, 'service-worker'))
    copyFileSync(
      path.join(templateDir, 'service-worker', `${prompt ? 'prompt' : 'claims'}-sw.ts`),
      path.join(rootPath, 'service-worker', 'sw.ts'),
    )
    copyFileSync(
      path.join(templateDir, 'service-worker', 'tsconfig.json'),
      path.join(rootPath, 'service-worker', 'tsconfig.json'),
    )
  }

  createNuxtConf(prompts)

  const pkg = JSON.parse(readFileSync(path.join(rootPath, 'package.json'), 'utf-8'))

  const pkgManager = detectPackageManager(rootPath)

  includeDependencies(prompts, pkgManager === 'npm', pkg, [
    ['@vite-pwa/assets-generator', '^0.2.4'],
    ['@vite-pwa/nuxt', '^0.7.0'],
    ['typescript', '^5.4.5'],
    ['vite-plugin-pwa', '^0.20.0'],
    ['vue-tsc', '^2.0.16'],
    ['workbox-window', '^7.1.0'],
  ])

  writeFileSync(path.join(rootPath, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8')

  console.log('\n\nPWA configuration done. Now run:\n')
  if (rootPath !== process.cwd()) {
    console.log(
        `  cd ${
            cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
        }`,
    )
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      if (!pwaAssets)
        console.log('  yarn generate-pwa-icons')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      if (!pwaAssets)
        console.log(`  ${pkgManager} run generate-pwa-icons`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}

function detectPackageManager(rootPath: string) {
  // check for pnpm lock file
  if (existsSync(path.join(rootPath, 'pnpm-lock.yaml')))
    return 'pnpm'

  // check for yarn lock file
  if (existsSync(path.join(rootPath, 'yarn.lock')))
    return 'yarn'

  // check for bun lock file
  if (existsSync(path.join(rootPath, 'bun.lockb')))
    return 'bun'

  return 'npm'
}

function createNuxtConf(prompts: PromptsData) {
  const {
    rootPath,
    customServiceWorker,
    reloadSW,
    installPWA,
  } = prompts
  // add nuxt config file
  const pwaOptions = preparePWAOptions(true, prompts, 'service-worker', {
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },
  })
  pwaOptions.registerWebManifestInRouteRules = true
  if (reloadSW || installPWA) {
    pwaOptions.client = {}
    if (reloadSW)
      pwaOptions.client.periodicSyncForUpdates = 3600

    if (installPWA)
      pwaOptions.client.installPrompt = true
  }

  const nuxtConf = customServiceWorker
    ? parseModule(`// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    tsConfig: {
      exclude: ['../service-worker'],
    },
  },
  devtools: { enabled: true },
  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
`)
    : parseModule(`// https://nuxt.com/docs/api/configuration/nuxt-config
  devtools: { enabled: true },
  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
`)
  addNuxtModule(nuxtConf, '@vite-pwa/nuxt', 'pwa', pwaOptions)
  writeFileSync(path.join(rootPath, 'nuxt.config.ts'), generateCode(nuxtConf).code, 'utf-8')
}

function createLayout(prompts: PromptsData) {
  const {
    prompt,
    offline,
    installPWA,
  } = prompts
  let content = `<script setup lang="ts">
// you can extract the <ClientOnly> component to a separate file
</script>

<template>
  <main>
    <slot />
    <ClientOnly>`
  if (offline) {
    content += `
      <div
          v-if="$pwa?.offlineReady || $pwa?.needRefresh"
          class="pwa-toast"
          role="alert"
          aria-labelledby="toast-message"
      >
        <div class="message">
          <span id="toast-message">
            {{ $pwa.offlineReady ? 'App ready to work offline' : 'New content available, click on reload button to update' }}
          </span>
        </div>
        <div class="buttons">
          <button
              v-if="$pwa.needRefresh"
              @click="$pwa.updateServiceWorker()"
          >
            Reload
          </button>
          <button @click="$pwa.cancelPrompt()">
            Close
          </button>
        </div>
      </div>`
  }
  else {
    content += `
      <div
          v-if="$pwa?.needRefresh"
          class="pwa-toast"
          role="alert"
          aria-labelledby="toast-message"
      >
        <div class="message">
          <span id="toast-message">
            New content available, click on reload button to update
          </span>
        </div>
        <div class="buttons">
          <button @click="$pwa.updateServiceWorker()">
            Reload
          </button>
          <button @click="$pwa.cancelPrompt()">
            Close
          </button>
        </div>
      </div>`
  }

  if (installPWA) {
    const vif = prompt
      ? '$pwa?.showInstallPrompt && !$pwa?.offlineReady && !$pwa?.needRefresh'
      : '$pwa?.showInstallPrompt && !$pwa?.needRefresh'
    content += `
      <div
          v-if="${vif}"
          class="pwa-toast"
          role="alert"
          aria-labelledby="install-pwa"
      >
        <div class="message">
          <span id="install-pwa">
            Install PWA
          </span>
        </div>
        <button @click="$pwa.install()">
          Install
        </button>
        <button @click="$pwa.cancelInstall()">
          Cancel
        </button>
      </div>`
  }

  content += `
    </ClientOnly>
  </main>
</template>

<style>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  background-color: white;
}
.pwa-toast .message {
  margin-bottom: 8px;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
</style>
`

  return content
}
