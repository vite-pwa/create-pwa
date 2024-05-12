import { pwaAssetsHead } from "virtual:pwa-assets/head"
import { PWAManifest } from "./PWAManifest"

export function PWAAssets() {
  return (
    <>
      {pwaAssetsHead.themeColor
        ? (
          <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
          )
        : null}
      {pwaAssetsHead.links.map(({ href, ...link }) => (
        <link key={href} href={href} {...link} />
      ))}
      <PWAManifest />
    </>
  )
}
