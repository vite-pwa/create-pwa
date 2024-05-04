type Entry = [name: string, value: string]

export function addPackageObject(
  key: 'scripts' | 'devDependencies' | 'overrides' | 'resolutions',
  entry: Entry | Entry[],
  pkg: any,
  sort = true,
) {
  pkg[key] ??= {}
  if (!sort) {
    if (Array.isArray(entry)) {
      for (const [name, value] of entry)
        pkg[key][name] = value

      return
    }
    else {
      pkg[key][entry[0]] = entry[1]
    }
    return
  }

  const entries = Object.entries(pkg[key])
  pkg[key] = {}
  if (Array.isArray(entry)) {
    entry.forEach(([name, value]) => {
      entries.push([name, value])
    })
  }
  else {
    entries.push(entry)
  }
  entries.sort(([a], [b]) => a.localeCompare(b)).forEach(([k, v]) => {
    pkg[key][k] = v
  })
}
