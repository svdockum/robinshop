<script setup lang="ts">
defineProps<{ title: string, wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-end justify-center bg-groen/40 p-0 sm:items-center sm:p-6" @click.self="emit('close')">
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      class="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-beige p-6 shadow-2xl sm:rounded-3xl"
      :class="wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'"
    >
      <div class="mb-4 flex items-start justify-between gap-4">
        <h2 class="text-4xl">{{ title }}</h2>
        <button type="button" class="rounded-full px-2 text-3xl leading-none" aria-label="Sluiten" @click="emit('close')">×</button>
      </div>
      <slot />
    </div>
  </div>
</template>
