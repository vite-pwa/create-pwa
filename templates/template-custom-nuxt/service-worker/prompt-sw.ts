/// <reference lib="WebWorker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING')
    self.skipWaiting()
})

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(
  self.__WB_MANIFEST,
  {
    urlManipulation: ({ url }) => {
      const urls: URL[] = []
      if (url.pathname.endsWith('_payload.json')) {
        const newUrl = new URL(url.href)
        newUrl.search = ''
        urls.push(newUrl)
      }
      return urls
    }
  }
)

// clean old assets
cleanupOutdatedCaches()

/** @type {RegExp[] | undefined} */
let allowlist
// in dev mode, we disable precaching to avoid caching issues
if (import.meta.dev)
  allowlist = [/^\/$/]

// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL('/'),
  { allowlist },
))
