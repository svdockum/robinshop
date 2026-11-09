<script setup lang="ts">
import type { AdminCategory, AdminProduct } from '~/types/admin'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Producten & QR · Robin beheer' })

const { api } = useAdminApi()
const { show } = useToast()
const { ask } = useConfirm()
const base = useSiteBase()

const { data: products, refresh: refreshProducts, error } = await useAsyncData('admin-products', () => api<AdminProduct[]>('/api/robinadmin/products'))
const { data: categories, refresh: refreshCategories } = await useAsyncData('admin-categories', () => api<AdminCategory[]>('/api/robinadmin/categories'))

const search = ref('')
const categoryFilter = ref<string>('')
const showInactive = ref(false)
const selected = ref<Set<string>>(new Set())
const editing = ref<AdminProduct | null>(null)
const creating = ref(false)
const printing = ref<AdminProduct[] | null>(null)
const qrFor = ref<AdminProduct | null>(null)
const catPanel = ref(false)
const newCat = reactive({ name: '', color: '#115656' })

const STORAGE: Record<string, string> = { vers: 'Vers', koel: 'Gekoeld', vries: 'Diepvries', houdbaar: 'Houdbaar' }
const catById = computed(() => Object.fromEntries((categories.value ?? []).map(c => [c.id, c])))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (products.value ?? []).filter(p =>
    (showInactive.value || p.active)
    && (!categoryFilter.value || p.category_id === categoryFilter.value)
    && (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)))
})

const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every(p => selected.value.has(p.id)))

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function toggleAll() {
  selected.value = allSelected.value ? new Set() : new Set(filtered.value.map(p => p.id))
}

function printSelected() {
  const list = (products.value ?? []).filter(p => selected.value.has(p.id))
  if (list.length) printing.value = list
}

async function onSaved() {
  editing.value = null
  creating.value = false
  await refreshProducts()
}

