<script setup lang="ts">
import type { AdminHouseholdDetail, AdminVisit } from '~/types/admin'
import { yearBudget } from '~/utils/budget'
import { formatDateTime, formatPoints, pointsLabel } from '~/utils/format'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const isNew = computed(() => id.value === 'nieuw')
useHead({ title: () => (isNew.value ? 'Nieuw huishouden' : 'Huishouden') + ' · Robin beheer' })

const { api } = useAdminApi()
const { show } = useToast()
const { ask } = useConfirm()
const base = useSiteBase()

const thisMonth = new Date().toISOString().slice(0, 7)
const form = reactive({
  name: '',
  email: '',
  start_month: thisMonth,
  budget_override: '' as number | '',
  manual: false,
  notes: '',
  members: [{ name: '', age: '' as number | '' }],
})
const detail = ref<AdminHouseholdDetail | null>(null)
const visits = ref<AdminVisit[]>([])
const busy = ref(false)
const loadError = ref('')

async function load() {
  if (isNew.value) return
  try {
    const d = await api<AdminHouseholdDetail>(`/api/robinadmin/households/${id.value}`)
    detail.value = d
    Object.assign(form, {
      name: d.name,
      email: d.email ?? '',
      start_month: d.start_month.slice(0, 7),
      budget_override: d.budget_override ?? '',
      manual: d.budget_override !== null,
      notes: d.notes ?? '',
      members: d.members.length ? d.members.map(m => ({ name: m.name ?? '', age: m.age })) : [{ name: '', age: '' }],
    })
    visits.value = await api<AdminVisit[]>('/api/robinadmin/visits', { query: { household: id.value } })
  }
  catch (e) {
    loadError.value = errorMessage(e, 'Huishouden ophalen lukt niet.')
  }
}
await useAsyncData(`admin-household-${id.value}`, async () => {
  await load()
  return true
})

const membersForBudget = computed(() => form.members.filter(m => m.age !== '').map(m => ({ age: Number(m.age) })))
const computedBudget = computed(() => yearBudget(membersForBudget.value, null))
const effectiveBudget = computed(() => yearBudget(membersForBudget.value, form.manual && form.budget_override !== '' ? Number(form.budget_override) : null))

function addMember() {
  form.members.push({ name: '', age: '' })
}
function removeMember(i: number) {
  form.members.splice(i, 1)
}

