import { dynamicRoutes, navigateFallback, ssr, staticRoutes } from "virtual:vite-pwa/remix/sw";
import { registerRoute } from "workbox-routing";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";

export function setupRoutes() {
  // disable precaching in dev
  if (import.meta.env.PROD) {
    const baseUrl = import.meta.env.BASE_URL;
    const useStaticRoutes = staticRoutes.reduce((acc, r) => {
      acc.push(`(${r.path!})`);
      return acc;
    }, [] as string[]);
    const useDynamicRoutes = dynamicRoutes.reduce((acc, r) => {
      acc.push(r.path!);
      return acc;
    }, [] as string[]);
    if (useStaticRoutes.length) {
      const staticRoutesRegexp = new RegExp(`^${baseUrl}(${useStaticRoutes.join("|")})$`);
      registerRoute(
        ({ request, sameOrigin, url }) => request.destination === "document" && sameOrigin && staticRoutesRegexp.test(url.pathname),
        new StaleWhileRevalidate({
          cacheName: "static-pages",
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
        "GET",
      );
    }
    const redirect = ssr ? (navigateFallback ?? "/"): "index.html";
    if (useDynamicRoutes.length) {
      const dynamicRoutesRegexp = new RegExp(`^${baseUrl}(${useDynamicRoutes.map((r) => {
        const parts = r.split("/");
        parts.forEach((part, i) => {
          if (part.startsWith(":"))
            parts[i] = "([^/]+)";
        })
        return `(${parts.join("/")})`;
      }).join("|")})$`);
      registerRoute(
        ({ request, sameOrigin, url }) => request.destination === "document" && sameOrigin && dynamicRoutesRegexp.test(url.pathname),
        new NetworkOnly({
          plugins: [{
            handlerDidError: async ({ state, error }) => {
              console.log(state, error)
              return Response.redirect(redirect, 302)
            },
          }],
        }),
      );
    }

    // when requesting a missing page:
    // - when offline, this handler will redirect to the fallback page
    // - when online, the remix app should handler 404 properly
    registerRoute(
        ({ request, sameOrigin }) => request.destination === "document" && sameOrigin,
        new NetworkOnly({
          plugins: [{
            handlerDidError: async ({ state, error }) => {
              console.log(state, error)
              return Response.redirect(redirect, 302)
            },
          }],
        }),
    );
  }
}
