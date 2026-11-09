<script setup lang="ts">
import { formatTime, pointsLabel } from '~/utils/format'

useHead({ title: 'Scannen · Robin' })

const { overview, refresh } = useOverview()
const { state, handleRaw, useAdvance, addAnother, removeScan, reset } = useScanFlow()
const { ask } = useConfirm()

await useAsyncData('overview', () => refresh())
reset()

const visit = computed(() => overview.value?.visit)
const basketOpen = ref(false)

/** Gelukte productscan: compacte bevestiging boven de camera, doorscannen kan meteen. */
const lastScan = computed(() =>
  state.value.status !== 'idle' && state.value.result?.kind === 'scanned' ? state.value.result : null)
/** Al het andere (melding, in/uitchecken) vult het scherm; de camera wacht. */
const fullResult = computed(() =>
  state.value.status !== 'idle' && state.value.result && state.value.result.kind !== 'scanned' ? state.value.result : null)

const hint = computed(() => visit.value
  ? 'Richt je camera op de QR-code bij het product'
  : 'Scan de QR-code bij de ingang')

function onDetected(raw: string) {
  if (fullResult.value) return
  handleRaw(raw)
}

async function onUndo(scanId: string) {
  const ok = await ask({
    title: 'Product teruggelegd?',
    body: 'De punten komen weer terug op je saldo.',
    confirmLabel: 'Ja, ik heb het teruggelegd',
    cancelLabel: 'Nee, ik neem het mee',
  })
  if (ok && await removeScan(scanId)) useToast().show('Teruggelegd. De punten staan weer op je saldo.', 'ok')
}
</script>

<template>
  <div class="space-y-4 pt-2">
    <div class="flex items-center gap-3">
      <svg viewBox="0 0 24 24" class="h-8 w-8 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" />
      </svg>
      <h1 class="text-4xl">{{ visit ? 'Scan een product' : 'Inchecken' }}</h1>
    </div>

    <Transition name="sheet" mode="out-in">
      <ScanResultSheet
        v-if="fullResult"
        :key="`full-${state.seq}`"
        :result="fullResult"
        :busy="state.status === 'busy'"
        @close="reset"
        @advance="useAdvance"
      />
    </Transition>

    <Transition name="sheet" mode="out-in">
      <ScanResultSheet
        v-if="lastScan"
        :key="lastScan.scanId"
        :result="lastScan"
        :busy="state.status === 'busy'"
        @close="reset"
        @another="addAnother"
        @undo="onUndo"
      />
    </Transition>

    <QrScanner v-show="!fullResult" :hint="hint" @detected="onDetected" />

    <!-- Mandje van dit bezoek -->
    <section v-if="visit && !fullResult" class="card">
      <button type="button" class="flex w-full items-center justify-between text-left" :aria-expanded="basketOpen" @click="basketOpen = !basketOpen">
        <span class="flex items-center gap-3">
          <span class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-groen text-beige">
            <RIcon name="basket" class="h-7 w-7" />
            <span :key="visit.items.length" class="anim-pop absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-koraal px-1 text-sm font-bold text-white">{{ visit.items.length }}</span>
          </span>
          <span>
            <span class="block text-xl font-semibold">Je mandje</span>
            <span class="text-base">{{ visit.items.length === 1 ? '1 product' : `${visit.items.length} producten` }} · {{ pointsLabel(visit.points) }}</span>
          </span>
        </span>
        <RIcon :name="basketOpen ? 'minus' : 'plus'" class="h-7 w-7" />
      </button>
      <TransitionGroup v-if="basketOpen" tag="ul" name="list" class="mt-4 divide-y divide-zand-donker">
        <li v-if="!visit.items.length" key="leeg" class="py-3 text-base">Nog niets gescand.</li>
        <li v-for="item in visit.items" :key="item.scan_id" class="flex items-center gap-3 py-3">
          <ProductThumb :name="item.name" :image-url="item.image_url" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-semibold">{{ item.name }}</p>
            <p class="text-sm">{{ item.portion }} · {{ formatTime(item.created_at) }}</p>
          </div>
          <span class="font-display text-2xl">{{ item.points }}</span>
          <button type="button" class="flex items-center gap-1 rounded-full px-2 py-2 text-sm font-semibold hover:bg-zand-donker" @click="onUndo(item.scan_id)">
            <RIcon name="hand-back" class="h-5 w-5" /><span class="sr-only sm:not-sr-only">Leg terug</span>
          </button>
        </li>
      </TransitionGroup>
      <p class="mt-3 flex items-center gap-2 text-sm"><RIcon name="gate" class="h-5 w-5 shrink-0" /> Klaar met boodschappen? Scan de QR-code bij de kassa.</p>
    </section>

    <section v-else-if="!fullResult" class="card flex items-center gap-4">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-groen text-beige"><RIcon name="gate" class="h-8 w-8" /></span>
      <p class="text-lg">Scan bij de ingang de QR-code op het scherm.</p>
    </section>
  </div>
</template>
