import type { GenerateOptions } from 'magicast'

export const MagicastViteOptions = {
  trailingComma: true,
  quote: 'single',
  arrayBracketSpacing: false,
  objectCurlySpacing: true,
  lineTerminator: '\n',
  format: {
    trailingComma: true,
    quote: 'single',
    arrayBracketSpacing: false,
    objectCurlySpacing: true,
    useSemi: false,
  },
} satisfies GenerateOptions

export const MagicastSvelteKitOptions = {
  trailingComma: false,
  quote: 'single',
  arrayBracketSpacing: false,
  objectCurlySpacing: true,
  lineTerminator: '\n',
  format: {
    trailingComma: false,
    quote: 'single',
    arrayBracketSpacing: false,
    objectCurlySpacing: true,
    useSemi: true,
  },
} satisfies GenerateOptions
