import { addPackageObject } from './utils'
import type { PackageJsonEntry, PromptsData } from './types'

export function includeDependencies(prompts: PromptsData, npmPM: boolean, pkg: any) {
  const { customServiceWorker, pwaAssets } = prompts
  if (!pwaAssets) {
    addPackageObject(
      'scripts',
      [['generate-pwa-icons', 'pwa-assets-generator']],
      pkg,
      false,
    )
  }
  const dependencies: PackageJsonEntry[] = [['@vite-pwa/assets-generator', '^0.2.4'], ['workbox-window', '^7.1.0']]
  if (customServiceWorker) {
    dependencies.push(
      ['workbox-core', '^7.1.0'],
      ['workbox-precaching', '^7.1.0'],
      ['workbox-routing', '^7.1.0'],
      ['workbox-strategies', '^7.1.0'],
    )
  }

  addPackageObject(
    'devDependencies',
    dependencies,
    pkg,
  )
  addPackageObject(
    npmPM ? 'overrides' : 'resolutions',
    [['sharp', '0.32.6'], ['sharp-ico', '0.1.5']],
    pkg,
  )
}
