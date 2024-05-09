import fs from 'node:fs'
import type { PackageJsonEntry } from './types'

export function addPackageObject(
  key: 'scripts' | 'dependencies' | 'devDependencies' | 'overrides' | 'resolutions',
  entry: PackageJsonEntry[],
  pkg: any,
  sort = true,
) {
  pkg[key] ??= {}
  if (!sort) {
    for (const [name, value] of entry)
      pkg[key][name] = value

    return
  }

  const entries = Object.entries(pkg[key])
  pkg[key] = {}
  entry.forEach(([name, value]) => {
    entries.push([name, value])
  })
  entries.sort(([a], [b]) => a.localeCompare(b)).forEach(([k, v]) => {
    pkg[key][k] = v
  })
}

export function editFile(file: string, callback: (content: string) => string) {
  const content = fs.readFileSync(file, 'utf-8')
  fs.writeFileSync(file, callback(content), 'utf-8')
}
