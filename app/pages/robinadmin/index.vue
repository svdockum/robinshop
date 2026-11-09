<script setup lang="ts">
import { formatPoints } from '~/utils/format'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Beheer · Robin' })

interface Stats {
  visits_today: number
  open_visits: number
  not_checked_out: number
  scans_today: number
  points_today: number
  points_month: number
  households: number
  products: number
  categories: { name: string, color: string, points: number }[]
  top_products: { name: string, count: number, points: number }[]
}

const { api } = useAdminApi()
const { data: stats, error, refresh } = await useAsyncData('admin-stats', () => api<Stats>('/api/robinadmin/stats'))
const maxCat = computed(() => Math.max(1, ...(stats.value?.categories ?? []).map(c => c.points)))
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h1 class="text-5xl">Overzicht</h1>
      <button type="button" class="btn-outline !py-2 !text-base" @click="refresh()">Vernieuwen</button>
    </div>

    <p v-if="error" class="card">{{ errorMessage(error, 'Cijfers ophalen lukt niet.') }}</p>

    <template v-else-if="stats">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="card-groen">
          <p class="text-sm font-semibold">Nu in de winkel</p>
          <p class="font-display text-5xl">{{ stats.open_visits }}</p>
        </div>
        <div class="card">
          <p class="text-sm font-semibold">Bezoeken vandaag</p>
          <p class="font-display text-5xl">{{ stats.visits_today }}</p>
        </div>
        <div class="card">
          <p class="text-sm font-semibold">Punten vandaag</p>
          <p class="font-display text-5xl">{{ formatPoints(stats.points_today) }}</p>
          <p class="text-sm">{{ stats.scans_today }} scans</p>
        </div>
        <div class="card">
          <p class="text-sm font-semibold">Punten deze maand</p>
          <p class="font-display text-5xl">{{ formatPoints(stats.points_month) }}</p>
        </div>
      </div>

      <p v-if="stats.not_checked_out" class="rounded-2xl bg-koraal px-4 py-3 text-white">
        {{ stats.not_checked_out }} {{ stats.not_checked_out === 1 ? 'bezoek is' : 'bezoeken zijn' }} niet afgerond bij de kassa.
        <NuxtLink to="/robinadmin/registraties" class="font-semibold underline">Bekijk registraties</NuxtLink>
      </p>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="card">
          <h2 class="text-3xl">Punten per categorie (deze maand)</h2>
          <ul class="mt-4 space-y-3">
            <li v-for="c in stats.categories" :key="c.name" class="grid grid-cols-[10rem_1fr_4rem] items-center gap-3">
              <span class="truncate">{{ c.name }}</span>
              <span class="h-3 overflow-hidden rounded-full bg-zand-donker/60">
                <span class="block h-full rounded-full" :style="{ width: `${Math.round((c.points / maxCat) * 100)}%`, backgroundColor: c.color }" />
              </span>
              <span class="text-right font-display text-2xl">{{ formatPoints(c.points) }}</span>
            </li>
          </ul>
        </section>
        <section class="card">
          <h2 class="text-3xl">Meest meegenomen (deze maand)</h2>
          <p v-if="!stats.top_products.length" class="mt-3">Nog geen scans deze maand.</p>
          <ol v-else class="mt-3 divide-y divide-zand-donker">
            <li v-for="p in stats.top_products" :key="p.name" class="flex justify-between py-2">
              <span>{{ p.name }}</span>
              <span class="font-semibold">{{ p.count }}× · {{ formatPoints(p.points) }} p</span>
            </li>
          </ol>
        </section>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <NuxtLink to="/robinadmin/producten" class="card block hover:bg-zand-donker/50">
          <p class="font-display text-3xl">{{ stats.products }} producten</p>
          <p class="text-sm">Beheren en QR-labels printen</p>
        </NuxtLink>
        <NuxtLink to="/robinadmin/huishoudens" class="card block hover:bg-zand-donker/50">
          <p class="font-display text-3xl">{{ stats.households }} huishoudens</p>
          <p class="text-sm">Budget, gezinsleden en ledenpassen</p>
        </NuxtLink>
        <NuxtLink to="/robinadmin/scanpunten" class="card block hover:bg-zand-donker/50">
          <p class="font-display text-3xl">Ingang & kassa</p>
          <p class="text-sm">Schermen met wisselende QR-code</p>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
