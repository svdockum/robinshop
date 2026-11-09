<script setup lang="ts">
/** De Robin-pijl (merkelement, "onze pijl schiet altijd raak"). */
withDefaults(defineProps<{ color?: string, shoot?: boolean }>(), { color: 'var(--color-koraal)', shoot: false })
</script>

<template>
  <svg viewBox="0 0 704 107.35" :class="shoot ? 'arrow-shoot' : ''" aria-hidden="true">
    <g :fill="color">
      <polygon points="0 0 47.09 0 100.77 53.68 50.38 53.68 0 0" />
      <polygon points="0 107.35 47.09 107.35 100.77 53.68 50.38 53.68 0 107.35" />
      <polygon points="68.95 0 116.04 0 169.71 53.68 119.33 53.68 68.95 0" />
      <polygon points="68.95 107.35 116.04 107.35 169.71 53.68 119.33 53.68 68.95 107.35" />
      <path d="M703.99,53.68l-84.79-48.76c-14.49-8.33-31.38,6.26-25.23,21.8l10.66,26.96-10.66,26.96c-6.15,15.55,10.74,30.14,25.23,21.8l84.79-48.76Z" />
      <rect x="51" y="42.35" width="561" height="22.66" />
    </g>
  </svg>
</template>

<style scoped>
.arrow-shoot {
  animation: arrow-shoot 900ms var(--ease-out) 150ms both;
}
@media (prefers-reduced-motion: reduce) {
  .arrow-shoot { animation: rise-fade 250ms linear both; }
}
</style>
