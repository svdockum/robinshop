<script setup lang="ts">
import type { Balance } from '~/composables/useOverview'
defineProps<{ balance: Balance }>()
</script>

<template>
  <section class="card relative overflow-hidden">
    <p class="text-lg font-semibold">Jullie puntensaldo</p>
    <p class="font-display text-5xl" :class="balance.available < 0 ? 'text-koraal' : ''">
      <AnimatedNumber :value="balance.available" /> <span class="text-3xl">punten</span>
    </p>
    <p class="mt-1 text-base">Je punten blijven het hele jaar geldig.</p>
    <svg class="absolute top-4 right-4 h-12 w-12 text-groen" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10 38C10 20 22 8 40 8c0 18-12 30-30 30Z" /><path d="M10 38 28 20" /><path d="M18 30h8M22 26v-6" />
    </svg>
  </section>
</template>
