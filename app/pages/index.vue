<script setup lang="ts">
import { describeMembers, formatPoints, monthName, pointsLabel } from '~/utils/format'

useHead({ title: 'Home · Robin' })

const { overview, refresh } = useOverview()
const { error } = await useAsyncData('overview', () => refresh())

const balance = computed(() => overview.value?.balance)
const visit = computed(() => overview.value?.visit)
const members = computed(() => overview.value?.members ?? [])
const month = monthName()

const membersText = computed(() =>
  `${members.value.length === 1 ? '1 gezinslid' : `${members.value.length} gezinsleden`}: ${describeMembers(members.value)}`)

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
    <div v-if="error" class="card flex items-center gap-4" role="alert">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-koraal text-white"><RIcon name="wifi-off" class="h-8 w-8" /></span>
      <button type="button" class="btn-primary" aria-label="Opnieuw proberen" @click="refresh()"><RIcon name="refresh" class="h-7 w-7" /></button>
      <InfoTip class="ml-auto" text="We kunnen je gegevens nu niet ophalen. Controleer je internet en probeer het opnieuw." />
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
      </div>

      <!-- In de winkel: mandje van nu, de drie stappen en door naar de scanner -->
      <section v-if="visit" class="card-groen anim-rise" aria-label="Je bent in de winkel">
        <div class="flex items-center gap-3">
          <InfoTip text="Je bent in de winkel." class="relative h-14 w-14 shrink-0 rounded-2xl bg-beige/15">
            <RIcon name="store" class="h-8 w-8" />
            <span class="live-dot absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-beige" aria-hidden="true" />
          </InfoTip>
          <InfoTip
            :text="`In je mandje: ${visit.items.length === 1 ? '1 product' : `${visit.items.length} producten`}, samen ${pointsLabel(visit.points)}.`"
            class="ml-auto gap-3"
          >
            <RIcon name="basket" class="h-9 w-9" />
            <span class="font-display text-5xl leading-none">{{ visit.items.length }}</span>
            <span class="pill-min ml-1">−<AnimatedNumber :value="visit.points" /></span>
          </InfoTip>
        </div>
        <VisitSteps :current="2" inverse class="mt-4" />
        <NuxtLink to="/scan" class="btn mt-4 w-full bg-beige text-groen" aria-label="Verder scannen">
          <RIcon name="scan" class="h-8 w-8" /><RIcon name="arrow-right" class="h-6 w-6" />
        </NuxtLink>
      </section>
      <!-- Nog niet binnen: eerst de code bij de ingang -->
      <section v-else class="card anim-rise" aria-label="Boodschappen doen">
        <VisitSteps :current="1" />
        <NuxtLink to="/scan" class="btn-primary mt-4 w-full" aria-label="Scannen">
          <RIcon name="scan" class="h-8 w-8" /><RIcon name="arrow-right" class="h-6 w-6" />
        </NuxtLink>
      </section>

      <!-- Eetpunten: per jaar (12 × kalender) en per maand (1 kalender) -->
      <section class="card-groen anim-rise relative" style="animation-delay: 60ms" aria-label="Jullie eetpunten">
        <InfoTip
          class="absolute top-2 right-2"
          :text="`Jullie eetpunten: ${formatPoints(balance.year_budget)} per jaar, dat is ${formatPoints(balance.month_allowance)} per maand.`"
        />
        <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
          <div>
            <p class="flex items-center justify-center gap-1.5" aria-hidden="true">
              <span class="font-display text-3xl leading-none">12×</span><RIcon name="calendar" class="h-9 w-9" />
            </p>
            <p class="mt-1 font-display text-5xl"><AnimatedNumber :value="balance.year_budget" :from="0" :duration="900" /></p>
            <p class="sr-only">per jaar</p>
          </div>
          <span class="h-20 w-0.5 self-center bg-beige/70" aria-hidden="true" />
          <div>
            <p class="flex items-center justify-center" aria-hidden="true"><RIcon name="calendar" class="h-9 w-9" /></p>
            <p class="mt-1 font-display text-5xl"><AnimatedNumber :value="balance.month_allowance" :from="0" :duration="900" :delay="120" /></p>
            <p class="sr-only">per maand</p>
          </div>
        </div>
      </section>

      <!-- Het gezin als figuurtjes -->
      <section class="card anim-rise flex items-center gap-4" style="animation-delay: 120ms" aria-label="Gezinsleden">
        <span class="flex h-12 shrink-0 items-end gap-0.5 text-groen" aria-hidden="true">
          <svg
            v-for="(m, i) in members.slice(0, 8)"
            :key="i"
            viewBox="0 0 16 32"
            fill="currentColor"
            class="anim-rise w-auto"
            :class="m.age >= 18 ? 'h-12' : m.age >= 9 ? 'h-9' : 'h-7'"
            :style="{ animationDelay: `${200 + i * 70}ms` }"
          >
            <circle cx="8" cy="5" r="4.5" /><path d="M2 12.5A2.5 2.5 0 0 1 4.5 10h7a2.5 2.5 0 0 1 2.5 2.5L15 22h-3v10H9.3v-8H6.7v8H4V22H1Z" />
          </svg>
        </span>
        <p class="font-display text-4xl" aria-hidden="true">{{ members.length }}</p>
        <InfoTip class="ml-auto" :text="membersText" />
      </section>

      <!-- Zo eten we deze maand: per soort eten -->
      <section v-if="overview.categories?.length" class="anim-rise" style="animation-delay: 180ms">
        <h2 class="sr-only">Zo eten we in {{ month }}</h2>
        <div class="mb-3 flex items-center gap-3">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-groen text-beige"><RIcon name="utensils" class="h-7 w-7" /></span>
          <RIcon name="calendar" class="h-8 w-8 shrink-0" />
          <p class="font-display text-3xl leading-none" aria-hidden="true">
            {{ formatPoints(balance.spent_month) }} <span class="opacity-60">/ {{ formatPoints(balance.month_budget) }}</span>
          </p>
          <InfoTip
            class="ml-auto"
            :text="`Zo eten we in ${month}. Gebruikt deze maand: ${formatPoints(balance.spent_month)} van ${formatPoints(balance.month_budget)} punten. Tik op een plaatje voor de naam.`"
          />
        </div>
        <CategoryBars :categories="overview.categories" :scale="Math.max(balance.month_budget / 2, 1)" />
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
