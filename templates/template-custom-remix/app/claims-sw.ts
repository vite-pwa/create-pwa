/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { setupRoutes } from "./shared-sw";
import { ssr } from "@vite-pwa/remix/sw";

declare let self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST is the default injection point
const manifest = self.__WB_MANIFEST
if (import.meta.env.DEV) {
  if (ssr) {
    // add the navigateFallback to the manifest
    manifest.push({ url: "/", revision: Math.random().toString() });
  }
}

precacheAndRoute(manifest);

// clean old assets
cleanupOutdatedCaches();

let allowlist: RegExp[] | undefined;
// in dev mode, we disable precaching to avoid caching issues
if (import.meta.env.DEV)
  allowlist = [/^\/$/];

// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL(ssr ? "/" : "index.html"),
  { allowlist },
));

setupRoutes();

self.skipWaiting();
clientsClaim();