async function toggleActive(p: AdminProduct) {
  try {
    await api(`/api/robinadmin/products/${p.id}`, { method: 'PATCH', body: { active: !p.active } })
    await refreshProducts()
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function addCategory() {
  if (!newCat.name.trim()) return
  try {
    await api('/api/robinadmin/categories', { method: 'POST', body: { ...newCat, sort: (categories.value?.length ?? 0) + 1 } })
    newCat.name = ''
    await refreshCategories()
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function updateCategory(c: AdminCategory) {
  try {
    await api(`/api/robinadmin/categories/${c.id}`, { method: 'PATCH', body: { name: c.name, color: c.color, sort: c.sort } })
    show('Categorie opgeslagen', 'ok')
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function removeCategory(c: AdminCategory) {
  if (!await ask({ title: `${c.name} verwijderen?`, body: 'Producten in deze categorie blijven bestaan, maar zonder categorie.', confirmLabel: 'Verwijderen', danger: true })) return
  try {
    await api(`/api/robinadmin/categories/${c.id}`, { method: 'DELETE' })
    await Promise.all([refreshCategories(), refreshProducts()])
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    show('Gekopieerd', 'ok')
  }
  catch {
    show('Kopiëren lukt niet in deze browser', 'error')
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-5xl">Producten & QR</h1>
        <p class="mt-1">De QR-code op een product verandert nooit. Print labels en hang ze bij de kratten.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-outline !py-2.5 !text-base" @click="catPanel = !catPanel">Categorieën</button>
        <button type="button" class="btn-primary !py-2.5 !text-base" @click="creating = true">+ Nieuw product</button>
      </div>
    </div>

    <!-- Categorieën -->
    <section v-if="catPanel" class="card">
      <h2 class="text-3xl">Categorieën</h2>
      <ul class="mt-3 space-y-2">
        <li v-for="c in categories" :key="c.id" class="flex flex-wrap items-center gap-2">
          <input v-model="c.name" class="input max-w-xs !py-2" :aria-label="`Naam ${c.name}`">
          <select v-model="c.color" class="input w-36 !py-2" aria-label="Kleur">
            <option value="#115656">Groen</option>
            <option value="#fd644e">Koraal</option>
          </select>
          <input v-model.number="c.sort" type="number" class="input w-20 !py-2" aria-label="Volgorde">
          <button type="button" class="btn-outline !px-4 !py-2 !text-sm" @click="updateCategory(c)">Opslaan</button>
          <button type="button" class="btn-ghost !px-3 !py-2 !text-sm" @click="removeCategory(c)">Verwijderen</button>
        </li>
      </ul>
      <form class="mt-4 flex flex-wrap items-center gap-2" @submit.prevent="addCategory">
        <input v-model="newCat.name" class="input max-w-xs !py-2" placeholder="Nieuwe categorie" aria-label="Nieuwe categorie">
        <select v-model="newCat.color" class="input w-36 !py-2" aria-label="Kleur">
          <option value="#115656">Groen</option>
          <option value="#fd644e">Koraal</option>
        </select>
        <button type="submit" class="btn-primary !px-4 !py-2 !text-sm">Toevoegen</button>
      </form>
    </section>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <input v-model="search" class="input max-w-xs !py-2" type="search" placeholder="Zoek op naam of code" aria-label="Zoeken">
      <select v-model="categoryFilter" class="input w-56 !py-2" aria-label="Categorie">
        <option value="">Alle categorieën</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="showInactive" type="checkbox" class="h-4 w-4 accent-groen"> Ook inactieve
      </label>
    </div>

    <!-- Selectiebalk -->
    <div class="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-groen px-4 py-3 text-beige">
      <label class="flex items-center gap-2">
        <input type="checkbox" class="h-5 w-5 accent-koraal" :checked="allSelected" aria-label="Alles selecteren" @change="toggleAll">
        <span class="font-semibold">{{ selected.size ? `${selected.size} geselecteerd` : 'Selecteer producten om labels te printen' }}</span>
      </label>
      <button type="button" class="btn ml-auto bg-koraal !py-2 !text-base text-white" :disabled="!selected.size" @click="printSelected">
        QR-labels printen (PDF)
      </button>
    </div>

    <p v-if="error" class="card">{{ errorMessage(error, 'Producten ophalen lukt niet.') }}</p>

    <!-- Lijst -->
    <ul class="grid gap-3 md:grid-cols-2">
      <li v-for="p in filtered" :key="p.id" class="card flex items-center gap-3 !p-4" :class="p.active ? '' : 'opacity-60'">
        <input type="checkbox" class="h-5 w-5 shrink-0 accent-groen" :checked="selected.has(p.id)" :aria-label="`Selecteer ${p.name}`" @change="toggle(p.id)">
        <ProductThumb :name="p.name" :image-url="p.image_url" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-lg font-semibold">{{ p.name }}</p>
          <p class="truncate text-sm">
            <code class="rounded bg-beige px-1">{{ p.code }}</code>
            · {{ p.portion }} · {{ STORAGE[p.storage] }}
            <template v-if="p.category_id && catById[p.category_id]"> · {{ catById[p.category_id]!.name }}</template>
            <template v-if="p.max_per_visit"> · max {{ p.max_per_visit }}</template>
          </p>
        </div>
        <span class="shrink-0 rounded-full bg-koraal px-3 py-1 font-display text-2xl text-white" :title="`${p.points} eetpunten`">{{ p.points }}</span>
        <div class="flex shrink-0 flex-col gap-1">
          <button type="button" class="text-sm font-semibold underline" @click="qrFor = p">QR</button>
          <button type="button" class="text-sm font-semibold underline" @click="editing = p">Bewerk</button>
        </div>
      </li>
    </ul>
    <p v-if="products && !filtered.length" class="card">Geen producten gevonden.</p>

    <!-- QR-voorbeeld van één product -->
    <AdminModal v-if="qrFor" :title="qrFor.name" @close="qrFor = null">
      <div class="mx-auto w-64 rounded-3xl bg-koraal p-4">
        <QrImage :value="`${base}/p/${qrFor.code}`" dark="#faf5df" light="#fd644e" :margin="1" />
      </div>
      <p class="mt-4 text-center"><strong>{{ qrFor.points }} {{ qrFor.points === 1 ? 'eetpunt' : 'eetpunten' }}</strong> · {{ qrFor.portion }}</p>
      <p class="mt-2 break-all text-center text-sm">{{ base }}/p/{{ qrFor.code }}</p>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button type="button" class="btn-outline !py-2 !text-base" @click="copy(`${base}/p/${qrFor.code}`)">Kopieer link</button>
        <button type="button" class="btn-primary !py-2 !text-base" @click="printing = [qrFor]; qrFor = null">Label printen</button>
      </div>
      <button type="button" class="btn-ghost mt-2 w-full !text-sm" @click="toggleActive(qrFor); qrFor = null">
        {{ qrFor.active ? 'Op inactief zetten' : 'Weer actief maken' }}
      </button>
    </AdminModal>

    <AdminProductForm v-if="creating || editing" :product="editing" :categories="categories ?? []" @close="creating = false; editing = null" @saved="onSaved" />
    <AdminLabelPrintDialog v-if="printing" :products="printing" @close="printing = null" />
  </div>
</template>
