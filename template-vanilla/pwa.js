import { registerSW } from 'virtual:pwa-register'

/**@param app {HTMLDivElement}*/
export function initPWA(app) {
    /**@type {HTMLDivElement}*/
    const pwaToast = app.querySelector('#pwa-toast')
    /**@type {HTMLDivElement}*/
    const pwaToastMessage = pwaToast.querySelector('.message #toast-message')
    /**@type {HTMLButtonElement}*/
    const pwaCloseBtn = pwaToast.querySelector('#pwa-close')
    /**@type {HTMLButtonElement}*/
    const pwaRefreshBtn = pwaToast.querySelector('#pwa-refresh')

    /**@type {(reloadPage?: boolean) => Promise<void>}*/
    let refreshSW

    const refreshCallback = () => refreshSW?.(true)

    /**@param raf {boolean}*/
    function hidePwaToast (raf) {
        if (raf) {
            requestAnimationFrame(() => hidePwaToast(false))
            return
        }
        if (pwaToast.classList.contains('refresh'))
            pwaRefreshBtn.removeEventListener('click', refreshCallback)

        pwaToast.classList.remove('show', 'refresh')
    }
    /**@param offline {boolean}*/
    function showPwaToast(offline) {
        if (!offline)
            pwaRefreshBtn.addEventListener('click', refreshCallback)
        requestAnimationFrame(() => {
            hidePwaToast(false)
            if (!offline)
                pwaToast.classList.add('refresh')
            pwaToast.classList.add('show')
        })
    }

    window.addEventListener('load', () => {
        pwaCloseBtn.addEventListener('click', () => hidePwaToast(true))
        refreshSW = registerSW({
            immediate: true,
            onOfflineReady() {
                // OFFLINE_COMMENT
                pwaToastMessage.innerHTML = 'App ready to work offline'
                showPwaToast(true)
            },
            onNeedRefresh() {
                // PROMPT_COMMENT
                pwaToastMessage.innerHTML = 'New content available, click on reload button to update'
                showPwaToast(false)
            },
        })
    })
}
