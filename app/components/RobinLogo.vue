<script setup lang="ts">
import { LOGO_HEIGHT, LOGO_PATHS, LOGO_WIDTH } from '~/utils/brandLogo'

const props = withDefaults(defineProps<{ color?: 'groen' | 'beige' | 'koraal' }>(), { color: 'groen' })

const fill = computed(() => ({ groen: '#115656', beige: '#faf5df', koraal: '#fd644e' })[props.color])
</script>

<template>
  <svg
    :viewBox="`0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}`"
    role="img"
    aria-label="Robin"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path v-for="(d, i) in LOGO_PATHS" :key="i" :d="d" :fill="fill" />
  </svg>
</template>
