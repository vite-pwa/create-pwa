import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import spawn from 'cross-spawn'
import minimist from 'minimist'
import prompts from 'prompts'
import {
  red,
  reset,
} from 'kolorist'
import { includeDependencies } from './dependencies'
import type { Framework, FrameworkVariantKey, PromptsData } from './types'
import { FRAMEWORKS, PWA_BEHAVIORS, PWA_STRATEGIES } from './prompts'
import { editFile } from './utils'

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = minimist<{
  t?: string
  template?: string
}>(process.argv.slice(2), { string: ['_'] })
const cwd = process.cwd()

const TEMPLATES = FRAMEWORKS.map(
  f => (f.variants && f.variants.map(v => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), [])

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
}

const defaultTargetDir = 'vite-project'

async function init() {
  const argTargetDir = formatTargetDir(argv._[0])
  const argTemplate = argv.template || argv.t

  let targetDir = argTargetDir || defaultTargetDir
  const getProjectName = () =>
    targetDir === '.' ? path.basename(path.resolve()) : targetDir

  let result: prompts.Answers<
        'projectName' | 'overwrite' | 'packageName' | 'framework' | 'variant' | 'pwaName' | 'pwaShortName' | 'pwaDescription' | 'themeColor' | 'strategy' | 'behavior' | 'reloadSW' | 'offline' | 'pwaAssets' | 'installPWA'
    >

  prompts.override({
    overwrite: argv.overwrite,
  })

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          },
        },
        {
          type: () => !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'select',
          name: 'overwrite',
          message: () =>
            `${targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`
                         } is not empty. Please choose how to proceed:`,
          initial: 0,
          choices: [
            {
              title: 'Remove existing files and continue',
              value: 'yes',
            },
            {
              title: 'Cancel operation',
              value: 'no',
            },
            {
              title: 'Ignore files and continue',
              value: 'ignore',
            },
          ],
        },
        {
          type: (_, { overwrite }: { overwrite?: string }) => {
            if (overwrite === 'no')
              throw new Error(`${red('✖')} Operation cancelled`)

            return null
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: dir =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type: argTemplate && TEMPLATES.includes(argTemplate as any) ? null : 'select',
          name: 'framework',
          message: typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate as any)
            ? reset(
              `"${argTemplate}" isn't a valid template. Please choose from below: `,
            )
            : reset('Select a framework:'),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework,
            }
          }),
        },
        {
          type: (framework: Framework) => framework && framework.variants?.filter(v => v.enabled) ? 'select' : null,
          name: 'variant',
          message: reset('Select a variant:'),
          choices: (framework: Framework) =>
            framework.variants.filter(v => v.enabled).map((variant) => {
              const variantColor = variant.color
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name,
              }
            }),
        },
        {
          type: 'text',
          name: 'pwaName',
          message: reset('PWA Name:'),
          initial: () => getProjectName(),
          validate: (name: string) => name.length > 0 || 'PWA Name is required',
        },
        {
          type: 'text',
          name: 'pwaShortName',
          message: reset('PWA Short Name:'),
          initial: () => getProjectName(),
          validate: (name: string) => name.length > 0 || 'PWA Short Name is required',
        },
        {
          type: 'text',
          name: 'pwaDescription',
          message: reset('PWA Description:'),
        },
        {
          type: 'text',
          name: 'themeColor',
          message: reset('Theme color:'),
          initial: '#ffffff',
          validate: (color: string) => /^#[0-9A-F]{6}$/i.test(color) || 'Invalid color',
        },
        {
          type: 'select',
          name: 'strategy',
          message: reset('Select a strategy:'),
          initial: 0,
          choices: PWA_STRATEGIES.map((strategy) => {
            const strategyColor = strategy.color
            return {
              title: strategyColor(strategy.name),
              value: strategy,
            }
          }),
        },
        {
          type: 'select',
          name: 'behavior',
          message: reset('Select a behavior:'),
          initial: 0,
          choices: PWA_BEHAVIORS.map((behavior) => {
            const behaviorColor = behavior.color
            return {
              title: behaviorColor(behavior.display),
              value: behavior,
            }
          }),
        },
        {
          type: 'toggle',
          name: 'reloadSW',
          message: reset('Enable periodic SW updates?'),
          initial: false,
          active: 'yes',
          inactive: 'no',
        },
        {
          type: 'toggle',
          name: 'offline',
          message: reset('Show offline ready prompt?'),
          initial: false,
          active: 'yes',
          inactive: 'no',
        },
        {
          type: 'toggle',
          name: 'pwaAssets',
          message: reset('Generate PWA Assets Icons on the fly?'),
          initial: true,
          active: 'yes',
          inactive: 'no',
        },
        {
          type: (_, { variant }) => variant === 'custom-nuxt' ? 'toggle' : null,
          name: 'installPWA',
          message: reset('Add PWA Install Prompt?'),
          initial: false,
          active: 'yes',
          inactive: 'no',
        },
      ],
      {
        onCancel: () => {
          throw new Error(`${red('✖')} Operation cancelled`)
        },
      },
    )
  }
  catch (cancelled: any) {
    console.log(cancelled.message)
    return
  }

  // user choice associated with prompts
  const {
    framework,
    overwrite,
    packageName,
    pwaName,
    pwaShortName,
    pwaDescription,
    themeColor,
    variant,
    behavior,
    reloadSW,
    strategy,
    offline,
    pwaAssets,
    installPWA,
  } = result

  const root = path.join(cwd, targetDir)

  if (overwrite === 'yes')
    emptyDir(root)
  else if (!fs.existsSync(root))
    fs.mkdirSync(root, { recursive: true })

  // determine template
  let template: string = variant || framework?.name || argTemplate
  let isReactSwc = false
  if (template.includes('-swc')) {
    isReactSwc = true
    template = template.replace('-swc', '')
  }

  const cdProjectName = path.relative(cwd, root)

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
      `templates/template-${template}`,
  )

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  const promptsData: PromptsData = {
    cdProjectName,
    templateDir,
    rootPath: root,
    name: pwaName,
    shortName: pwaShortName,
    description: pwaDescription,
    themeColor,
    framework: template as FrameworkVariantKey,
    customServiceWorker: strategy.name === 'injectManifest',
    prompt: behavior.name === 'prompt',
    offline,
    reloadSW,
    pwaAssets,
    installPWA,
    pkgManager,
  }

  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.')

  const { customCommand } = FRAMEWORKS.flatMap(f => f.variants).find(v => v.name === template) ?? {}

  if (customCommand) {
    const fullCustomCommand = customCommand
      .replace(/^npm create /, () => {
        // `bun create` uses it's own set of templates,
        // the closest alternative is using `bun x` directly on the package
        if (pkgManager === 'bun')
          return 'bun x create-'

        return `${pkgManager} create `
      })
    // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace('@latest', () => (isYarn1 ? '' : '@latest'))
      .replace(/^npm exec/, () => {
        // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
        if (pkgManager === 'pnpm')
          return 'pnpm dlx'

        if (pkgManager === 'yarn' && !isYarn1)
          return 'yarn dlx'

        if (pkgManager === 'bun')
          return 'bun x'

        // Use `npm exec` in all other cases,
        // including Yarn 1.x and other custom npm clients.
        return 'npm exec'
      })

    const [command, ...args] = fullCustomCommand.split(' ')
    // we replace TARGET_DIR here because targetDir may include a space
    const replacedArgs = args.map(arg => arg.replace('TARGET_DIR', targetDir))
    console.log(replacedArgs)
    const { status } = spawn.sync(command, replacedArgs, {
      stdio: 'inherit',
    })
    status === 0 && await import('./customize').then(({ customize }) => customize(promptsData))
    process.exit(status ?? 0)
  }

  console.log(`\nScaffolding project in ${root}...`)

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content)
      fs.writeFileSync(targetPath, content)
    else
      copy(path.join(templateDir, file), targetPath)
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter(f => f !== 'package.json'))
    write(file)

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'),
  )

  pkg.name = packageName || getProjectName()

  includeDependencies(promptsData, pkgManager === 'npm', pkg)

  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  await import('./customize').then(({ customize }) => customize(promptsData))

  if (isReactSwc)
    setupReactSwc(root, template.endsWith('-ts'))

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
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

function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory())
    copyDir(src, dest)
  else
    fs.copyFileSync(src, dest)
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir))
    return

  for (const file of fs.readdirSync(dir)) {
    if (file === '.git')
      continue

    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent)
    return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

function setupReactSwc(root: string, isTs: boolean) {
  editFile(path.resolve(root, 'package.json'), (content) => {
    return content.replace(
      /"@vitejs\/plugin-react": ".+?"/,
            `"@vitejs/plugin-react-swc": "^3.5.0"`,
    )
  })
  editFile(
    path.resolve(root, `vite.config.${isTs ? 'ts' : 'js'}`),
    (content) => {
      return content.replace('@vitejs/plugin-react', '@vitejs/plugin-react-swc')
    },
  )
}

init().catch((e) => {
  console.error(e)
})
