import { setZXingModuleOverrides } from 'vue-qrcode-reader'

/** Laad de barcode-lezer (wasm) van de eigen site in plaats van een CDN. */
export default defineNuxtPlugin(() => {
  setZXingModuleOverrides({
    locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? `/zxing/${path}` : prefix + path),
  })
})
