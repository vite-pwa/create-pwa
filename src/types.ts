export type ColorFunc = (str: string | number) => string

export interface Framework {
  name: string
  display: string
  color: ColorFunc
  variants: FrameworkVariant[]
}

export type FrameworkVariantKey =
  | 'vanilla' | 'vanilla-ts'
  | 'vue' | 'vue-ts' | 'custom-nuxt'
  | 'react' | 'react-ts'
  | 'preact' | 'preact-ts'
  | 'svelte' | 'svelte-ts' | 'custom-svelte-kit'
  | 'solid' | 'solid-ts'
  | 'custom-remix'
  | 'lit' | 'lit-ts'
  | 'custom-qwik-city'

export interface FrameworkVariant {
  name: FrameworkVariantKey
  display: string
  color: ColorFunc
  customCommand?: string
}

export interface Behavior {
  name: string
  display: string
  color: ColorFunc
}

export interface Strategy {
  name: string
  display: string
  color: ColorFunc
}
