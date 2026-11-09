<script setup lang="ts">
import { formatDateTime, formatPoints, monthName, pointsLabel } from '~/utils/format'

useHead({ title: 'Saldo · Robin' })

const supabase = useSupabaseClient()
const { overview, refresh } = useOverview()
await useAsyncData('overview', () => refresh())

const { data: visits } = await useAsyncData('my-visits', async () => {
  const { data } = await supabase
    .from('visits')
    .select('id, started_at, ended_at, status, scans(points, quantity, removed_at)')
    .order('started_at', { ascending: false })
    .limit(20)
  return (data ?? []).map(v => ({
    ...v,
    items: v.scans.filter(s => !s.removed_at).reduce((n, s) => n + s.quantity, 0),
    points: v.scans.filter(s => !s.removed_at).reduce((n, s) => n + s.points * s.quantity, 0),
  }))
})

const balance = computed(() => overview.value?.balance)
const now = new Date()
const thisMonth = monthName(now)
const nextMonth = monthName(new Date(now.getFullYear(), now.getMonth() + 1, 1))
const lastMonth = monthName(new Date(now.getFullYear(), now.getMonth() - 1, 1))
const usedPct = computed(() => {
  const b = balance.value
  if (!b || b.month_budget <= 0) return b && b.spent_month > 0 ? 100 : 0
  return Math.min(100, Math.round((b.spent_month / b.month_budget) * 100))
})

const STATUS: Record<string, string> = { open: 'Bezig', closed: 'Afgerond', expired: 'Niet afgerond bij de kassa' }
</script>

<template>
  <div class="space-y-5 pt-2">
    <h1 class="text-5xl">Saldo</h1>

    <template v-if="balance">
      <SaldoCard :balance="balance" />

      <section class="card-groen">
        <p class="text-lg font-semibold">Deze maand ({{ thisMonth }})</p>
        <p class="font-display text-4xl">{{ formatPoints(balance.spent_month) }} van {{ formatPoints(balance.month_budget) }} punten</p>
        <div class="mt-3 h-3 overflow-hidden rounded-full bg-beige/90" role="progressbar" :aria-valuenow="usedPct" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full rounded-full bg-[#8fc4bd]" :style="{ width: `${usedPct}%` }" />
        </div>
        <p class="mt-3 text-sm">Wat je deze maand niet gebruikt, schuift door naar volgende maand.</p>
      </section>

      <section v-if="balance.advance_this_month > 0" class="card">
        <p class="font-display text-3xl">Budget van {{ nextMonth }} gebruikt</p>
        <p class="mt-1 text-base">Je gebruikt deze maand al {{ pointsLabel(balance.advance_this_month) }} van {{ nextMonth }}. In {{ nextMonth }} krijg je die punten dus niet nog een keer.</p>
      </section>
      <section v-else-if="balance.advance_last_month" class="card">
        <p class="font-display text-3xl">Vorige maand vooruit gebruikt</p>
        <p class="mt-1 text-base">In {{ lastMonth }} gebruikte je het budget van deze maand al. Deze maand kun je daarom niet nog een keer vooruit.</p>
      </section>

      <section class="card">
        <dl class="grid grid-cols-2 gap-y-2 text-base">
          <dt>Jaarbudget</dt><dd class="text-right font-semibold">{{ pointsLabel(balance.year_budget) }}</dd>
          <dt>Per maand</dt><dd class="text-right font-semibold">{{ pointsLabel(balance.month_allowance) }}</dd>
          <dt>Opgebouwd dit jaar</dt><dd class="text-right font-semibold">{{ pointsLabel(balance.accrued) }}</dd>
          <dt>Gebruikt dit jaar</dt><dd class="text-right font-semibold">{{ pointsLabel(balance.spent_year) }}</dd>
        </dl>
      </section>
    </template>

    <section>
      <h2 class="mb-3 text-4xl">Je bezoeken</h2>
      <p v-if="!visits?.length" class="text-lg">Nog geen bezoeken.</p>
      <ul v-else class="space-y-2">
        <li v-for="v in visits" :key="v.id" class="card flex items-center justify-between !py-4">
          <div>
            <p class="text-lg font-semibold">{{ formatDateTime(v.started_at) }}</p>
            <p class="text-sm">{{ v.items === 1 ? '1 product' : `${v.items} producten` }} · {{ STATUS[v.status] ?? v.status }}</p>
          </div>
          <span class="font-display text-3xl">−{{ formatPoints(v.points) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
