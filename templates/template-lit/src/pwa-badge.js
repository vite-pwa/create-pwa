import { LitElement, css, html } from 'lit'
import { registerSW } from 'virtual:pwa-register'

/**
 * PWA Badge element.
 */
export class PwaBadge extends LitElement {
    static get properties() {
        return {
            _period: { type: Number, state: false },
            _swActivated: { type: Boolean, state: false },
            _offlineReady: { type: Boolean, state: true },
            _needRefresh: { type: Boolean, state: true },
            _updateServiceWorker: { type: Function, state: false },
        }
    }

    constructor() {
        super();
        this._offlineReady = false
        this._needRefresh = false
        this._swActivated = false
        this._period = 0
        this._updateServiceWorker = undefined
    }

    firstUpdated() {
        this._updateServiceWorker = registerSW({
            immediate: true,
            onOfflineReady: () => (this._offlineReady = true),
            onNeedRefresh: () => (this._needRefresh = true),
            onRegisteredSW: this._onRegisteredSW
        })
    }

    render() {
        /**@type {string[]} */
        const classes = []
        if (this._offlineReady)
            classes.push('show')
        else if (this._needRefresh) {
            classes.push('show', 'refresh')
        }
        const message = this._offlineReady
            ? 'App ready to work offline'
            : this._needRefresh
                ? 'New content available, click on reload button to update'
                : ''
        return html`
            <div
                id="pwa-toast"
                role="alert"
                aria-labelledby="toast-message"
                class=${classes.join(' ')}
            >
                <div class="message">
                    <span id="toast-message">${message}</span>
                </div>
                <div class="buttons">
                    <button id="pwa-refresh" type="button" @click=${this._refreshApp}>
                        Reload
                    </button>
                    <button id="pwa-close" type="button" @click=${this._closeBadge}>
                        Close
                    </button>
                </div>
            </div>
    `
    }

    _refreshApp() {
        if (this._updateServiceWorker && this._needRefresh)
            this._updateServiceWorker()
    }

    _closeBadge() {
        this._offlineReady = false
        this._needRefresh = false
    }

    /**
     *
     * @param swUrl {string}
     * @param r {ServiceWorkerRegistration | undefined}
     * @private
     */
    _onRegisteredSW(swUrl, r) {
        if (this._period <= 0) return
        if (r?.active?.state === 'activated') {
            this._swActivated = true
            this._registerPeriodicSync(swUrl, r)
        }
        else if (r?.installing) {
            r.installing.addEventListener('statechange', (e) => {
                /**@type {ServiceWorker} */
                const sw = e.target
                this._swActivated = sw.state === 'activated'
                if (this._swActivated)
                    this._registerPeriodicSync(swUrl, r)
            })
        }
    }

    /**
     *
     * @param swUrl {string}
     * @param r {ServiceWorkerRegistration}
     * @private
     */
    _registerPeriodicSync(swUrl, r) {
        if (this._period <= 0) return

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
        }, this._period)
    }

    static styles = css`
    :host {
      max-width: 0;
      margin: 0;
      padding: 0;
    }

    #pwa-toast {
        visibility: hidden;
        position: fixed;
        right: 0;
        bottom: 0;
        margin: 16px;
        padding: 12px;
        border: 1px solid #8885;
        border-radius: 4px;
        z-index: 1;
        text-align: left;
        box-shadow: 3px 4px 5px 0 #8885;
        display: grid;
    }
    #pwa-toast .message {
        margin-bottom: 8px;
    }
    #pwa-toast .buttons {
        display: flex;
    }
    #pwa-toast button {
        border: 1px solid #8885;
        outline: none;
        margin-right: 5px;
        border-radius: 2px;
        padding: 3px 10px;
    }
    #pwa-toast.show {
        visibility: visible;
    }
    button#pwa-refresh {
        display: none;
    }
    #pwa-toast.show.refresh button#pwa-refresh {
        display: block;
    }
  `
}

window.customElements.define('pwa-badge', PwaBadge)
