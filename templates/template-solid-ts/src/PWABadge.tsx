import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { useRegisterSW } from 'virtual:pwa-register/solid'

import styles from './PWABadge.module.css'

const PWABadge: Component = () => {
  // PERIODIC_SYNC_COMMENT
  const period = 0

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return
      if (r?.active?.state === 'activated') {
        registerPeriodicSync(period, swUrl, r)
      }
      else if (r?.installing) {
        r.installing.addEventListener('statechange', (e) => {
          const sw = e.target as ServiceWorker
          if (sw.state === 'activated')
            registerPeriodicSync(period, swUrl, r)
        })
      }
    },
  })

  function close() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div class={styles.Container} role="alert" aria-labelledby="toast-message"><!-- @BEGIN -->
      <Show when={offlineReady() || needRefresh()}>
        <div class={styles.Toast}>
          <div class={styles.Message}>
            <Show
                fallback={<span id="toast-message">New content available, click on reload button to update.</span>}
                when={offlineReady()}
            >
              <span id="toast-message">App ready to work offline</span>
            </Show>
          </div>
          <div>
            <Show when={needRefresh()}>
              <button class={styles.ToastButton} onClick={() => updateServiceWorker(true)}>Reload</button>
            </Show>
            <button class={styles.ToastButton} onClick={() => close()}>Close</button>
          </div>
        </div>
      </Show><!-- @END -->
    </div>
  )
}

export default PWABadge

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(period: number, swUrl: string, r: ServiceWorkerRegistration) {
  if (period <= 0) return

  setInterval(async () => {
    if ('onLine' in navigator && !navigator.onLine)
      return

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        'cache': 'no-store',
        'cache-control': 'no-cache',
      },
    })

    if (resp?.status === 200)
      await r.update()
  }, period)
}
