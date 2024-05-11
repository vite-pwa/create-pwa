import { addPackageObject } from './utils'
import type { PromptsData } from './types'
import { SharpIcoVersion, SharpVersion, WorkboxVersion } from './versions'

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
        ['workbox-core', WorkboxVersion],
        ['workbox-precaching', WorkboxVersion],
        ['workbox-routing', WorkboxVersion],
        ['workbox-strategies', WorkboxVersion],
      ],
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
