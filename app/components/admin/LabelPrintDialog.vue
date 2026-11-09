<script setup lang="ts">
import type { LabelProduct } from '~/utils/pdf/labels'

const props = defineProps<{ products: LabelProduct[] }>()
const emit = defineEmits<{ close: [] }>()

const size = ref<'krat' | 'groot'>('krat')
const style = ref<'robin' | 'hoog'>('robin')
const busy = ref(false)
const base = useSiteBase()
const { show } = useToast()
const isLocal = computed(() => /localhost|127\.0\.0\.1/.test(base.value))
const perPage = computed(() => (size.value === 'krat' ? 12 : 4))
const pages = computed(() => Math.ceil(props.products.length / perPage.value))

async function print() {
  busy.value = true
  try {
    const [{ buildLabelsPdf }, { loadBrandAssets }] = await Promise.all([import('~/utils/pdf/labels'), import('~/utils/pdf/brand')])
    const pdf = await buildLabelsPdf(props.products, { size: size.value, style: style.value, baseUrl: base.value }, await loadBrandAssets())
    openPdf(pdf, `robin-labels-${size.value}.pdf`)
    emit('close')
  }
  catch (e) {
    show(errorMessage(e, 'De PDF maken lukt niet.'), 'error')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <AdminModal title="Labels printen" @close="emit('close')">
    <p class="text-base">{{ products.length === 1 ? '1 label' : `${products.length} labels` }} · {{ pages === 1 ? '1 pagina' : `${pages} pagina's` }} A4</p>

    <fieldset class="mt-4">
      <legend class="label">Formaat</legend>
      <div class="grid grid-cols-2 gap-2">
        <label class="card flex cursor-pointer items-start gap-2 !p-3" :class="size === 'krat' ? 'ring-2 ring-groen' : ''">
          <input v-model="size" type="radio" value="krat" class="mt-1 accent-groen">
          <span><strong>Krat</strong><br><span class="text-sm">90 × 40 mm voor de inkeping, inhoud in de zichtbare 65 mm. 12 per A4</span></span>
        </label>
        <label class="card flex cursor-pointer items-start gap-2 !p-3" :class="size === 'groot' ? 'ring-2 ring-groen' : ''">
          <input v-model="size" type="radio" value="groot" class="mt-1 accent-groen">
          <span><strong>Groot</strong><br><span class="text-sm">138 × 65 mm, 4 per A4 liggend</span></span>
        </label>
      </div>
    </fieldset>

    <fieldset class="mt-4">
      <legend class="label">Stijl</legend>
      <div class="grid grid-cols-2 gap-2">
        <label class="card flex cursor-pointer items-start gap-2 !p-3" :class="style === 'robin' ? 'ring-2 ring-groen' : ''">
          <input v-model="style" type="radio" value="robin" class="mt-1 accent-groen">
          <span><strong>Robin</strong><br><span class="text-sm">Beige QR op koraal, zoals de huidige labels</span></span>
        </label>
        <label class="card flex cursor-pointer items-start gap-2 !p-3" :class="style === 'hoog' ? 'ring-2 ring-groen' : ''">
          <input v-model="style" type="radio" value="hoog" class="mt-1 accent-groen">
          <span><strong>Hoog contrast</strong><br><span class="text-sm">Groene QR op beige; leest ook met elke camera-app</span></span>
        </label>
      </div>
    </fieldset>

    <p class="mt-4 text-sm">QR-codes verwijzen naar <strong>{{ base }}/p/…</strong></p>
    <p v-if="isLocal" class="mt-2 rounded-2xl bg-koraal px-4 py-3 text-sm text-white">
      Let op: je print vanaf een lokale omgeving. De app-scanner leest deze labels gewoon, maar met de gewone camera-app openen ze localhost.
      Zet NUXT_PUBLIC_SITE_URL voor de echte website.
    </p>

    <button type="button" class="btn-primary mt-5 w-full" :disabled="busy" @click="print">
      {{ busy ? 'PDF maken…' : 'Maak PDF' }}
    </button>
  </AdminModal>
</template>
