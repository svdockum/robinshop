<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'
import type { DetectedBarcode } from 'vue-qrcode-reader'
import { pickPrimaryCode } from '~/utils/scanGate'
import { describeCameraProblem, retriesOnReturn } from '~/utils/cameraProblem'
import type { CameraPermission } from '~/utils/cameraProblem'
import type { IconName } from '~/components/RIcon.vue'

/**
 * Onder de camera staat in beeld wat je moet doen: telefoon → `target` (waar je op richt).
 * `hint` is dezelfde uitleg in tekst; die verschijnt na een tik op het beeld.
 */
withDefaults(defineProps<{ paused?: boolean, hint?: string, target?: IconName }>(), {
  paused: false,
  hint: 'Richt je camera op de QR-code',
  target: 'qr',
})
const emit = defineEmits<{ detected: [raw: string] }>()

const ready = ref(false)
/** Naam van de laatste camerafout (bijv. NotAllowedError); null als de camera het doet. */
const errorName = ref<string | null>(null)
const permission = ref<CameraPermission>('unknown')
/** Melding en knop volgen ook een toestemming die pas later bekend of veranderd is. */
const problem = computed(() => (errorName.value ? describeCameraProblem(errorName.value, permission.value) : null))
const torchSupported = ref(false)
const torch = ref(false)
const attempt = ref(0)
const manualOpen = ref(false)
const manualCode = ref('')
const manualInput = ref<HTMLInputElement | null>(null)

let permissionStatus: PermissionStatus | null = null

/** Toestemming veranderd in de browser (slotje, instellingen): daar meteen op reageren. */
function onPermissionChange() {
  if (!permissionStatus) return
  permission.value = permissionStatus.state
  if (permission.value === 'granted') {
    if (errorName.value) retry()
  }
  else if (ready.value) {
    // Toestemming ingetrokken terwijl de camera aan stond: het beeld staat dan stil.
    ready.value = false
    errorName.value = 'NotAllowedError'
  }
}

/** Terug in de app na de instellingen of na het sluiten van een andere app. */
function onVisibilityChange() {
  if (document.visibilityState === 'visible' && problem.value && retriesOnReturn(problem.value.kind)) retry()
}

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  try {
    permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
    permission.value = permissionStatus.state
    permissionStatus.addEventListener('change', onPermissionChange)
  }
  catch {
    // Browser kent de camera-toestemming niet als vraag; dan blijft het 'unknown'.
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  permissionStatus?.removeEventListener('change', onPermissionChange)
})

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
  errorName.value = null
  torchSupported.value = 'torch' in capabilities && !!(capabilities as { torch?: boolean }).torch
}

function onError(err: Error) {
  ready.value = false
  console.warn('[QrScanner] camera start mislukt:', err.name, err.message)
  // Stand opnieuw lezen: na weigeren in de browserprompt is die net veranderd.
  if (permissionStatus) permission.value = permissionStatus.state
  errorName.value = err.name
}

function retry() {
  errorName.value = null
  attempt.value++
}

async function toggleManual() {
  manualOpen.value = !manualOpen.value
  if (manualOpen.value) {
    await nextTick()
    manualInput.value?.focus()
  }
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
      <div v-if="!problem" class="frame pointer-events-none absolute inset-x-12 inset-y-6" :class="{ 'frame-hit': flash }" aria-hidden="true">
        <span class="corner top-0 left-0 rounded-tl-2xl border-t-[5px] border-l-[5px]" />
        <span class="corner top-0 right-0 rounded-tr-2xl border-t-[5px] border-r-[5px]" />
        <span class="corner bottom-0 left-0 rounded-bl-2xl border-b-[5px] border-l-[5px]" />
        <span class="corner right-0 bottom-0 rounded-br-2xl border-r-[5px] border-b-[5px]" />
        <span v-if="ready && !paused" class="sweep absolute inset-x-3 top-0 h-[3px] rounded-full bg-beige/80" />
      </div>

      <div v-if="!ready && !problem" class="absolute inset-0 flex items-center justify-center text-beige" role="status">
        <RIcon name="camera" class="anim-breathe h-14 w-14" />
        <span class="sr-only">Camera wordt gestart…</span>
      </div>

      <!-- Camera lukt niet: beeld, de knop om het opnieuw te proberen en de uitleg achter de ⓘ -->
      <div v-if="problem" class="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-groen p-8 text-beige" role="alert">
        <RIcon name="camera-off" class="h-16 w-16 text-koraal" />
        <p class="sr-only">{{ problem.message }}</p>
        <div class="flex items-center gap-3">
          <button v-if="problem.button" type="button" class="btn bg-beige text-groen" :aria-label="problem.button" @click="retry">
            <RIcon :name="problem.kind === 'ask' ? 'camera' : 'refresh'" class="h-7 w-7" />
          </button>
          <InfoTip :text="problem.message" class="!opacity-100" />
        </div>
      </div>

      <button
        v-if="torchSupported"
        type="button"
        class="absolute right-4 bottom-4 flex h-12 w-12 items-center justify-center rounded-full transition-colors"
        :class="torch ? 'bg-koraal text-white' : 'bg-beige/90 text-groen'"
        :aria-pressed="torch"
        aria-label="Lamp"
        @click="torch = !torch"
      >
        <RIcon name="torch" class="h-7 w-7" />
      </button>
    </div>

    <div class="mt-3 flex items-center justify-center gap-3">
      <!-- Wat moet ik doen? Telefoon → doel. Tik voor dezelfde uitleg in tekst. -->
      <InfoTip :text="hint" class="min-h-14 gap-3 rounded-2xl bg-zand px-4 py-2">
        <RIcon name="phone-scan" class="h-9 w-9" />
        <RIcon name="arrow-right" class="anim-breathe h-6 w-6 text-koraal" />
        <slot name="target"><RIcon :name="target" class="h-9 w-9" /></slot>
        <RIcon name="info" class="ml-1 h-5 w-5 opacity-60" />
      </InfoTip>
      <button
        type="button"
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors"
        :class="manualOpen ? 'bg-groen text-beige' : 'bg-zand text-groen hover:bg-zand-donker'"
        :aria-expanded="manualOpen"
        aria-label="Lukt scannen niet? Typ de code"
        @click="toggleManual"
      >
        <RIcon name="keyboard" class="h-8 w-8" />
      </button>
    </div>

    <form v-if="manualOpen" class="mt-3 flex gap-2" @submit.prevent="submitManual">
      <label class="sr-only" for="manual-code">Typ de code die bij het product staat</label>
      <input
        id="manual-code"
        ref="manualInput"
        v-model="manualCode"
        class="input"
        placeholder="PREI"
        autocomplete="off"
        autocapitalize="characters"
        enterkeyhint="go"
      >
      <button type="submit" class="btn-primary shrink-0" aria-label="Code gebruiken"><RIcon name="check" class="h-7 w-7" /></button>
    </form>
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
