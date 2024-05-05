import { addPackageObject } from './utils'

export function includePwaAssets(npmPM: boolean, pkg: any) {
  addPackageObject(
    'scripts',
    [['generate-pwa-icons', 'pwa-assets-generator']],
    pkg,
    false,
  )
  addPackageObject(
    'devDependencies',
    [['@vite-pwa/assets-generator', '^0.2.4']],
    pkg,
  )
  addPackageObject(
    npmPM ? 'overrides' : 'resolutions',
    [['sharp', '0.32.6'], ['sharp-ico', '0.1.5']],
    pkg,
  )
}
