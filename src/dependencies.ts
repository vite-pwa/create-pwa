import { addPackageObject } from './utils'

export function includeDependencies(npmPM: boolean, pkg: any) {
  addPackageObject(
    'scripts',
    [['generate-pwa-icons', 'pwa-assets-generator']],
    pkg,
    false,
  )
  addPackageObject(
    'devDependencies',
    [['@vite-pwa/assets-generator', '^0.2.4'], ['workbox-window', '^7.1.0']],
    pkg,
  )
  addPackageObject(
    npmPM ? 'overrides' : 'resolutions',
    [['sharp', '0.32.6'], ['sharp-ico', '0.1.5']],
    pkg,
  )
}
