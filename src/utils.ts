type Entry = [name: string, value: string]

export function addPackageObject(
  key: 'scripts' | 'devDependencies' | 'overrides' | 'resolutions',
  entry: Entry[],
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
