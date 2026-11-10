<script setup lang="ts">
import type { IconName } from '~/components/RIcon.vue'

/**
 * Een bezoek in drie beelden: ingang → producten scannen → kassa.
 * De stap waar je nu bent licht op; tik op een stap voor de uitleg.
 */
const props = withDefaults(defineProps<{ current?: 0 | 1 | 2 | 3, inverse?: boolean }>(), { current: 0, inverse: false })

const steps: { icons: IconName[], text: string }[] = [
  { icons: ['gate'], text: 'Stap 1: scan de QR-code bij de ingang.' },
  { icons: ['qr', 'basket'], text: 'Stap 2: scan de QR-code bij elk product dat je meeneemt.' },
  { icons: ['exit'], text: 'Stap 3: klaar? Scan de QR-code bij de kassa.' },
]

function tone(step: number) {
  if (step === props.current) return props.inverse ? 'bg-beige text-groen' : 'bg-groen text-beige'
  return props.inverse ? 'bg-beige/10 text-beige' : 'bg-zand-donker/60 text-groen'
}
</script>

<template>
  <ol class="flex items-center gap-1.5" aria-label="Zo werkt het">
    <template v-for="(step, i) in steps" :key="i">
      <li v-if="i" class="shrink-0" aria-hidden="true">
        <RIcon name="arrow-right" class="h-5 w-5 text-koraal" />
      </li>
      <li class="relative min-w-0" :class="step.icons.length > 1 ? 'flex-[1.5]' : 'flex-1'">
        <InfoTip
          :text="step.text"
          class="w-full gap-1.5 rounded-2xl py-2.5 transition-colors"
          :class="tone(i + 1)"
          :aria-current="current === i + 1 ? 'step' : undefined"
        >
          <RIcon v-for="icon in step.icons" :key="icon" :name="icon" class="h-8 w-8" />
        </InfoTip>
        <span
          v-if="i + 1 < current"
          class="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-beige bg-groen text-beige"
          :class="{ '!border-groen !bg-beige !text-groen': inverse }"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
      </li>
    </template>
  </ol>
</template>
