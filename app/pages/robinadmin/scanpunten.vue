<script setup lang="ts">
import type { AdminScanPoint } from '~/types/admin'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Ingang & kassa · Robin beheer' })

const { api } = useAdminApi()
const { show } = useToast()
const { ask } = useConfirm()
const base = useSiteBase()
const origin = computed(() => (import.meta.client ? window.location.origin : ''))

const { data: points, refresh, error } = await useAsyncData('admin-scan-points', () => api<AdminScanPoint[]>('/api/robinadmin/scan_points'))

const INTERVALS = [
  { value: 30, label: 'Elke 30 seconden' },
  { value: 60, label: 'Elke minuut (aanbevolen)' },
  { value: 300, label: 'Elke 5 minuten' },
  { value: 3600, label: 'Elk uur (e-ink)' },
]
const newPoint = reactive({ name: '', slug: '', kind: 'entrance' as 'entrance' | 'checkout', interval_seconds: 60 })
const posterBusy = ref(false)

function displayUrl(p: AdminScanPoint) {
  return `${origin.value}/display/${p.slug}?key=${p.display_key}`
}

async function save(p: AdminScanPoint) {
  try {
    await api(`/api/robinadmin/scan_points/${p.id}`, { method: 'PATCH', body: { name: p.name, interval_seconds: p.interval_seconds } })
    show('Opgeslagen', 'ok')
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function newKey(p: AdminScanPoint) {
  const ok = await ask({
    title: 'Nieuwe displaysleutel?',
    body: 'De huidige displaylink werkt daarna niet meer. Open op het scherm de nieuwe link.',
    confirmLabel: 'Ja, nieuwe sleutel',
    danger: true,
  })
  if (!ok) return
  try {
    await api(`/api/robinadmin/scan-points/${p.id}/key`, { method: 'POST' })
    await refresh()
    show('Nieuwe sleutel gemaakt', 'ok')
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function addPoint() {
  try {
    await api('/api/robinadmin/scan_points', { method: 'POST', body: newPoint })
    Object.assign(newPoint, { name: '', slug: '' })
    await refresh()
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function removePoint(p: AdminScanPoint) {
  if (!await ask({ title: `${p.name} verwijderen?`, confirmLabel: 'Verwijderen', danger: true })) return
  try {
    await api(`/api/robinadmin/scan_points/${p.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    show('Link gekopieerd', 'ok')
  }
  catch {
    show('Kopiëren lukt niet in deze browser', 'error')
  }
}

async function printPoster() {
  posterBusy.value = true
  try {
    const [{ buildPosterPdf }, { loadBrandAssets }] = await Promise.all([import('~/utils/pdf/poster'), import('~/utils/pdf/brand')])
    openPdf(await buildPosterPdf(base.value, await loadBrandAssets()), 'robin-ingangsposter.pdf')
  }
  catch (e) {
    show(errorMessage(e, 'De PDF maken lukt niet.'), 'error')
  }
  finally {
    posterBusy.value = false
  }
}

watch(() => newPoint.name, (n) => {
  newPoint.slug = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-5xl">Ingang & kassa</h1>
        <p class="mt-1 max-w-2xl">Open de displaylink op het scherm bij het poortje of de kassa. Dat scherm toont een QR-code die steeds wisselt, zodat een foto ervan niet werkt.</p>
      </div>
      <button type="button" class="btn-outline !py-2.5 !text-base" :disabled="posterBusy" @click="printPoster">Ingangsposter printen</button>
    </div>

    <p v-if="error" class="card">{{ errorMessage(error, 'Scanpunten ophalen lukt niet.') }}</p>

    <div class="grid gap-4 md:grid-cols-2">
      <section v-for="p in points" :key="p.id" class="card space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="rounded-full px-3 py-1 text-sm font-semibold" :class="p.kind === 'entrance' ? 'bg-groen text-beige' : 'bg-koraal text-white'">
            {{ p.kind === 'entrance' ? 'Ingang' : 'Kassa' }}
          </span>
          <code class="text-sm">{{ p.slug }}</code>
        </div>
        <div>
          <label class="label" :for="`n-${p.id}`">Naam</label>
          <input :id="`n-${p.id}`" v-model="p.name" class="input !py-2">
        </div>
        <div>
          <label class="label" :for="`i-${p.id}`">QR-code wisselt</label>
          <select :id="`i-${p.id}`" v-model.number="p.interval_seconds" class="input !py-2">
            <option v-for="o in INTERVALS" :key="o.value" :value="o.value">{{ o.label }}</option>
            <option v-if="!INTERVALS.some(o => o.value === p.interval_seconds)" :value="p.interval_seconds">Elke {{ p.interval_seconds }} seconden</option>
          </select>
        </div>
        <button type="button" class="btn-primary !py-2 !text-base" @click="save(p)">Opslaan</button>
        <div class="rounded-2xl bg-beige p-3">
          <p class="text-sm font-semibold">Displaylink</p>
          <p class="mt-1 text-xs break-all">{{ displayUrl(p) }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <a :href="displayUrl(p)" target="_blank" rel="noopener" class="btn-outline !px-4 !py-1.5 !text-sm">Open display</a>
            <button type="button" class="btn-outline !px-4 !py-1.5 !text-sm" @click="copy(displayUrl(p))">Kopieer</button>
            <button type="button" class="btn-ghost !px-3 !py-1.5 !text-sm" @click="newKey(p)">Nieuwe sleutel</button>
            <button type="button" class="btn-ghost ml-auto !px-3 !py-1.5 !text-sm" @click="removePoint(p)">Verwijderen</button>
          </div>
        </div>
      </section>
    </div>

    <form class="card grid gap-3 sm:grid-cols-[1fr_12rem_14rem_auto] sm:items-end" @submit.prevent="addPoint">
      <div>
        <label class="label" for="np-name">Nieuw scanpunt</label>
        <input id="np-name" v-model="newPoint.name" class="input !py-2" placeholder="Bijv. Tweede kassa" required>
      </div>
      <div>
        <label class="label" for="np-kind">Soort</label>
        <select id="np-kind" v-model="newPoint.kind" class="input !py-2">
          <option value="entrance">Ingang</option>
          <option value="checkout">Kassa</option>
        </select>
      </div>
      <div>
        <label class="label" for="np-interval">Wisselt</label>
        <select id="np-interval" v-model.number="newPoint.interval_seconds" class="input !py-2">
          <option v-for="o in INTERVALS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <button type="submit" class="btn-primary !py-2 !text-base">Toevoegen</button>
    </form>
  </div>
</template>
