<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string, imageUrl?: string | null, size?: 'sm' | 'lg' }>(), { size: 'sm', imageUrl: null })
const failed = ref(false)
const initial = computed(() => props.name.trim().charAt(0).toUpperCase())
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden bg-beige"
    :class="size === 'lg' ? 'h-32 w-32 rounded-3xl' : 'h-14 w-14 rounded-2xl'"
  >
    <img
      v-if="imageUrl && !failed"
      :src="imageUrl"
      :alt="name"
      class="h-full w-full object-cover"
      loading="lazy"
      @error="failed = true"
    >
    <span v-else class="font-display text-groen" :class="size === 'lg' ? 'text-7xl' : 'text-3xl'" aria-hidden="true">{{ initial }}</span>
  </div>
</template>
