<script setup lang="ts">
import type { ScanResult } from '~/composables/useScanFlow'
import { balanceBeforeScan } from '~/utils/budget'
import { formatPoints, monthName, pointsLabel } from '~/utils/format'

/**
 * Resultaat van een scan. Beeld eerst: stippen voor punten, iconen voor acties,
 * korte zinnen als ondersteuning (en voor schermlezers).
 */
const props = defineProps<{ result: ScanResult, busy?: boolean }>()
const emit = defineEmits<{ close: [], advance: [], another: [], undo: [scanId: string] }>()

const nextMonth = computed(() => {
  const d = new Date()
  return monthName(new Date(d.getFullYear(), d.getMonth() + 1, 1))
})

/** Saldo vóór deze scan, zodat het zichtbaar kan aftellen. */
const before = computed(() => props.result.kind === 'scanned'
  ? balanceBeforeScan({
      after: props.result.balance.available,
      points: props.result.product.points,
      advanceUsed: props.result.advanceUsed,
      advanceThisMonth: props.result.balance.advance_this_month,
    })
  : 0)
const missing = computed(() => props.result.kind === 'insufficient'
  ? Math.max(0, props.result.product.points - Math.max(0, props.result.balance.available))
  : 0)
</script>

<template>
  <!-- Product gescand: compact, de camera blijft eronder doorlopen -->
  <section v-if="result.kind === 'scanned'" class="rounded-3xl bg-zand p-4 shadow-[0_10px_30px_-18px_rgba(17,86,86,0.45)]" aria-live="assertive">
    <div class="flex items-center gap-3">
      <span class="anim-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-groen text-beige">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path class="anim-draw" style="--len: 22" d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      <ProductThumb :name="result.product.name" :image-url="result.product.image_url" class="anim-pop" style="animation-delay: 60ms" />
      <div class="min-w-0 flex-1">
        <p class="truncate font-display text-2xl leading-tight">{{ result.product.name }}</p>
        <PointsDots :count="result.product.points" variant="cost" size="sm" :max="10" :delay="200" class="!gap-1" />
      </div>
      <span class="pill-min anim-drop shrink-0" style="animation-delay: 120ms">−{{ result.product.points }}</span>
      <button type="button" class="-mr-1 rounded-full p-1.5 text-groen/70 hover:bg-zand-donker" aria-label="Sluiten" @click="emit('close')">
        <RIcon name="cross" class="h-5 w-5" />
      </button>
    </div>

    <div class="mt-3 flex items-center gap-3 rounded-2xl bg-groen px-4 py-2.5 text-beige">
      <RIcon name="wallet" class="h-7 w-7 shrink-0" label="Saldo" />
      <span class="sr-only">Nieuw saldo</span>
      <span class="font-display text-3xl leading-none"><AnimatedNumber :value="result.balance.available" :from="before" :delay="380" /></span>
      <span class="text-sm">punten</span>
      <span v-if="result.advanceUsed" class="ml-auto inline-flex items-center gap-1 rounded-full bg-beige/15 px-2 py-1 text-xs font-semibold">
        <RIcon name="calendar-next" class="h-4 w-4" /> {{ nextMonth }}
      </span>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <button type="button" class="btn-outline !gap-1.5 !px-3 !py-2.5 !text-base" :disabled="busy" @click="emit('another')">
        <RIcon name="plus" class="h-5 w-5" /> Nog één
      </button>
      <button type="button" class="btn-outline !gap-1.5 !px-3 !py-2.5 !text-base" :disabled="busy" @click="emit('undo', result.scanId)">
        <RIcon name="hand-back" class="h-5 w-5" /> Leg terug
      </button>
    </div>
  </section>

  <!-- Te weinig punten: zichtbaar vergelijken in plaats van uitleggen -->
  <section v-else-if="result.kind === 'insufficient'" class="anim-nudge rounded-3xl bg-zand p-5" aria-live="assertive">
    <h2 class="sr-only">Niet genoeg punten</h2>
    <div class="flex items-center gap-4">
      <div class="relative shrink-0">
        <ProductThumb :name="result.product.name" :image-url="result.product.image_url" size="lg" class="anim-pop" />
        <span class="anim-pop absolute -top-2 -right-2 flex h-11 min-w-11 items-center justify-center rounded-full bg-koraal px-2 font-display text-2xl text-white shadow-md" style="animation-delay: 120ms">{{ result.product.points }}</span>
      </div>
      <div class="min-w-0">
        <p class="font-display text-3xl leading-tight">{{ result.product.name }}</p>
        <p class="mt-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-koraal/15 px-3 py-1 text-sm font-semibold text-koraal-donker">
          <RIcon name="cross" class="h-4 w-4" /> Te weinig punten
        </p>
      </div>
    </div>

    <dl class="mt-5 space-y-3">
      <div class="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3">
        <dt class="flex h-10 w-10 items-center justify-center rounded-full bg-koraal text-white"><RIcon name="basket" class="h-6 w-6" label="Kost" /></dt>
        <dd><PointsDots :count="result.product.points" variant="cost" :delay="150" /></dd>
        <dd class="font-display text-3xl tabular">{{ formatPoints(result.product.points) }}</dd>
      </div>
      <div class="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3">
        <dt class="flex h-10 w-10 items-center justify-center rounded-full bg-groen text-beige"><RIcon name="wallet" class="h-6 w-6" label="Jij hebt" /></dt>
        <dd class="flex flex-wrap items-center gap-1.5">
          <PointsDots :count="Math.max(0, result.balance.available)" variant="have" :delay="350" />
          <PointsDots :count="missing" variant="missing" :max="Math.max(1, 12 - Math.min(12, Math.max(0, result.balance.available)))" :delay="550" />
        </dd>
        <dd class="font-display text-3xl tabular">{{ formatPoints(Math.max(0, result.balance.available)) }}</dd>
      </div>
    </dl>
    <p class="sr-only">{{ result.product.name }} kost {{ pointsLabel(result.product.points) }}. Je hebt nog {{ pointsLabel(result.balance.available) }}.</p>

    <!-- Voorschot: het kalenderblad van volgende maand schuift erbij -->
    <div v-if="result.canAdvance" class="anim-slide-in mt-5 rounded-2xl bg-beige p-4" style="animation-delay: 700ms">
      <div class="flex items-center gap-3">
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-groen text-beige">
          <RIcon name="calendar-next" class="h-7 w-7" />
        </span>
        <div class="min-w-0">
          <p class="font-display text-2xl capitalize leading-tight">{{ nextMonth }}</p>
          <PointsDots :count="result.advanceAmount" variant="have" :max="10" :delay="900" />
        </div>
      </div>
      <p class="mt-2 text-sm">Gebruik nu alvast punten van {{ nextMonth }}. Die maand krijg je ze dan niet nog een keer.</p>
      <button type="button" class="btn-accent mt-3 w-full !gap-2" :disabled="busy" @click="emit('advance')">
        <RIcon name="calendar-next" class="h-6 w-6" />
        +{{ formatPoints(result.advanceAmount) }} van {{ nextMonth }}
      </button>
    </div>

    <div v-else class="mt-5 flex items-center gap-3 rounded-2xl bg-beige p-4">
      <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-koraal text-white">
        <RIcon name="hand-back" class="h-7 w-7" />
      </span>
      <p class="text-base">Leg het product terug. Volgende maand heb je weer punten.</p>
    </div>

    <button type="button" class="btn-outline mt-3 w-full !gap-2" @click="emit('close')">
      <RIcon name="phone-scan" class="h-5 w-5" /> Verder scannen
    </button>
  </section>

  <!-- Ingecheckt -->
  <section v-else-if="result.kind === 'checked-in'" class="rounded-3xl bg-groen p-6 text-beige" aria-live="assertive">
    <span class="anim-pop flex h-16 w-16 items-center justify-center rounded-full bg-beige text-groen">
      <RIcon name="gate" class="h-9 w-9" />
    </span>
    <h2 class="anim-rise mt-4 text-4xl" style="animation-delay: 80ms">{{ result.already ? 'Je bent binnen' : `Welkom, ${result.householdName}!` }}</h2>
    <ol class="mt-5 grid grid-cols-3 gap-2 text-center text-sm" aria-label="Zo werkt het">
      <li v-for="(step, i) in [{ icon: 'qr', label: 'Scan product' }, { icon: 'basket', label: 'Neem mee' }, { icon: 'gate', label: 'Scan bij kassa' }] as const" :key="step.label" class="anim-rise rounded-2xl bg-beige/10 p-3" :style="{ animationDelay: `${200 + i * 90}ms` }">
        <RIcon :name="step.icon" class="mx-auto h-8 w-8" />
        <span class="mt-1 block">{{ step.label }}</span>
      </li>
    </ol>
    <button type="button" class="btn mt-5 w-full bg-beige text-groen" @click="emit('close')">
      <RIcon name="phone-scan" class="h-6 w-6" /> Begin met scannen
    </button>
  </section>

  <!-- Afgerond bij de kassa: de pijl schiet raak -->
  <section v-else-if="result.kind === 'checked-out'" class="overflow-hidden rounded-3xl bg-groen p-6 text-beige" aria-live="assertive">
    <div class="relative flex h-24 items-center">
      <RobinArrow shoot color="var(--color-koraal)" class="absolute left-0 h-7 w-[78%]" />
      <span class="anim-pop absolute right-0 flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-beige bg-groen" style="animation-delay: 650ms">
        <RIcon name="bag" class="h-9 w-9" />
      </span>
    </div>
    <h2 class="sr-only">Afgerond bij de kassa</h2>
    <div class="anim-rise mt-4 grid grid-cols-2 gap-2" style="animation-delay: 900ms">
      <div class="rounded-2xl bg-beige/10 p-3">
        <RIcon name="basket" class="h-7 w-7" label="Producten" />
        <p class="mt-1 font-display text-4xl tabular">{{ result.items }}</p>
      </div>
      <div class="rounded-2xl bg-beige/10 p-3">
        <span class="flex h-7 items-center"><span class="h-5 w-5 rounded-full bg-koraal" aria-hidden="true" /></span>
        <p class="mt-1 font-display text-4xl tabular">−{{ formatPoints(result.points) }}</p>
        <span class="sr-only">punten</span>
      </div>
    </div>
    <div v-if="result.balance" class="anim-rise mt-2 flex items-center gap-3 rounded-2xl bg-beige px-4 py-3 text-groen" style="animation-delay: 1100ms">
      <RIcon name="wallet" class="h-7 w-7" label="Saldo" />
      <span class="font-display text-3xl tabular">{{ formatPoints(result.balance.available) }}</span>
      <span class="text-sm">punten over</span>
    </div>
    <NuxtLink to="/" class="btn mt-5 w-full bg-beige text-groen">Naar home</NuxtLink>
  </section>

  <!-- Ingelogd met pas -->
  <section v-else-if="result.kind === 'logged-in'" class="rounded-3xl bg-zand p-6" aria-live="assertive">
    <span class="anim-pop flex h-16 w-16 items-center justify-center rounded-full bg-groen text-beige">
      <RIcon name="card" class="h-9 w-9" />
    </span>
    <h2 class="anim-rise mt-4 text-4xl">Hoi {{ result.householdName }}!</h2>
    <div class="anim-rise mt-4 flex items-center gap-3 text-lg" style="animation-delay: 150ms">
      <RIcon name="arrow-right" class="h-6 w-6 text-koraal" />
      <RIcon name="gate" class="h-8 w-8" />
      <span>Scan de code bij de ingang</span>
    </div>
    <button type="button" class="btn-primary mt-5 w-full" @click="emit('close')">Verder</button>
  </section>

  <!-- Melding -->
  <section v-else class="anim-nudge rounded-3xl bg-zand p-6" aria-live="assertive">
    <div class="flex items-center gap-4">
      <span class="anim-pop flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-koraal text-white">
        <RIcon :name="result.icon" class="h-9 w-9" />
      </span>
      <h2 class="text-4xl">{{ result.title }}</h2>
    </div>
    <div v-if="result.action === 'checkin'" class="anim-rise mt-5 flex items-center justify-center gap-4 rounded-2xl bg-beige p-4" style="animation-delay: 150ms" aria-hidden="true">
      <RIcon name="phone-scan" class="h-12 w-12" />
      <RIcon name="arrow-right" class="anim-breathe h-8 w-8 text-koraal" />
      <RIcon name="gate" class="h-12 w-12" />
    </div>
    <p class="mt-4 text-lg">{{ result.message }}</p>
    <button type="button" class="btn-primary mt-5 w-full" @click="emit('close')">Oké</button>
  </section>
</template>
