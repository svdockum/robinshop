<script setup lang="ts">
/**
 * Scherm bij het poortje of de kassa (tablet, monitor, later e-ink).
 * Toont een wisselende QR-code en kort "Welkom, familie X!" na een scan.
 */
definePageMeta({ layout: 'bare' })
useHead({ title: 'Robin · scherm', meta: [{ name: 'theme-color', content: '#115656' }] })

interface DisplayEvent { id: number, kind: 'welcome' | 'checkout', title: string, detail: string | null }
interface DisplayData {
  kind: 'in' | 'uit'
  name: string
  url: string
  expiresAt: number
  serverNow: number
  intervalSeconds: number
  events: DisplayEvent[]
}

const route = useRoute()
const slug = String(route.params.slug)
const key = String(route.query.key ?? '')

const data = ref<DisplayData | null>(null)
const error = ref<string | null>(null)
const lastEventId = ref(0)
const overlay = ref<DisplayEvent | null>(null)
const remaining = ref(1)
let clockOffset = 0
let firstPoll = true
let pollTimer: ReturnType<typeof setInterval> | undefined
let tickTimer: ReturnType<typeof setInterval> | undefined
let overlayTimer: ReturnType<typeof setTimeout> | undefined
let wakeLock: { release: () => Promise<void> } | null = null

async function poll() {
  try {
    const res = await $fetch<DisplayData>(`/api/display/${encodeURIComponent(slug)}`, {
      query: { key, since: lastEventId.value },
    })
    clockOffset = res.serverNow - Date.now()
    error.value = null
    if (!data.value || data.value.url !== res.url) data.value = res
    else data.value = { ...data.value, expiresAt: res.expiresAt, events: res.events }

    // Eerste poll: oude gebeurtenissen niet opnieuw tonen. Daarna elke nieuwe wel,
    // ook als het scherm stil begon (geen gebeurtenissen bij de eerste poll).
    const newest = res.events.at(-1)
    if (newest) {
      lastEventId.value = newest.id
      if (!firstPoll) showOverlay(newest)
    }
    firstPoll = false
  }
  catch (e: unknown) {
    const status = (e as { statusCode?: number })?.statusCode
    error.value = status === 401
      ? 'De displaysleutel klopt niet. Open de link uit het beheer opnieuw.'
      : status === 404
        ? 'Dit scanpunt bestaat niet.'
        : 'Geen verbinding. We proberen het opnieuw…'
  }
}

function showOverlay(ev: DisplayEvent) {
  overlay.value = ev
  clearTimeout(overlayTimer)
  overlayTimer = setTimeout(() => (overlay.value = null), 5000)
}

function tick() {
  if (!data.value) return
  const left = data.value.expiresAt - (Date.now() + clockOffset)
  remaining.value = Math.max(0, Math.min(1, left / (data.value.intervalSeconds * 1000)))
  if (left <= 0) poll()
}

async function keepAwake() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    wakeLock = (await nav.wakeLock?.request('screen')) ?? null
  }
  catch {
    // Niet ondersteund; scherm-instellingen van het apparaat gebruiken.
  }
}

function onVisible() {
  if (document.visibilityState === 'visible') {
    keepAwake()
    poll()
  }
}

onMounted(() => {
  poll()
  pollTimer = setInterval(poll, 2000)
  tickTimer = setInterval(tick, 250)
  keepAwake()
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  clearInterval(pollTimer)
  clearInterval(tickTimer)
  clearTimeout(overlayTimer)
  wakeLock?.release().catch(() => {})
  document.removeEventListener('visibilitychange', onVisible)
})

