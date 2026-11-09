<script setup lang="ts">
import type { AdminHouseholdRow } from '~/types/admin'
import { formatPoints } from '~/utils/format'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Huishoudens · Robin beheer' })

const { api } = useAdminApi()
const { show } = useToast()
const base = useSiteBase()
const { data: households, error } = await useAsyncData('admin-households', () => api<AdminHouseholdRow[]>('/api/robinadmin/households'))

const search = ref('')
const selected = ref<Set<string>>(new Set())
const busy = ref(false)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (households.value ?? []).filter(h => !q || h.name.toLowerCase().includes(q) || (h.email ?? '').includes(q))
})
const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every(h => selected.value.has(h.id)))

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

async function printCards() {
  const list = (households.value ?? []).filter(h => selected.value.has(h.id))
  if (!list.length) return
  busy.value = true
  try {
    const [{ buildCardsPdf }, { loadBrandAssets }] = await Promise.all([import('~/utils/pdf/cards'), import('~/utils/pdf/brand')])
    const pdf = await buildCardsPdf(list.map(h => ({ name: h.name, cardCode: h.card_code })), base.value, await loadBrandAssets())
    openPdf(pdf, 'robin-ledenpassen.pdf')
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
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-5xl">Huishoudens</h1>
        <p class="mt-1">Jaarbudget = som per gezinslid (13+: 7.280 · 9–12: 6.240 · 4–8: 5.200), of handmatig.</p>
      </div>
      <NuxtLink to="/robinadmin/huishoudens/nieuw" class="btn-primary !py-2.5 !text-base">+ Nieuw huishouden</NuxtLink>
    </div>

    <input v-model="search" class="input max-w-xs !py-2" type="search" placeholder="Zoek op naam of e-mail" aria-label="Zoeken">

    <div class="flex flex-wrap items-center gap-3 rounded-2xl bg-groen px-4 py-3 text-beige">
      <label class="flex items-center gap-2">
        <input type="checkbox" class="h-5 w-5 accent-koraal" :checked="allSelected" aria-label="Alles selecteren" @change="selected = allSelected ? new Set() : new Set(filtered.map(h => h.id))">
        <span class="font-semibold">{{ selected.size ? `${selected.size} geselecteerd` : 'Selecteer huishoudens om ledenpassen te printen' }}</span>
      </label>
      <button type="button" class="btn ml-auto bg-koraal !py-2 !text-base text-white" :disabled="!selected.size || busy" @click="printCards">
        {{ busy ? 'PDF maken…' : 'Ledenpassen printen (PDF)' }}
      </button>
    </div>

    <p v-if="error" class="card">{{ errorMessage(error, 'Huishoudens ophalen lukt niet.') }}</p>

    <div class="overflow-x-auto rounded-3xl bg-zand">
      <table class="w-full min-w-[640px] text-left">
        <thead class="text-sm">
          <tr class="border-b border-zand-donker">
            <th class="w-10 p-3"><span class="sr-only">Selectie</span></th>
            <th class="p-3">Naam</th>
            <th class="p-3">Gezinsleden</th>
            <th class="p-3 text-right">Jaarbudget</th>
            <th class="p-3 text-right">Per maand</th>
            <th class="p-3 text-right">Saldo</th>
            <th class="p-3">Inloggen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in filtered" :key="h.id" class="border-b border-zand-donker/60 last:border-0">
            <td class="p-3"><input type="checkbox" class="h-5 w-5 accent-groen" :checked="selected.has(h.id)" :aria-label="`Selecteer ${h.name}`" @change="toggle(h.id)"></td>
            <td class="p-3">
              <NuxtLink :to="`/robinadmin/huishoudens/${h.id}`" class="font-semibold underline underline-offset-4">{{ h.name }}</NuxtLink>
              <span v-if="h.budget_override !== null" class="ml-2 rounded-full bg-beige px-2 py-0.5 text-xs">handmatig budget</span>
            </td>
            <td class="p-3">{{ h.members }}</td>
            <td class="p-3 text-right">{{ formatPoints(h.balance.year_budget) }}</td>
            <td class="p-3 text-right">{{ formatPoints(h.balance.month_allowance) }}</td>
            <td class="p-3 text-right font-display text-2xl" :class="h.balance.available < 0 ? 'text-koraal-donker' : ''">{{ formatPoints(h.balance.available) }}</td>
            <td class="p-3 text-sm">{{ h.email ? 'Pas + e-mail' : 'Pas' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="households && !filtered.length" class="p-4">Nog geen huishoudens.</p>
    </div>
  </div>
</template>
