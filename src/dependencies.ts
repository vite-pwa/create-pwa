import type { PackageJsonEntry, PromptsData } from './types'
import { addPackageObject } from './utils'
import { PWAAssetsVersion, SharpIcoVersion, SharpVersion, WorkboxVersion } from './versions'

export function includeDependencies(
  prompts: PromptsData,
  npmPM: boolean,
  pkg: any,
  ignoreDevDependencies = false,
) {
  const { customServiceWorker, pwaAssets } = prompts
  if (!pwaAssets) {
    addPackageObject(
      'scripts',
      [['generate-pwa-icons', 'pwa-assets-generator']],
      pkg,
      false,
    )
  }

  if (!ignoreDevDependencies) {
    const devDependencies: PackageJsonEntry[] = [
      ['@vite-pwa/assets-generator', PWAAssetsVersion],
      ['workbox-window', WorkboxVersion],
    ]

    if (customServiceWorker && !ignoreDevDependencies) {
      devDependencies.push(
        ['workbox-core', WorkboxVersion],
        ['workbox-precaching', WorkboxVersion],
        ['workbox-routing', WorkboxVersion],
        ['workbox-strategies', WorkboxVersion],
      )
    }

    addPackageObject(
      'devDependencies',
      devDependencies,
      pkg,
    )
  }

  addPackageObject(
    npmPM ? 'overrides' : 'resolutions',
    [['sharp', SharpVersion], ['sharp-ico', SharpIcoVersion]],
    pkg,
    false,
  )
}
