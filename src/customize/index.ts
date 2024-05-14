import type { PromptsData } from '../types'

export async function customize(prompts: PromptsData) {
  const { framework } = prompts
  switch (framework) {
    case 'vanilla':
    case 'vanilla-ts':
      await import('./vanilla').then(({ customize }) => customize(prompts))
      break
    case 'lit':
    case 'lit-ts':
      await import('./lit').then(({ customize }) => customize(prompts))
      break
    case 'vue':
    case 'vue-ts':
      await import('./vue').then(({ customize }) => customize(prompts))
      break
    case 'vitepress':
    case 'vitepress-ts':
      await import('./vitepress').then(({ customize }) => customize(prompts))
      break
    case 'react':
    case 'react-ts':
      await import('./react').then(({ customize }) => customize(prompts))
      break
    case 'preact':
    case 'preact-ts':
      await import('./preact').then(({ customize }) => customize(prompts))
      break
    case 'solid':
    case 'solid-ts':
      await import('./solid').then(({ customize }) => customize(prompts))
      break
    case 'svelte':
    case 'svelte-ts':
      await import('./svelte').then(({ customize }) => customize(prompts))
      break
    case 'custom-nuxt':
      await import('./nuxt').then(({ customize }) => customize(prompts))
      break
    case 'custom-remix':
      await import('./remix').then(({ customize }) => customize(prompts))
      break
    case 'custom-svelte-kit':
      await import('./sveltekit').then(({ customize }) => customize(prompts))
      break
    case 'custom-qwik-city':
      await import('./qwik').then(({ customize }) => customize(prompts))
      break
  }
}
