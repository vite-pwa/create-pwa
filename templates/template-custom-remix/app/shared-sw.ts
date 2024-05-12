import { dynamicRoutes, staticRoutes } from '@vite-pwa/remix/sw'
import { registerRoute } from 'workbox-routing'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'

export function setupRoutes() {
  // disable precaching in dev
  if (import.meta.env.PROD) {
    const baseUrl = import.meta.env.BASE_URL
    const useStaticRoutes = staticRoutes.reduce((acc, r) => {
      acc.push(`(${r.path!})`)
      return acc
    }, [] as string[])
    const useDynamicRoutes = dynamicRoutes.reduce((acc, r) => {
      acc.push(r.path!)
      return acc
    }, [] as string[])
    if (useStaticRoutes.length) {
      const staticRoutesRegexp = new RegExp(`^${baseUrl}(${useStaticRoutes.join('|')})$`)
      registerRoute(
        ({ request, sameOrigin, url }) => request.destination === 'document' && sameOrigin && staticRoutesRegexp.test(url.pathname),
        new StaleWhileRevalidate({
          cacheName: 'static-pages',
          matchOptions: {
            ignoreVary: true,
            ignoreSearch: true,
            ignoreMethod: true,
          },
          plugins: [
            new CacheableResponsePlugin({
              statuses: [200],
            }),
          ],
        }),
        'GET',
      )
    }
    if (useDynamicRoutes.length) {
      const dynamicRoutesRegexp = new RegExp(`^${baseUrl}(${useDynamicRoutes.map((r) => {
        const parts = r.split('/')
        parts.forEach((part, i) => {
          if (part.startsWith(':'))
            parts[i] = '([^/]+)'
        })
        return `(${parts.join('/')})`
      }).join('|')})$`)
      registerRoute(
        ({ request, sameOrigin, url }) => request.destination === 'document' && sameOrigin && dynamicRoutesRegexp.test(url.pathname),
        new NetworkOnly({
          plugins: [{
            handlerDidError: async ({ state, error }) => {
              console.log(state, error)
              return Response.redirect('/', 302)
            },
          }],
        }),
      )
    }
  }
}
