<script setup lang="ts">
/**
 * Eetpunten als stippen, zodat je zonder te lezen ziet hoeveel iets kost
 * en hoeveel je nog hebt. Boven `max` stippen tonen we "+N".
 */
const props = withDefaults(defineProps<{
  count: number
  variant?: 'cost' | 'have' | 'missing'
  max?: number
  delay?: number
  size?: 'sm' | 'md'
}>(), { variant: 'have', max: 12, delay: 0, size: 'md' })

const shown = computed(() => Math.max(0, Math.min(props.count, props.max)))
const overflow = computed(() => Math.max(0, props.count - props.max))
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-1.5" aria-hidden="true">
    <span
      v-for="i in shown"
      :key="i"
      class="dot anim-pop"
      :class="[`dot-${variant}`, size === 'sm' ? 'dot-sm' : '']"
      :style="{ animationDelay: `${delay + i * 45}ms` }"
    />
    <span v-if="overflow" class="anim-pop ml-0.5 font-display text-xl leading-none" :style="{ animationDelay: `${delay + (shown + 1) * 45}ms` }">+{{ overflow }}</span>
  </span>
</template>

<style scoped>
.dot {
  display: inline-block;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 9999px;
}
.dot-sm { width: 0.7rem; height: 0.7rem; }
.dot-cost { background: var(--color-koraal); }
.dot-have { background: var(--color-groen); }
.dot-missing {
  border: 2.5px dashed var(--color-koraal);
  animation: pop-in var(--dur-slow) var(--ease-out) both, breathe 1.6s var(--ease-in-out) 0.6s infinite;
}
@media (prefers-reduced-motion: reduce) {
  .dot-missing { animation: rise-fade 200ms linear both; }
}
</style>
