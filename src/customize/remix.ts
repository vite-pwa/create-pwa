import type { PackageJsonEntry, PromptsData } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateCode, parseModule } from 'magicast'
import { addVitePlugin } from 'magicast/helpers'
import { includeDependencies } from '../dependencies'
import { preparePWAOptions } from '../pwa'
import { addPackageObject, editFile } from '../utils'
import { PWAAssetsVersion, RemixPWAVersion, VitePluginPWAVersion, WorkboxVersion } from '../versions'
import { MagicastRemixOptions } from '../vite'

export function customize(prompts: PromptsData) {
  const {
    cdProjectName,
    rootPath,
    pkgManager,
    templateDir,
    customServiceWorker,
    prompt,
    pwaAssets,
    name,
    description,
  } = prompts

  // remove public/favicon.png
  fs.rmSync(path.resolve(rootPath, 'public', 'favicon.ico'))

  // copy public/favicon.svg
  fs.copyFileSync(
    path.resolve(templateDir, 'public', 'favicon.svg'),
    path.resolve(rootPath, 'public', 'favicon.svg'),
  )

  // update app/routes/_index.tsx
  editFile(path.resolve(rootPath, 'app', 'routes', '_index.tsx'), (content) => {
    return content
      .replace('"New Remix App"', `"${name}"`)
      .replace('{ name: "description", content: "Welcome to Remix!" },', `{ name: "description", content: "${description || name}!" },`)
      .replace('<h1>Welcome to Remix</h1>', `<h1>Welcome to ${name}</h1>`)
  })

  // copy components
  copyComponents(prompts)

  // override app/root.tsx
  fs.copyFileSync(
    path.resolve(templateDir, 'app', 'root.tsx'),
    path.resolve(rootPath, 'app', 'root.tsx'),
  )

  // copy pwa-assets.config.ts
  fs.copyFileSync(
    path.resolve(templateDir, 'pwa-assets.config.ts'),
    path.resolve(rootPath, 'pwa-assets.config.ts'),
  )

  if (customServiceWorker) {
    // copy app/shared-sw.ts
    fs.copyFileSync(
      path.resolve(templateDir, 'app', 'shared-sw.ts'),
      path.resolve(rootPath, 'app', 'shared-sw.ts'),
    )
    // copy custom service worker
    if (prompt) {
      fs.copyFileSync(
        path.resolve(templateDir, 'app', 'prompt-sw.ts'),
        path.resolve(rootPath, 'app', 'sw.ts'),
      )
    }
    else {
      fs.copyFileSync(
        path.resolve(templateDir, 'app', 'claims-sw.ts'),
        path.resolve(rootPath, 'app', 'sw.ts'),
      )
    }
  }

  // override vite.config content
  writeViteConfig(rootPath, prompts)

  // add types to tsconfig.json
  editFile(path.resolve(rootPath, 'tsconfig.json'), (content) => {
    // remove noEmit comment and parse content
    const tsConfig = JSON.parse(content.split('\n').filter(l => !l.trim().startsWith('//')).join('\n'))
    tsConfig.compilerOptions ??= {}
    tsConfig.compilerOptions.types ??= []
    tsConfig.compilerOptions.types.push(
      'vite-plugin-pwa/info',
      'vite-plugin-pwa/pwa-assets',
      'vite-plugin-pwa/react',
      '@vite-pwa/remix',
      '@vite-pwa/remix/remix-sw',
    )
    // stringify and return JSON adding back noEmit comment
    return JSON
      .stringify(tsConfig, null, 2)
      .replace(
        '"noEmit": true',
        `// Vite takes care of building everything, not tsc.
    "noEmit": true`,
      )
  })

  // prepare package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(rootPath, 'package.json'), 'utf-8'))

  // devDependencies
  pkg.devDependencies ??= {}
  const devDependencies: PackageJsonEntry[] = [
    ['@vite-pwa/assets-generator', PWAAssetsVersion],
    ['@vite-pwa/remix', RemixPWAVersion],
    ['vite-plugin-pwa', VitePluginPWAVersion],
    ['workbox-window', WorkboxVersion],
  ]
  if (customServiceWorker) {
    devDependencies.push(
      ['workbox-core', WorkboxVersion],
      ['workbox-cacheable-response', WorkboxVersion],
      ['workbox-precaching', WorkboxVersion],
      ['workbox-routing', WorkboxVersion],
      ['workbox-strategies', WorkboxVersion],
    )
  }
  addPackageObject('devDependencies', devDependencies, pkg, true)
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

function copyComponents(prompts: PromptsData) {
  const {
    templateDir,
    rootPath,
    reloadSW,
    offline,
  } = prompts
  // create app/components folder
  fs.mkdirSync(path.resolve(rootPath, 'app', 'components'), { recursive: true })
  // copy app/components/PWAManifest.tsx
  fs.copyFileSync(
    path.resolve(templateDir, 'app', 'components', 'PWAManifest.tsx'),
    path.resolve(rootPath, 'app', 'components', 'PWAManifest.tsx'),
  )
  // copy app/components/PWAAssets.tsx
  fs.copyFileSync(
    path.resolve(templateDir, 'app', 'components', 'PWAAssets.tsx'),
    path.resolve(rootPath, 'app', 'components', 'PWAAssets.tsx'),
  )
  // copy app/components/PWABadge.css
  fs.copyFileSync(
    path.resolve(templateDir, 'app', 'components', 'PWABadge.css'),
    path.resolve(rootPath, 'app', 'components', 'PWABadge.css'),
  )
  // copy app/components/PWABadge.tsx
  let pwaBadge = fs.readFileSync(
    path.join(templateDir, 'app', 'components', `PWABadge.tsx`),
    'utf-8',
  )

  if (!offline) {
    pwaBadge = pwaBadge
      .replace(
        'offlineReady: [offlineReady, setOfflineReady],',
        '',
      )
      .replace('setOfflineReady(false)', '')
      .replace(
        '(offlineReady || needRefresh)',
        'needRefresh',
      )
      .replace(
        '{ offlineReady',
        '<span id="toast-message">New content available, click on reload button to update.</span>',
      )
      .replace(
        '? <span id="toast-message">App ready to work offline</span>',
        '',
      )
      .replace(
        ': <span id="toast-message">New content available, click on reload button to update.</span>}',
        '',
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
    path.resolve(rootPath, 'app', 'components', 'PWABadge.tsx'),
    pwaBadge,
    'utf-8',
  )
  return pwaBadge
}

function writeViteConfig(rootPath: string, prompts: PromptsData) {
  const viteConf = parseModule(`
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { RemixVitePWA } from "@vite-pwa/remix";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

const { RemixVitePWAPlugin, RemixPWAPreset } = RemixVitePWA();

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      presets: [RemixPWAPreset()],
    }),
    tsconfigPaths(),
  ],
});  
`)

  const globPatterns = ['**/*.{js,html,css,png,svg,ico}']

  addVitePlugin(viteConf, {
    from: '@vite-pwa/remix',
    constructor: 'RemixVitePWAPlugin',
    options: preparePWAOptions(
      true,
      prompts,
      'app',
      {
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
  editFile(`${rootPath}/vite.config.ts`, () => {
    return generateCode(viteConf, MagicastRemixOptions).code.replace('import RemixVitePWAPlugin, ', 'import ')
  })
}
