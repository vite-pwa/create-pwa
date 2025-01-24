import type { PackageJsonEntry, PromptsData } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateCode, parseModule } from 'magicast'
import { addVitePlugin } from 'magicast/helpers'
import { detect } from 'package-manager-detector'
import { includeDependencies } from '../dependencies'
import { preparePWAOptions } from '../pwa'
import { addPackageObject, editFile } from '../utils'
import { PWAAssetsVersion, SvelteKitPWAVersion, VitePluginPWAVersion, WorkboxVersion } from '../versions'
import { MagicastSvelteKitOptions } from '../vite'

export async function customize(prompts: PromptsData) {
  const {
    cdProjectName,
    templateDir,
    rootPath,
    prompt,
    customServiceWorker,
    pwaAssets,
  } = prompts

  const ts = fs.existsSync(path.resolve(rootPath, 'tsconfig.json'))
  const jsTs = fs.existsSync(path.resolve(rootPath, 'jsconfig.json'))

  // add pwa types to src/app.d.ts
  if (ts || jsTs) {
    const appDts = fs.readFileSync(path.resolve(rootPath, 'src', 'app.d.ts'), 'utf-8')
    fs.writeFileSync(
      path.resolve(rootPath, 'src', 'app.d.ts'),
      `import 'vite-plugin-pwa/svelte';
import 'vite-plugin-pwa/info';
import 'vite-plugin-pwa/pwa-assets';

${appDts}`,
      'utf-8',
    )
  }

  // remove the favicon link from src/app.html
  const appHtml = fs.readFileSync(path.resolve(rootPath, 'src', 'app.html'), 'utf-8')
  fs.writeFileSync(
    path.resolve(rootPath, 'src', 'app.html'),
    appHtml.replace('<link rel="icon" href="%sveltekit.assets%/favicon.png" />', ''),
    'utf-8',
  )

  // remove static/favicon.png
  fs.rmSync(path.resolve(rootPath, 'static', 'favicon.png'))

  // copy static/favicon.svg
  fs.copyFileSync(
    path.resolve(templateDir, 'static', 'favicon.svg'),
    path.resolve(rootPath, 'static', 'favicon.svg'),
  )

  // copy/override src/routes/+layout.svelte
  const existsLayout = fs.existsSync(path.resolve(rootPath, 'src', 'routes', '+layout.svelte'))
  const layoutFile = path.resolve(rootPath, 'src', 'routes', '+layout.svelte')
  fs.copyFileSync(
    path.resolve(templateDir, 'src', 'routes', `${existsLayout ? 'app-layout' : 'layout'}.svelte`),
    layoutFile,
  )

  if (ts) {
    editFile(layoutFile, (content) => {
      content = content.replace(/<script>/, '<script lang="ts">')
      return content.replace('let { children } = $props();', `
    interface Props {
      children?: import('svelte').Snippet;
    }  
    let { children }: Props = $props();`)
    })
  }

  // copy/override src/routes/+page.ts for base and lib templates
  fs.copyFileSync(
    path.resolve(templateDir, 'src', 'routes', '+page.ts'),
    path.resolve(rootPath, 'src', 'routes', `+page.${ts ? 't' : 'j'}s`),
  )

  // copy src/lib/PWABadge.svelte
  copyPWABadge(ts, jsTs, prompts)

  // copy pwa-assets.config.ts
  fs.copyFileSync(
    path.resolve(templateDir, 'pwa-assets.config.ts'),
    path.resolve(rootPath, `pwa-assets.config.${ts ? 't' : 'j'}s`),
  )

  if (customServiceWorker) {
    // override svelte.config.js: SvelteKit shouldn't register the service worker
    fs.copyFileSync(
      path.resolve(templateDir, 'svelte.config.js'),
      path.resolve(rootPath, 'svelte.config.js'),
    )
    // copy custom service worker
    if (prompt) {
      fs.copyFileSync(
        path.resolve(templateDir, 'src', `prompt-sw.${ts ? 't' : 'j'}s`),
        path.resolve(rootPath, 'src', `service-worker.${ts ? 't' : 'j'}s`),
      )
    }
    else {
      fs.copyFileSync(
        path.resolve(templateDir, 'src', `claims-sw.${ts ? 't' : 'j'}s`),
        path.resolve(rootPath, 'src', `service-worker.${ts ? 't' : 'j'}s`),
      )
    }
  }

  // override vite.config content
  writeViteConfig(rootPath, ts, existsLayout, prompts)

  // prepare package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(rootPath, 'package.json'), 'utf-8'))

  // devDependencies
  pkg.devDependencies ??= {}
  const devDependencies: PackageJsonEntry[] = [
    ['@vite-pwa/assets-generator', PWAAssetsVersion],
    ['@vite-pwa/sveltekit', SvelteKitPWAVersion],
    ['vite-plugin-pwa', VitePluginPWAVersion],
    ['workbox-window', WorkboxVersion],
  ]
  if (customServiceWorker) {
    devDependencies.push(
      ['workbox-core', WorkboxVersion],
      ['workbox-precaching', WorkboxVersion],
      ['workbox-routing', WorkboxVersion],
      ['workbox-strategies', WorkboxVersion],
    )
  }
  addPackageObject('devDependencies', devDependencies, pkg, true)

  const pkgManager = await detect({
    cwd: rootPath,
  }).then(res => res?.name || 'npm')
  // script + resolutions: ignoring dev dependencies
  includeDependencies(prompts, pkgManager === 'npm', pkg, true)

  // save package.json
  fs.writeFileSync(path.join(rootPath, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8')

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

function copyPWABadge(ts: boolean, jsTs: boolean, prompts: PromptsData) {
  const {
    templateDir,
    rootPath,
    reloadSW,
    offline,
  } = prompts
  // copy src/lib/PWABadge.svelte
  let pwaBadge = fs.readFileSync(
    path.join(templateDir, 'src', 'lib', `PWABadge-${ts ? 't' : 'j'}s.svelte`),
    'utf-8',
  )
  if (!ts && !jsTs) {
    pwaBadge = pwaBadge.replace('<script>', `<script>
  /// <reference types="vite-plugin-pwa/svelte" />
`)
  }

  if (!offline) {
    pwaBadge = pwaBadge
      .replace(
        'const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({',
        'const { needRefresh, updateServiceWorker } = useRegisterSW({',
      )
      .replace('offlineReady.set(false)', '')
      .replace(
        'let toast = $derived($offlineReady || $needRefresh)',
        'let toast = $derived($needRefresh)',
      )
      .replace(
        'let message = $derived($offlineReady ? \'App ready to work offline\' : ($needRefresh ? \'New content available, click on reload button to update.\' : \'\'))',
        'let message = $derived($needRefresh ? \'New content available, click on reload button to update.\' : \'\')',
      )
  }

  if (reloadSW) {
    pwaBadge = pwaBadge
      .replace('PERIODIC_SYNC_COMMENT', 'check for updates every hour')
      .replace('const period = 0', 'const period = 60 * 60 * 1000')
  }
  else {
    pwaBadge = pwaBadge.replace('PERIODIC_SYNC_COMMENT', `periodic sync is disabled, change the value to enable it, the period is in milliseconds
  // You can remove onRegisteredSW callback and registerPeriodicSync function`)
  }

  fs.writeFileSync(
    path.resolve(rootPath, 'src', 'lib', 'PWABadge.svelte'),
    pwaBadge,
    'utf-8',
  )
  return pwaBadge
}

function writeViteConfig(rootPath: string, ts: boolean, addWoff: boolean, prompts: PromptsData) {
  const viteConf = parseModule(`
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [
    sveltekit()
  ]
})
`)

  const globPatterns = addWoff
    ? ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
    : ['client/**/*.{js,css,ico,png,svg,webp}']

  addVitePlugin(viteConf, {
    from: '@vite-pwa/sveltekit',
    imported: 'SvelteKitPWA',
    constructor: 'SvelteKitPWA',
    options: preparePWAOptions(
      ts,
      prompts,
      'src',
      {
        swName: 'service-worker',
        workbox: {
          globPatterns,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
        injectManifest: {
          globPatterns,
        },
        devOptions: {
          enabled: false,
          suppressWarnings: true,
          navigateFallback: '/',
          navigateFallbackAllowlist: [/^\/$/],
          type: 'module',
        },
      },
    ),
  })
  editFile(`${rootPath}/vite.config.${ts ? 't' : 'j'}s`, () => {
    return generateCode(viteConf, MagicastSvelteKitOptions).code
  })
}
