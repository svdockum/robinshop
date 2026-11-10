<script setup lang="ts">
import type { Balance } from '~/composables/useOverview'
defineProps<{ balance: Balance }>()
</script>

<template>
  <section class="card flex items-center gap-4" aria-label="Jullie puntensaldo">
    <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-groen text-beige">
      <RIcon name="wallet" class="h-8 w-8" />
    </span>
    <p class="font-display text-5xl" :class="balance.available < 0 ? 'text-koraal' : ''">
      <AnimatedNumber :value="balance.available" /><span class="sr-only"> punten</span>
    </p>
    <InfoTip class="ml-auto" text="Jullie puntensaldo: zoveel punten kun je nu gebruiken. Je punten blijven het hele jaar geldig." />
  </section>
</template>
