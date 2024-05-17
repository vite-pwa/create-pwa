import { blue, cyan, green, lightBlue, lightGreen, lightRed, magenta, red, yellow } from 'kolorist'
import type { Behavior, Framework, Strategy } from './types'

export const FRAMEWORKS = (<Framework[]>[
  {
    name: 'vanilla',
    display: 'Vanilla',
    color: yellow,
    enabled: true,
    variants: [
      {
        name: 'vanilla-ts',
        display: 'TypeScript',
        color: blue,
        enabled: true,
      },
      {
        name: 'vanilla',
        display: 'JavaScript',
        color: yellow,
        enabled: true,
      },
    ],
  },
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    enabled: true,
    variants: [
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: blue,
        enabled: true,
      },
      {
        name: 'vue',
        display: 'JavaScript',
        color: yellow,
        enabled: true,
      },
      /*
            {
              name: 'custom-create-vue',
              display: 'Customize with create-vue ↗',
              color: green,
              customCommand: 'npm create vue@latest TARGET_DIR',
            },
      */
      {
        name: 'custom-nuxt',
        display: 'Nuxt ↗',
        color: lightGreen,
        customCommand: 'npm exec nuxi init TARGET_DIR',
        enabled: true,
      },
      {
        name: 'vitepress-ts',
        display: 'VitePress + TypeScript',
        color: blue,
        enabled: true,
      },
      {
        name: 'vitepress',
        display: 'VitePress + JavaScript',
        color: yellow,
        enabled: true,
      },
    ],
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    enabled: true,
    variants: [
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: blue,
        enabled: true,
      },
      /*
            {
              name: 'react-swc-ts',
              display: 'TypeScript + SWC',
              color: blue,
            },
      */
      {
        name: 'react',
        display: 'JavaScript',
        color: yellow,
        enabled: true,
      },
      /*
            {
              name: 'react-swc',
              display: 'JavaScript + SWC',
              color: yellow,
            },
      */
      {
        name: 'custom-remix',
        display: 'Remix ↗',
        color: cyan,
        customCommand: 'npm create remix@latest TARGET_DIR',
        enabled: true,
      },
    ],
  },
  {
    name: 'preact',
    display: 'Preact',
    color: magenta,
    enabled: true,
    variants: [
      {
        name: 'preact-ts',
        display: 'TypeScript',
        color: blue,
        enabled: true,
      },
      {
        name: 'preact',
        display: 'JavaScript',
        color: yellow,
        enabled: true,
      },
    ],
  },
  {
    name: 'lit',
    display: 'Lit',
    color: lightRed,
    enabled: true,
    variants: [
      {
        name: 'lit-ts',
        display: 'TypeScript',
        color: blue,
        enabled: true,
      },
      {
        name: 'lit',
        display: 'JavaScript',
        color: yellow,
        enabled: true,
      },
    ],
  },
  {
    name: 'svelte',
    display: 'Svelte',
    color: red,
    enabled: true,
    variants: [
      {
        name: 'svelte-ts',
        display: 'TypeScript',
        color: blue,
        enabled: true,
      },
      {
        name: 'svelte',
        display: 'JavaScript',
        color: yellow,
        enabled: true,
      },
      {
        name: 'custom-svelte-kit',
        display: 'SvelteKit ↗',
        color: cyan,
        customCommand: 'npm create svelte@latest TARGET_DIR',
        enabled: true,
      },
    ],
  },
  {
    name: 'solid',
    display: 'Solid',
    color: blue,
    enabled: true,
    variants: [
      {
        name: 'solid-ts',
        display: 'TypeScript',
        color: blue,
        enabled: true,
      },
      {
        name: 'solid',
        display: 'JavaScript',
        color: yellow,
        enabled: true,
      },
    ],
  },
  {
    name: 'qwik',
    display: 'Qwik',
    color: lightBlue,
    variants: [
      /*
      {
        name: 'qwik-ts',
        display: 'TypeScript',
        color: lightBlue,
      },
      {
        name: 'qwik',
        display: 'JavaScript',
        color: yellow,
      },
*/
      {
        name: 'custom-qwik-city',
        display: 'QwikCity ↗',
        color: lightBlue,
        customCommand: 'npm create qwik@latest basic TARGET_DIR',
      },
    ],
  },
/*
  {
    name: 'others',
    display: 'Others',
    color: reset,
    variants: [
      {
        name: 'create-vite-extra',
        display: 'create-vite-extra ↗',
        color: reset,
        customCommand: 'npm create vite-extra@latest TARGET_DIR',
      },
      {
        name: 'create-electron-vite',
        display: 'create-electron-vite ↗',
        color: reset,
        customCommand: 'npm create electron-vite@latest TARGET_DIR',
      },
    ],
  },
*/
]).filter(f => f.enabled)

export const PWA_BEHAVIORS: Behavior[] = [
  {
    name: 'prompt',
    display: 'Prompt for update',
    color: green,
  },
  {
    name: 'claims',
    display: 'Auto update',
    color: blue,
  },
]

export const PWA_STRATEGIES: Strategy[] = [
  {
    name: 'generateSW',
    display: 'generateSW',
    color: green,
  },
  {
    name: 'injectManifest',
    display: 'injectManifest',
    color: blue,
  },
]
