<script setup lang="ts">
import { formatPoints } from '~/utils/format'

/** Getal dat zichtbaar naar de nieuwe waarde telt (saldo telt af na een scan). */
const props = withDefaults(defineProps<{ value: number, from?: number, duration?: number, delay?: number }>(), {
  duration: 700,
  delay: 0,
})

// Bij de eerste (server-)render meteen de echte waarde tonen; tellen alleen in de app zelf.
const firstRender = import.meta.server || useNuxtApp().isHydrating
const shown = ref(firstRender ? props.value : (props.from ?? props.value))
let frame = 0
let timer: ReturnType<typeof setTimeout> | undefined

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function animateTo(target: number) {
  cancelAnimationFrame(frame)
  clearTimeout(timer)
  const start = shown.value
  if (start === target || reduced()) {
    shown.value = target
    return
  }
  timer = setTimeout(() => {
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / props.duration)
      const eased = 1 - (1 - p) ** 4
      shown.value = Math.round(start + (target - start) * eased)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }, props.delay)
}

onMounted(() => animateTo(props.value))
watch(() => props.value, v => animateTo(v))
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(timer)
})
</script>

<template>
  <span class="tabular">{{ formatPoints(shown) }}</span>
</template>
