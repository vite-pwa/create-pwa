import { addPackageObject } from './utils'
import type { PromptsData } from './types'

export function includeDependencies(prompts: PromptsData, npmPM: boolean, pkg: any, ignoreDevDependencies = false) {
  const { customServiceWorker, pwaAssets } = prompts
  if (!pwaAssets) {
    addPackageObject(
      'scripts',
      [['generate-pwa-icons', 'pwa-assets-generator']],
      pkg,
      false,
    )
  }

  if (customServiceWorker && !ignoreDevDependencies) {
    addPackageObject(
      'devDependencies',
      [
        ['workbox-core', '^7.1.0'],
        ['workbox-precaching', '^7.1.0'],
        ['workbox-routing', '^7.1.0'],
        ['workbox-strategies', '^7.1.0'],
      ],
      pkg,
    )
  }

  addPackageObject(
    npmPM ? 'overrides' : 'resolutions',
    [['sharp', '0.32.6'], ['sharp-ico', '0.1.5']],
    pkg,
    false,
  )
}
