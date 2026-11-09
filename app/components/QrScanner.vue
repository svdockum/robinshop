<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'
import type { DetectedBarcode } from 'vue-qrcode-reader'
import { pickPrimaryCode } from '~/utils/scanGate'

withDefaults(defineProps<{ paused?: boolean, hint?: string }>(), {
  paused: false,
  hint: 'Richt je camera op de QR-code',
})
const emit = defineEmits<{ detected: [raw: string] }>()

const ready = ref(false)
const error = ref<string | null>(null)
const torchSupported = ref(false)
const torch = ref(false)
const attempt = ref(0)
const manualOpen = ref(false)
const manualCode = ref('')

const CAMERA_ERRORS: Record<string, string> = {
  NotAllowedError: 'Geef de website toestemming om je camera te gebruiken. Daarna kun je scannen.',
  NotFoundError: 'We vinden geen camera op dit apparaat.',
  NotReadableError: 'De camera is al in gebruik door een andere app. Sluit die app en probeer het opnieuw.',
  OverconstrainedError: 'De achtercamera kan niet worden gestart.',
  InsecureContextError: 'De camera werkt alleen via een beveiligde verbinding (https).',
  StreamApiNotSupportedError: 'Deze browser kan de camera niet gebruiken. Probeer Safari of Chrome.',
}

const flash = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | undefined

function onDetect(codes: DetectedBarcode[]) {
  const raw = pickPrimaryCode(codes)
  if (!raw) return
  // Kader knijpt kort samen: "gezien!"
  flash.value = true
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (flash.value = false), 380)
  emit('detected', raw)
}
onBeforeUnmount(() => clearTimeout(flashTimer))

function onCameraOn(capabilities: Partial<MediaTrackCapabilities>) {
  ready.value = true
  error.value = null
  torchSupported.value = 'torch' in capabilities && !!(capabilities as { torch?: boolean }).torch
}

function onError(err: Error) {
  ready.value = false
  error.value = CAMERA_ERRORS[err.name] ?? 'De camera starten lukt niet. Probeer het opnieuw.'
}

function retry() {
  error.value = null
  attempt.value++
}

function submitManual() {
  const code = manualCode.value.trim()
  if (!code) return
  emit('detected', code)
  manualCode.value = ''
  manualOpen.value = false
}
</script>

<template>
  <div>
    <div class="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-groen">
      <ClientOnly>
        <QrcodeStream
          :key="attempt"
          :formats="['qr_code', 'ean_13']"
          :constraints="{ facingMode: 'environment' }"
          :paused="paused"
          :torch="torch"
          @detect="onDetect"
          @camera-on="onCameraOn"
          @error="onError"
        />
      </ClientOnly>

      <!-- Kader: ademt rustig tijdens het zoeken, knijpt samen bij een scan -->
      <div v-if="!error" class="frame pointer-events-none absolute inset-x-12 inset-y-6" :class="{ 'frame-hit': flash }" aria-hidden="true">
        <span class="corner top-0 left-0 rounded-tl-2xl border-t-[5px] border-l-[5px]" />
        <span class="corner top-0 right-0 rounded-tr-2xl border-t-[5px] border-r-[5px]" />
        <span class="corner bottom-0 left-0 rounded-bl-2xl border-b-[5px] border-l-[5px]" />
        <span class="corner right-0 bottom-0 rounded-br-2xl border-r-[5px] border-b-[5px]" />
        <span v-if="ready && !paused" class="sweep absolute inset-x-3 top-0 h-[3px] rounded-full bg-beige/80" />
      </div>

      <div v-if="!ready && !error" class="absolute inset-0 flex items-center justify-center text-beige">
        <p class="text-lg">Camera wordt gestart…</p>
      </div>

      <div v-if="error" class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center text-beige">
        <p class="text-lg">{{ error }}</p>
        <button type="button" class="btn bg-beige text-groen" @click="retry">Opnieuw proberen</button>
      </div>

      <button
        v-if="torchSupported"
        type="button"
        class="absolute right-4 bottom-4 rounded-full bg-beige/90 px-4 py-2 text-sm font-semibold text-groen"
        :aria-pressed="torch"
        @click="torch = !torch"
      >
        {{ torch ? 'Lamp uit' : 'Lamp aan' }}
      </button>
    </div>

    <p class="mt-3 text-center text-lg">{{ hint }}</p>

    <div class="mt-2 text-center">
      <button v-if="!manualOpen" type="button" class="text-base font-medium underline underline-offset-4" @click="manualOpen = true">
        Lukt scannen niet? Typ de code
      </button>
      <form v-else class="mt-2 flex gap-2" @submit.prevent="submitManual">
        <label class="sr-only" for="manual-code">Code</label>
        <input
          id="manual-code"
          v-model="manualCode"
          class="input"
          placeholder="Bijv. PREI"
          autocomplete="off"
          autocapitalize="characters"
          enterkeyhint="go"
        >
        <button type="submit" class="btn-primary shrink-0">OK</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
:deep(video) {
  object-fit: cover;
}
.corner {
  position: absolute;
  width: 3rem;
  height: 3rem;
  border-color: var(--color-beige);
  transition: transform var(--dur) var(--ease-out), border-color var(--dur-fast) linear;
}
.frame-hit .corner {
  border-color: var(--color-koraal);
  transform: scale(0.82);
}
.sweep {
  --sweep: calc(100cqh - 3px);
  animation: sweep 2.2s var(--ease-in-out) infinite;
}
.frame {
  container-type: size;
}
@media (prefers-reduced-motion: reduce) {
  .sweep { display: none; }
  .corner { transition: border-color var(--dur-fast) linear; }
  .frame-hit .corner { transform: none; }
}
</style>
