<script setup lang="ts">
// will not be included: just as reference
</script>

<template>
  <main>
    <slot />
    <ClientOnly>
      <div
          v-if="$pwa?.offlineReady || $pwa?.needRefresh"
          class="pwa-toast"
          role="alert"
          aria-labelledby="toast-message"
      >
        <div class="message">
          <span id="toast-message">
            {{ $pwa.offlineReady ? 'App ready to work offline' : 'New content available, click on reload button to update.' }}
          </span>
        </div>
        <div class="buttons">
          <button
              v-if="$pwa.needRefresh"
              @click="$pwa.updateServiceWorker()"
          >
            Reload
          </button>
          <button @click="$pwa.cancelPrompt()">
            Close
          </button>
        </div>
      </div>
<!-- UNCOMMENT THIS TO ENABLE INSTALL PROMPT
      <div
          v-if="$pwa?.showInstallPrompt && !$pwa?.offlineReady && !$pwa?.needRefresh"
          class="pwa-toast"
          role="alert"
          aria-labelledby="install-pwa"
      >
        <div class="message">
          <span id="install-pwa">
            Install PWA
          </span>
        </div>
        <button @click="$pwa.install()">
          Install
        </button>
        <button @click="$pwa.cancelInstall()">
          Cancel
        </button>
      </div>
-->
    </ClientOnly>
  </main>
</template>

<style>
.pwa-toast {
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
  background-color: white;
}
.pwa-toast .message {
  margin-bottom: 8px;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
</style>
