<script setup lang="ts">
import type { AdminVisit } from '~/types/admin'
import { formatDateTime, formatPoints, formatTime } from '~/utils/format'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Registraties · Robin beheer' })

const { api } = useAdminApi()
const { data: visits, refresh, error } = await useAsyncData('admin-visits', () => api<AdminVisit[]>('/api/robinadmin/visits'))
const open = ref<string | null>(null)

const STATUS: Record<string, { label: string, cls: string }> = {
  open: { label: 'In de winkel', cls: 'bg-groen text-beige' },
  closed: { label: 'Afgerond', cls: 'bg-beige' },
  expired: { label: 'Niet afgerond', cls: 'bg-koraal text-white' },
}

function isStale(v: AdminVisit) {
  return v.status === 'open' && Date.now() - new Date(v.started_at).getTime() > 4 * 3600_000
}
function active(v: AdminVisit) {
  return v.scans.filter(s => !s.removed_at)
}
function points(v: AdminVisit) {
  return active(v).reduce((n, s) => n + s.points * s.quantity, 0)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-5xl">Registraties</h1>
        <p class="mt-1">De laatste 100 bezoeken. Klik op een bezoek om de gescande producten te zien.</p>
      </div>
      <button type="button" class="btn-outline !py-2 !text-base" @click="refresh()">Vernieuwen</button>
    </div>

    <p v-if="error" class="card">{{ errorMessage(error, 'Registraties ophalen lukt niet.') }}</p>
    <p v-else-if="visits && !visits.length" class="card">Nog geen bezoeken.</p>

    <ul class="space-y-2">
      <li v-for="v in visits" :key="v.id" class="card !p-0">
        <button type="button" class="flex w-full flex-wrap items-center gap-3 p-4 text-left" :aria-expanded="open === v.id" @click="open = open === v.id ? null : v.id">
          <span class="min-w-40 font-semibold">{{ formatDateTime(v.started_at) }}</span>
          <span class="flex-1">{{ v.household?.name ?? 'Verwijderd huishouden' }}</span>
          <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="(isStale(v) ? STATUS.expired : STATUS[v.status])!.cls">
            {{ isStale(v) ? 'Niet afgerond' : STATUS[v.status]?.label }}
          </span>
          <span class="w-28 text-right">{{ active(v).length }} producten</span>
          <span class="w-20 text-right font-display text-2xl">{{ formatPoints(points(v)) }}</span>
        </button>
        <ul v-if="open === v.id" class="border-t border-zand-donker px-4 py-2 text-sm">
          <li v-for="s in v.scans" :key="s.id" class="flex justify-between py-1" :class="s.removed_at ? 'line-through opacity-60' : ''">
            <span>{{ formatTime(s.created_at) }} · {{ s.product?.name ?? '?' }}</span>
            <span>{{ s.points * s.quantity }} p{{ s.removed_at ? ' (teruggelegd)' : '' }}</span>
          </li>
          <li v-if="!v.scans.length" class="py-1">Geen producten gescand.</li>
        </ul>
      </li>
    </ul>
  </div>
</template>
