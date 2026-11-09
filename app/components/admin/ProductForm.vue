<script setup lang="ts">
import type { AdminCategory, AdminProduct } from '~/types/admin'

const props = defineProps<{ product: AdminProduct | null, categories: AdminCategory[] }>()
const emit = defineEmits<{ close: [], saved: [product: AdminProduct] }>()

const { api } = useAdminApi()
const { show } = useToast()
const { ask } = useConfirm()

const form = reactive({
  name: props.product?.name ?? '',
  code: props.product?.code ?? '',
  category_id: props.product?.category_id ?? props.categories[0]?.id ?? null,
  storage: props.product?.storage ?? 'vers',
  points: props.product?.points ?? 1,
  portion: props.product?.portion ?? '1 stuk',
  max_per_visit: props.product?.max_per_visit ?? null as number | null,
  active: props.product?.active ?? true,
})
const codeTouched = ref(!!props.product)
const busy = ref(false)
const file = ref<File | null>(null)
const preview = ref<string | null>(props.product?.image_url ?? null)

watch(() => form.name, (name) => {
  if (!codeTouched.value) {
    form.code = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)
  }
})

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  file.value = f
  if (f) preview.value = URL.createObjectURL(f)
}

async function save() {
  busy.value = true
  try {
    const body = { ...form, max_per_visit: form.max_per_visit || null }
    let saved = props.product
      ? await api<AdminProduct>(`/api/robinadmin/products/${props.product.id}`, { method: 'PATCH', body })
      : await api<AdminProduct>('/api/robinadmin/products', { method: 'POST', body })
    if (file.value) {
      const fd = new FormData()
      fd.append('file', file.value)
      saved = await api<AdminProduct>(`/api/robinadmin/product-image/${saved.id}`, { method: 'POST', body: fd })
    }
    show(props.product ? 'Product opgeslagen' : 'Product toegevoegd', 'ok')
    emit('saved', saved)
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
  finally {
    busy.value = false
  }
}

async function remove() {
  if (!props.product) return
  const ok = await ask({
    title: `${props.product.name} verwijderen?`,
    body: 'Heeft dit product al registraties, zet het dan op inactief. Geprinte labels werken daarna niet meer.',
    confirmLabel: 'Verwijderen',
    danger: true,
  })
  if (!ok) return
  try {
    await api(`/api/robinadmin/products/${props.product.id}`, { method: 'DELETE' })
    show('Product verwijderd', 'ok')
    emit('saved', { ...props.product, active: false, id: '' })
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}
</script>

<template>
  <AdminModal :title="product ? 'Product bewerken' : 'Nieuw product'" wide @close="emit('close')">
    <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="save">
      <div class="sm:col-span-2">
        <label class="label" for="p-name">Naam</label>
        <input id="p-name" v-model="form.name" class="input" required maxlength="80" placeholder="Bijv. Prei">
      </div>
      <div>
        <label class="label" for="p-code">Code (in de QR)</label>
        <input id="p-code" v-model="form.code" class="input uppercase" required maxlength="32" pattern="[A-Za-z0-9\-]{2,32}" @input="codeTouched = true">
        <p class="mt-1 text-xs">Letters, cijfers en streepjes. Verandert de code, dan moet je het label opnieuw printen.</p>
      </div>
      <div>
        <label class="label" for="p-points">Eetpunten</label>
        <input id="p-points" v-model.number="form.points" class="input" type="number" min="1" max="999" required>
      </div>
      <div>
        <label class="label" for="p-cat">Categorie</label>
        <select id="p-cat" v-model="form.category_id" class="input">
          <option :value="null">Geen</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="label" for="p-storage">Bewaarwijze</label>
        <select id="p-storage" v-model="form.storage" class="input">
          <option value="vers">Vers</option>
          <option value="koel">Gekoeld</option>
          <option value="vries">Diepvries</option>
          <option value="houdbaar">Houdbaar</option>
        </select>
      </div>
      <div>
        <label class="label" for="p-portion">Portie</label>
        <input id="p-portion" v-model="form.portion" class="input" maxlength="40" placeholder="1 stuk, 1 kilo, 1 schep">
      </div>
      <div>
        <label class="label" for="p-max">Maximum per bezoek</label>
        <input id="p-max" v-model.number="form.max_per_visit" class="input" type="number" min="1" placeholder="Geen maximum">
      </div>
      <div class="sm:col-span-2 flex items-center gap-4">
        <ProductThumb :name="form.name || '?'" :image-url="preview" />
        <div class="flex-1">
          <label class="label" for="p-photo">Foto (optioneel)</label>
          <input id="p-photo" type="file" accept="image/jpeg,image/png,image/webp" class="text-sm" @change="onFile">
        </div>
      </div>
      <label class="flex items-center gap-2 sm:col-span-2">
        <input v-model="form.active" type="checkbox" class="h-5 w-5 accent-groen">
        <span>Actief (te scannen in de winkel)</span>
      </label>
      <div class="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" class="btn-primary" :disabled="busy">{{ busy ? 'Opslaan…' : 'Opslaan' }}</button>
        <button type="button" class="btn-outline" @click="emit('close')">Annuleren</button>
        <button v-if="product" type="button" class="btn-ghost ml-auto text-koraal-donker" @click="remove">Verwijderen</button>
      </div>
    </form>
  </AdminModal>
</template>
