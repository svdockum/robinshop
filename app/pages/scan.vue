<script setup lang="ts">
import { pointsLabel } from '~/utils/format'

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

const basketLabel = computed(() => {
  const n = visit.value?.items.length ?? 0
  return `Je mandje: ${n === 1 ? '1 product' : `${n} producten`}, ${pointsLabel(visit.value?.points)}`
})

function onDetected(raw: string) {
  if (fullResult.value) return
  handleRaw(raw)
}

/** Het product bij een scan, voor het plaatje in de terugleg-vraag. */
function productOf(scanId: string) {
  const item = visit.value?.items.find(i => i.scan_id === scanId)
  if (item) return { name: item.name, imageUrl: item.image_url }
  if (lastScan.value?.scanId === scanId) return { name: lastScan.value.product.name, imageUrl: lastScan.value.product.image_url }
  return undefined
}

async function onUndo(scanId: string) {
  const ok = await ask({
    title: 'Product teruggelegd?',
    body: 'De punten komen weer terug op je saldo.',
    confirmLabel: 'Ja, ik heb het teruggelegd',
    cancelLabel: 'Nee, ik neem het mee',
    thumb: productOf(scanId),
    icons: ['hand-back'],
    confirmIcons: ['hand-back', 'check'],
    cancelIcons: ['basket'],
  })
  if (ok && await removeScan(scanId)) useToast().show('Teruggelegd. De punten staan weer op je saldo.', 'ok', 3500, ['hand-back', 'check'])
}
</script>

<template>
  <div class="space-y-4 pt-2">
    <h1 class="sr-only">{{ visit ? 'Scan een product' : 'Inchecken' }}</h1>

    <!-- Waar ben ik in mijn bezoek: ingang → producten → kassa -->
    <VisitSteps v-if="!fullResult" :current="visit ? 2 : 1" />

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

    <QrScanner v-show="!fullResult" :hint="hint" target="gate" @detected="onDetected">
      <!-- In de winkel richt je op het kratlabel: QR-code met het aantal punten op koraal -->
      <template v-if="visit" #target>
        <span class="inline-flex items-center gap-1 rounded-lg bg-koraal py-1 pr-2.5 pl-1.5 text-beige">
          <RIcon name="qr" class="h-7 w-7" /><span class="font-display text-2xl leading-none">2</span>
        </span>
      </template>
    </QrScanner>

    <!-- Mandje van dit bezoek -->
    <section v-if="visit && !fullResult" class="card">
      <button type="button" class="flex w-full items-center gap-4 text-left" :aria-expanded="basketOpen" :aria-label="basketLabel" @click="basketOpen = !basketOpen">
        <span class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-groen text-beige">
          <RIcon name="basket" class="h-7 w-7" />
          <span :key="visit.items.length" class="anim-pop absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-koraal px-1 text-sm font-bold text-white">{{ visit.items.length }}</span>
        </span>
        <span v-if="visit.points" class="pill-min">−{{ visit.points }}</span>
        <RIcon name="chevron-down" class="ml-auto h-7 w-7 transition-transform" :class="{ 'rotate-180': basketOpen }" />
      </button>
      <TransitionGroup v-if="basketOpen" tag="ul" name="list" class="mt-4 divide-y divide-zand-donker">
        <li v-if="!visit.items.length" key="leeg" class="flex justify-center py-4 text-groen/40">
          <RIcon name="basket" class="h-10 w-10" label="Nog niets gescand" />
        </li>
        <li v-for="item in visit.items" :key="item.scan_id" class="flex items-center gap-3 py-3">
          <ProductThumb :name="item.name" :image-url="item.image_url" />
          <p class="min-w-0 flex-1 truncate text-lg font-semibold">{{ item.name }}</p>
          <span class="pill-min !px-3 !py-1 !text-xl">{{ item.points }}<span class="sr-only"> {{ item.points === 1 ? 'punt' : 'punten' }}</span></span>
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-zand-donker"
            :aria-label="`Leg ${item.name} terug`"
            title="Leg terug"
            @click="onUndo(item.scan_id)"
          >
            <RIcon name="hand-back" class="h-7 w-7" />
          </button>
        </li>
      </TransitionGroup>
    </section>
  </div>
</template>
