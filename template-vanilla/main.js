import './style.css'
import javascriptLogo from './javascript.svg'
import appLogo from '/favicon.svg'
import { setupCounter } from './counter.js'
import { initPWA } from './pwa.js'

const app = document.querySelector('#app')
app.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${appLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite VanillaJS PWA!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
  <div
    id="pwa-toast"
    role="alert"
    aria-labelledby="toast-message"
  >
    <div class="message">
      <span id="toast-message"></span>
    </div>
    <button id="pwa-refresh">
      Reload
    </button>
    <button id="pwa-close">
      Close
    </button>
  </div>
`

setupCounter(document.querySelector('#counter'))

initPWA(app)