const title = computed(() => data.value?.kind === 'uit' ? 'Scan om af te ronden' : 'Scan om binnen te komen')
const subtitle = computed(() => data.value?.kind === 'uit'
  ? 'Open de Robin-app en scan deze code met de scanner.'
  : 'Open de Robin-app op je telefoon en scan deze code.')
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-groen p-[4vmin] text-beige">
    <header class="flex items-center justify-between">
      <RobinLogo color="beige" class="h-[7vmin] w-auto" />
      <p v-if="data" class="text-[2.4vmin] font-semibold">{{ data.name }}</p>
    </header>

    <main class="flex flex-1 flex-col items-center justify-center gap-[3vmin] text-center landscape:flex-row landscape:gap-[6vmin] landscape:text-left">
      <div class="w-[min(70vmin,560px)] shrink-0 rounded-[3vmin] bg-beige p-[2.5vmin]">
        <Transition name="qr" mode="out-in">
          <QrImage v-if="data" :key="data.url" :value="data.url" />
          <div v-else class="skeleton aspect-square" />
        </Transition>
        <div class="mt-[1.5vmin] h-[1vmin] overflow-hidden rounded-full bg-zand-donker" aria-hidden="true">
          <div class="h-full rounded-full bg-koraal transition-[width] duration-200 ease-linear" :style="{ width: `${remaining * 100}%` }" />
        </div>
      </div>
      <div class="max-w-[60vmin]">
        <h1 class="text-[9vmin]">{{ title }}</h1>
        <p class="mt-[2vmin] text-[3vmin]">{{ subtitle }}</p>
        <div class="mt-[3vmin] flex items-center gap-[2vmin] text-[2.6vmin]" aria-hidden="true">
          <RIcon name="phone-scan" class="h-[7vmin] w-[7vmin]" />
          <RIcon name="arrow-right" class="anim-breathe h-[4vmin] w-[4vmin] text-koraal" />
          <RIcon name="qr" class="h-[7vmin] w-[7vmin]" />
        </div>
        <p class="mt-[2vmin] text-[2.2vmin] opacity-80">De code wisselt steeds. Een foto ervan werkt dus niet.</p>
        <p v-if="error" class="mt-[3vmin] rounded-2xl bg-koraal px-[2vmin] py-[1.5vmin] text-[2.4vmin] text-white" role="alert">{{ error }}</p>
      </div>
    </main>

    <Transition name="pop">
      <div v-if="overlay" class="fixed inset-0 flex flex-col items-center justify-center bg-beige p-[6vmin] text-center text-groen" role="status">
        <div v-if="overlay.kind === 'checkout'" class="relative mb-[2vmin] flex h-[16vmin] w-[70vmin] items-center" aria-hidden="true">
          <RobinArrow shoot class="absolute left-0 h-[4.5vmin] w-[78%]" />
          <span class="anim-pop absolute right-0 flex h-[16vmin] w-[16vmin] items-center justify-center rounded-full border-[1.2vmin] border-groen" style="animation-delay: 650ms">
            <RIcon name="bag" class="h-[8vmin] w-[8vmin]" />
          </span>
        </div>
        <span v-else class="anim-pop flex h-[16vmin] w-[16vmin] items-center justify-center rounded-full bg-groen text-beige" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="h-[9vmin] w-[9vmin]" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="anim-draw" style="--len: 22" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
        <p class="anim-rise mt-[4vmin] font-display text-[11vmin] leading-none" style="animation-delay: 150ms">{{ overlay.title }}</p>
        <p v-if="overlay.detail" class="anim-rise mt-[3vmin] text-[5vmin] font-semibold" style="animation-delay: 250ms">{{ overlay.detail }}</p>
        <p v-if="overlay.kind === 'checkout'" class="anim-rise mt-[3vmin] text-[3.5vmin]" style="animation-delay: 350ms">Bedankt en tot ziens!</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pop-enter-active { transition: opacity var(--dur) var(--ease-out), transform var(--dur-slow) var(--ease-out); }
.pop-leave-active { transition: opacity var(--dur-slow) var(--ease-in); }
.pop-enter-from { opacity: 0; transform: scale(.97); }
.pop-leave-to { opacity: 0; }
.qr-enter-active { transition: opacity var(--dur) var(--ease-out), filter var(--dur) var(--ease-out); }
.qr-leave-active { transition: opacity var(--dur-fast) var(--ease-in), filter var(--dur-fast) var(--ease-in); }
.qr-enter-from, .qr-leave-to { opacity: 0; filter: blur(6px); }
@media (prefers-reduced-motion: reduce) {
  .pop-enter-from { transform: none; }
  .qr-enter-from, .qr-leave-to { filter: none; }
}
</style>
