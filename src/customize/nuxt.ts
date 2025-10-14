import type { PackageJsonEntry, PromptsData } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateCode, parseModule } from 'magicast'
import { addNuxtModule } from 'magicast/helpers'
import { detect } from 'package-manager-detector'
import { includeDependencies } from '../dependencies'
import { preparePWAOptions } from '../pwa'
import { addPackageObject } from '../utils'
import {
  NuxtPWAModuleVersion,
  PWAAssetsVersion,
  TypeScriptVersion,
  VitePluginPWAVersion,
  VueTscVersion,
  WorkboxVersion,
} from '../versions'
import { MagicastViteOptions } from '../vite'

export async function customize(prompts: PromptsData, v4: boolean) {
  const {
    cdProjectName,
    templateDir: templateDirFolder,
    rootPath: outputRootPath,
    customServiceWorker,
    prompt,
    pwaAssets,
  } = prompts
  const [rootPath, templateDir] = getPaths(outputRootPath, templateDirFolder, v4)
  // cleanup target folder
  fs.rmSync(path.join(rootPath, 'app.vue'), { recursive: true })
  fs.rmSync(path.join(outputRootPath, 'nuxt.config.ts'), { recursive: true })
  fs.rmSync(path.join(outputRootPath, 'public'), { recursive: true })
  // extract template-nuxt folder
  fs.copyFileSync(path.join(templateDir, 'app.vue'), path.join(rootPath, 'app.vue'))
  fs.mkdirSync(path.join(rootPath, 'layouts'))
  fs.writeFileSync(
    path.join(rootPath, 'layouts', 'default.vue'),
    createLayout(prompts),
    'utf-8',
  )
  fs.mkdirSync(path.join(rootPath, 'pages'))
  fs.copyFileSync(
    path.join(templateDir, 'pages', 'index.vue'),
    path.join(rootPath, 'pages', 'index.vue'),
  )
  fs.mkdirSync(path.join(outputRootPath, 'public'))
  fs.copyFileSync(path.join(templateDir, 'public', 'favicon.svg'), path.join(outputRootPath, 'public', 'favicon.svg'))

  // v4 root inside app: public folder on root
  if (v4 && pwaAssets) {
    const pwaAssets = fs.readFileSync(path.join(templateDir, 'pwa-assets.config.ts'), 'utf-8')
    fs.writeFileSync(
      path.join(outputRootPath, 'app/pwa-assets.config.ts'),
      pwaAssets.replace('images: [\'public/favicon.svg\'],', 'images: [\'../public/favicon.svg\'],'),
      'utf-8',
    )
  }
  else {
    fs.copyFileSync(path.join(templateDir, 'pwa-assets.config.ts'), path.join(outputRootPath, 'pwa-assets.config.ts'))
  }

  if (customServiceWorker) {
    fs.mkdirSync(path.join(rootPath, 'service-worker'))
    fs.copyFileSync(
      path.join(templateDir, 'service-worker', `${prompt ? 'prompt' : 'claims'}-sw.ts`),
      path.join(rootPath, 'service-worker', 'sw.ts'),
    )
    if (v4) {
      const tsConfig = fs.readFileSync(path.join(templateDir, 'service-worker', 'tsconfig.json'), 'utf-8')
      fs.writeFileSync(
        path.join(rootPath, 'service-worker', 'tsconfig.json'),
        tsConfig.replace('"extends": "../tsconfig.json",', '"extends": "../../tsconfig.json",'),
        'utf-8',
      )
    }
    else {
      fs.copyFileSync(
        path.join(templateDir, 'service-worker', 'tsconfig.json'),
        path.join(rootPath, 'service-worker', 'tsconfig.json'),
      )
    }
  }

  // create nuxt.config.ts
  createNuxtConf(prompts, v4)

  // prepare package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(outputRootPath, 'package.json'), 'utf-8'))

  const pkgManager = await detect({
    cwd: outputRootPath,
  }).then(res => res?.name || 'npm')

  // dependencies
  pkg.dependencies ??= {}
  const dependencies: PackageJsonEntry[] = [
    ['@vite-pwa/assets-generator', PWAAssetsVersion],
    ['@vite-pwa/nuxt', NuxtPWAModuleVersion],
    ['vite-plugin-pwa', VitePluginPWAVersion],
    ['workbox-build', WorkboxVersion],
    ['workbox-window', WorkboxVersion],
  ]
  if (customServiceWorker) {
    dependencies.push(
      ['workbox-core', WorkboxVersion],
      ['workbox-precaching', WorkboxVersion],
      ['workbox-routing', WorkboxVersion],
      ['workbox-strategies', WorkboxVersion],
    )
  }
  addPackageObject('dependencies', dependencies, pkg, true)
  // devDependencies
  pkg.devDependencies ??= {}
  addPackageObject('devDependencies', [
    ['typescript', TypeScriptVersion],
    ['vue-tsc', VueTscVersion],
  ], pkg, true)
  // script + resolutions: ignoring dev dependencies
  includeDependencies(prompts, pkgManager === 'npm', pkg, true)

  // save package.json
  fs.writeFileSync(path.join(outputRootPath, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8')

  console.log('\n\nPWA configuration done. Now run:\n')
  if (outputRootPath !== process.cwd()) {
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

function createNuxtConf(prompts: PromptsData, v4: boolean) {
  const {
    rootPath,
    customServiceWorker,
    reloadSW,
    installPWA,
  } = prompts
  // add nuxt config file
  const pwaOptions = preparePWAOptions(true, prompts, 'service-worker', {
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
    },
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

  const nuxtConf = prepareNuxtConf(customServiceWorker === true, v4)
  addNuxtModule(nuxtConf, '@vite-pwa/nuxt', 'pwa', pwaOptions)
  fs.writeFileSync(
    path.join(rootPath, 'nuxt.config.ts'),
    generateCode(nuxtConf, MagicastViteOptions).code,
    'utf-8',
  )
}

function createLayout(prompts: PromptsData) {
  const {
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
    const vif = offline
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

function prepareNuxtConfV3(customServiceWorker: boolean): ReturnType<typeof parseModule> {
  return customServiceWorker
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
export default defineNuxtConfig({
  devtools: { enabled: true },
  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
`)
}

function prepareNuxtConfV4(customServiceWorker: boolean): ReturnType<typeof parseModule> {
  return customServiceWorker
    ? parseModule(`// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    tsConfig: {
      exclude: ['../app/service-worker'],
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
export default defineNuxtConfig({
  devtools: { enabled: true },
  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
`)
}

function getPaths(rootPath: string, templateDir: string, v4: boolean): [rootPath: string, templateDir: string] {
  return v4
    ? [path.join(rootPath, 'app'), templateDir.replace('template-custom-nuxt-v4', 'template-custom-nuxt')]
    : [rootPath, templateDir]
}

function prepareNuxtConf(customSW: boolean, v4: boolean): ReturnType<typeof parseModule> {
  return v4 ? prepareNuxtConfV4(customSW) : prepareNuxtConfV3(customSW)
}