async function save() {
  busy.value = true
  try {
    const body = {
      name: form.name,
      email: form.email,
      start_month: form.start_month,
      budget_override: form.manual && form.budget_override !== '' ? Number(form.budget_override) : null,
      notes: form.notes,
      members: form.members.filter(m => m.name.trim() || m.age !== ''),
    }
    if (isNew.value) {
      const { id: newId } = await api<{ id: string }>('/api/robinadmin/households', { method: 'POST', body })
      show('Huishouden toegevoegd', 'ok')
      await navigateTo(`/robinadmin/huishoudens/${newId}`, { replace: true })
    }
    else {
      await api(`/api/robinadmin/households/${id.value}`, { method: 'PATCH', body })
      show('Opgeslagen', 'ok')
      await load()
    }
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
  finally {
    busy.value = false
  }
}

async function printCard() {
  if (!detail.value) return
  try {
    const [{ buildCardsPdf }, { loadBrandAssets }] = await Promise.all([import('~/utils/pdf/cards'), import('~/utils/pdf/brand')])
    openPdf(await buildCardsPdf([{ name: detail.value.name, cardCode: detail.value.card_code }], base.value, await loadBrandAssets()), 'robin-ledenpas.pdf')
  }
  catch (e) {
    show(errorMessage(e, 'De PDF maken lukt niet.'), 'error')
  }
}

async function newCard() {
  const ok = await ask({
    title: 'Nieuwe pascode maken?',
    body: 'De huidige ledenpas werkt daarna niet meer. Telefoons die met die pas zijn ingelogd, worden uitgelogd.',
    confirmLabel: 'Ja, nieuwe pascode',
    danger: true,
  })
  if (!ok || !detail.value) return
  try {
    const { card_code } = await api<{ card_code: string }>(`/api/robinadmin/households/${id.value}/card`, { method: 'POST' })
    detail.value = { ...detail.value, card_code }
    show('Nieuwe pascode gemaakt. Print de pas opnieuw.', 'ok')
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

async function remove() {
  const ok = await ask({
    title: `${form.name} verwijderen?`,
    body: 'Ook alle bezoeken en registraties van dit huishouden worden verwijderd. Dit kan niet ongedaan worden.',
    confirmLabel: 'Definitief verwijderen',
    danger: true,
  })
  if (!ok) return
  try {
    await api(`/api/robinadmin/households/${id.value}`, { method: 'DELETE' })
    show('Huishouden verwijderd', 'ok')
    await navigateTo('/robinadmin/huishoudens')
  }
  catch (e) {
    show(errorMessage(e), 'error')
  }
}

function visitPoints(v: AdminVisit) {
  return v.scans.filter(s => !s.removed_at).reduce((n, s) => n + s.points * s.quantity, 0)
}
const STATUS: Record<string, string> = { open: 'In de winkel', closed: 'Afgerond', expired: 'Niet afgerond bij de kassa' }
</script>

<template>
  <div class="space-y-5">
    <NuxtLink to="/robinadmin/huishoudens" class="text-sm font-semibold underline">← Alle huishoudens</NuxtLink>
    <h1 class="text-5xl">{{ isNew ? 'Nieuw huishouden' : form.name || 'Huishouden' }}</h1>
    <p v-if="loadError" class="card">{{ loadError }}</p>

    <div class="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <form class="card space-y-4" @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label" for="h-name">Naam</label>
            <input id="h-name" v-model="form.name" class="input" required maxlength="80" placeholder="Familie Jansen">
          </div>
          <div>
            <label class="label" for="h-email">E-mail (optioneel, voor inloglink)</label>
            <input id="h-email" v-model="form.email" class="input" type="email" autocomplete="off">
          </div>
          <div>
            <label class="label" for="h-start">Startmaand</label>
            <input id="h-start" v-model="form.start_month" class="input" type="month" required>
            <p class="mt-1 text-xs">Vanaf deze maand bouwt het huishouden eetpunten op.</p>
          </div>
        </div>

        <fieldset>
          <legend class="label">Gezinsleden</legend>
          <ul class="space-y-2">
            <li v-for="(m, i) in form.members" :key="i" class="flex items-center gap-2">
              <input v-model="m.name" class="input !py-2" placeholder="Naam (optioneel)" :aria-label="`Naam gezinslid ${i + 1}`">
              <input v-model.number="m.age" class="input w-28 !py-2" type="number" min="0" max="120" placeholder="Leeftijd" :aria-label="`Leeftijd gezinslid ${i + 1}`">
              <button type="button" class="btn-ghost !px-3 !py-2 !text-sm" :aria-label="`Verwijder gezinslid ${i + 1}`" @click="removeMember(i)">×</button>
            </li>
          </ul>
          <button type="button" class="btn-outline mt-2 !py-2 !text-sm" @click="addMember">+ Gezinslid</button>
        </fieldset>

        <div class="rounded-2xl bg-beige p-4">
          <p>Berekend jaarbudget: <strong>{{ pointsLabel(computedBudget) }}</strong> (ongeveer {{ formatPoints(Math.round(computedBudget / 12)) }} per maand)</p>
          <label class="mt-3 flex items-center gap-2">
            <input v-model="form.manual" type="checkbox" class="h-5 w-5 accent-groen">
            <span>Handmatig jaarbudget gebruiken</span>
          </label>
          <div v-if="form.manual" class="mt-2">
            <label class="label" for="h-override">Jaarbudget</label>
            <input id="h-override" v-model.number="form.budget_override" class="input w-48" type="number" min="0">
          </div>
          <p class="mt-3 font-semibold">Dit huishouden krijgt {{ pointsLabel(effectiveBudget) }} per jaar.</p>
        </div>

        <div>
          <label class="label" for="h-notes">Notities (alleen voor beheer)</label>
          <textarea id="h-notes" v-model="form.notes" class="input" rows="2" />
        </div>

        <div class="flex flex-wrap gap-3">
          <button type="submit" class="btn-primary" :disabled="busy">{{ busy ? 'Opslaan…' : 'Opslaan' }}</button>
          <button v-if="!isNew" type="button" class="btn-ghost ml-auto text-koraal-donker" @click="remove">Verwijderen</button>
        </div>
      </form>

      <aside v-if="detail" class="space-y-4">
        <section v-if="detail.balance" class="card-groen">
          <p class="text-sm font-semibold">Saldo</p>
          <p class="font-display text-5xl">{{ formatPoints(detail.balance.available) }}</p>
          <p class="text-sm">Deze maand {{ formatPoints(detail.balance.spent_month) }} van {{ formatPoints(detail.balance.month_budget) }} gebruikt</p>
          <p v-if="detail.balance.advance_this_month" class="mt-1 text-sm">Voorschot van volgende maand gebruikt (+{{ formatPoints(detail.balance.advance_this_month) }})</p>
        </section>

        <section class="card">
          <h2 class="text-3xl">Ledenpas</h2>
          <div class="mx-auto mt-3 w-40 rounded-2xl bg-beige p-2">
            <QrImage :value="`${base}/pas/${detail.card_code}`" :margin="1" />
          </div>
          <p class="mt-2 text-center text-xs break-all">{{ base }}/pas/{{ detail.card_code }}</p>
          <button type="button" class="btn-primary mt-3 w-full !py-2.5 !text-base" @click="printCard">Pas printen (PDF)</button>
          <button type="button" class="btn-ghost mt-1 w-full !py-2 !text-sm" @click="newCard">Nieuwe pascode (oude pas blokkeren)</button>
        </section>

        <section class="card">
          <h2 class="text-3xl">Bezoeken</h2>
          <p v-if="!visits.length" class="mt-2 text-sm">Nog geen bezoeken.</p>
          <ul v-else class="mt-2 divide-y divide-zand-donker text-sm">
            <li v-for="v in visits.slice(0, 10)" :key="v.id" class="flex justify-between py-2">
              <span>{{ formatDateTime(v.started_at) }}<br><span class="text-xs">{{ STATUS[v.status] }}</span></span>
              <span class="font-semibold">{{ formatPoints(visitPoints(v)) }} p</span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>
