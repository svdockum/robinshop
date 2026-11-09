<script setup lang="ts">
import { describeMembers, formatPoints, monthName, pointsLabel } from '~/utils/format'

useHead({ title: 'Home · Robin' })

const { overview, refresh } = useOverview()
const { error } = await useAsyncData('overview', () => refresh())

const balance = computed(() => overview.value?.balance)
const visit = computed(() => overview.value?.visit)
const members = computed(() => overview.value?.members ?? [])
const month = monthName()

onMounted(() => {
  // Altijd actueel na terugkomen in de app
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible))
function onVisible() {
  if (document.visibilityState === 'visible') refresh().catch(() => {})
}
</script>

<template>
  <div class="space-y-5 pt-2">
    <div v-if="error" class="card">
      <p class="text-lg">We kunnen je gegevens nu niet ophalen. Controleer je internet en probeer het opnieuw.</p>
      <button type="button" class="btn-primary mt-3" @click="refresh()">Opnieuw</button>
    </div>

    <!-- Beheerder zonder huishouden -->
    <div v-else-if="overview && !overview.household" class="space-y-4">
      <h1 class="text-5xl">Hoi!</h1>
      <p class="text-lg">Dit account hoort niet bij een huishouden.</p>
      <NuxtLink v-if="overview.is_admin" to="/robinadmin" class="btn-primary w-full">Naar beheer</NuxtLink>
      <NuxtLink v-else to="/profiel" class="btn-outline w-full">Uitloggen</NuxtLink>
    </div>

    <template v-else-if="overview?.household && balance">
      <div class="relative">
        <div class="absolute -top-16 -right-5 h-28 w-20 rounded-bl-full bg-koraal" aria-hidden="true" />
        <h1 class="pr-16 text-5xl">Hoi {{ overview.household.name }}!</h1>
        <p class="mt-1 text-xl font-semibold">Samen eten, samen kiezen</p>
      </div>

      <!-- Status van het bezoek -->
      <section v-if="visit" class="card-groen anim-rise">
        <p class="flex items-center gap-2 text-lg font-semibold">
          <span class="live-dot h-3 w-3 rounded-full bg-beige" aria-hidden="true" /> Je bent in de winkel
        </p>
        <div class="mt-2 flex items-center gap-3">
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-beige/15"><RIcon name="basket" class="h-7 w-7" label="Mandje" /></span>
          <p class="font-display text-4xl">{{ visit.items.length }} <span class="text-2xl">·</span> <AnimatedNumber :value="visit.points" /> <span class="text-2xl">punten</span></p>
        </div>
        <NuxtLink to="/scan" class="btn mt-4 w-full bg-beige text-groen"><RIcon name="phone-scan" class="h-6 w-6" /> Verder scannen</NuxtLink>
        <p class="mt-3 flex items-center gap-2 text-sm"><RIcon name="gate" class="h-5 w-5" /> Klaar? Scan de QR-code bij de kassa.</p>
      </section>
      <section v-else class="card anim-rise">
        <div class="flex items-center gap-4">
          <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-groen text-beige"><RIcon name="gate" class="h-8 w-8" /></span>
          <div>
            <p class="font-display text-3xl leading-tight">Boodschappen doen?</p>
            <p class="text-base">Scan de QR-code bij de ingang.</p>
          </div>
        </div>
        <NuxtLink to="/scan" class="btn-primary mt-4 w-full"><RIcon name="phone-scan" class="h-6 w-6" /> Scannen</NuxtLink>
      </section>

      <section class="card-groen anim-rise" style="animation-delay: 60ms">
        <p class="text-2xl font-semibold">Jullie eetpunten</p>
        <div class="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div>
            <p class="font-display text-5xl"><AnimatedNumber :value="balance.year_budget" :from="0" :duration="900" /></p>
            <p class="text-lg">per jaar</p>
          </div>
          <span class="h-14 w-0.5 bg-beige/70" aria-hidden="true" />
          <div>
            <p class="font-display text-5xl"><AnimatedNumber :value="balance.month_allowance" :from="0" :duration="900" :delay="120" /></p>
            <p class="text-lg">per maand</p>
          </div>
        </div>
      </section>

      <section class="card anim-rise flex items-center gap-4" style="animation-delay: 120ms">
        <span class="flex h-12 shrink-0 items-end gap-0.5 text-groen" aria-hidden="true">
          <svg
            v-for="(m, i) in members.slice(0, 6)"
            :key="i"
            viewBox="0 0 16 32"
            fill="currentColor"
            class="anim-rise w-auto"
            :class="m.age >= 18 ? 'h-12' : m.age >= 9 ? 'h-9' : 'h-7'"
            :style="{ animationDelay: `${200 + i * 70}ms` }"
          >
            <circle cx="8" cy="5" r="4.5" /><path d="M2 12.5A2.5 2.5 0 0 1 4.5 10h7a2.5 2.5 0 0 1 2.5 2.5L15 22h-3v10H9.3v-8H6.7v8H4V22H1Z" />
          </svg>
          <span v-if="members.length > 6" class="font-display text-2xl">+{{ members.length - 6 }}</span>
        </span>
        <div>
          <p class="text-xl font-semibold">{{ members.length === 1 ? '1 gezinslid' : `${members.length} gezinsleden` }}</p>
          <p class="text-sm">{{ describeMembers(members) }}</p>
        </div>
      </section>

      <section v-if="overview.categories?.length" class="anim-rise" style="animation-delay: 180ms">
        <h2 class="mb-3 text-4xl">Zo eten we in {{ month }}</h2>
        <CategoryBars :categories="overview.categories" :scale="Math.max(balance.month_budget / 2, 1)" />
        <p class="mt-3 text-sm">Gebruikt deze maand: {{ formatPoints(balance.spent_month) }} van {{ formatPoints(balance.month_budget) }} punten</p>
      </section>

      <SaldoCard :balance="balance" class="anim-rise" style="animation-delay: 240ms" />
    </template>

    <div v-else class="space-y-5 pt-2" aria-busy="true" aria-label="Even laden">
      <div class="skeleton h-12 w-3/4" />
      <div class="skeleton h-40" />
      <div class="skeleton h-32" />
    </div>
  </div>
</template>
