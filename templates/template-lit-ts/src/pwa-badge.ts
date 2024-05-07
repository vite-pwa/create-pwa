import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { registerSW } from 'virtual:pwa-register'

/**
 * PWA Badge element.
 */
@customElement('pwa-badge')
export class PwaBadge extends LitElement {
    @property()
    private _period = 0
    @property()
    private _swActivated = false
    @state()
    private _offlineReady = false
    @state()
    private _needRefresh = false
    @property()
    private _updateServiceWorker: undefined | ((reloadPage?: boolean) => Promise<void>)

    firstUpdated() {
        this._updateServiceWorker = registerSW({
            immediate: true,
            onOfflineReady: () => (this._offlineReady = true),
            onNeedRefresh: () => (this._needRefresh = true),
            onRegisteredSW: this._onRegisteredSW
        })
    }

    render() {
        const classes: string[] = []
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

    private _refreshApp() {
        if (this._updateServiceWorker && this._needRefresh)
            this._updateServiceWorker()
    }

    private _closeBadge() {
        this._offlineReady = false
        this._needRefresh = false
    }

    private _onRegisteredSW(swUrl: string, r?: ServiceWorkerRegistration) {
        if (this._period <= 0) return
        if (r?.active?.state === 'activated') {
            this._swActivated = true
            this._registerPeriodicSync(swUrl, r)
        }
        else if (r?.installing) {
            r.installing.addEventListener('statechange', (e) => {
                const sw = e.target as ServiceWorker
                this._swActivated = sw.state === 'activated'
                if (this._swActivated)
                    this._registerPeriodicSync(swUrl, r)
            })
        }
    }

    private _registerPeriodicSync(swUrl: string, r: ServiceWorkerRegistration) {
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

declare global {
    interface HTMLElementTagNameMap {
        'pwa-badge': PwaBadge
    }
}
