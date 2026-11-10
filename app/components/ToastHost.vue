<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
    <TransitionGroup name="toast">
      <button
        v-for="t in toasts"
        :key="t.id"
        type="button"
        class="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-5 py-3 text-left text-base font-medium shadow-lg"
        :class="{
          'bg-groen text-beige': t.kind === 'ok' || t.kind === 'info',
          'bg-koraal text-white': t.kind === 'error',
        }"
        @click="dismiss(t.id)"
      >
        <template v-if="t.icons?.length">
          <RIcon v-for="icon in t.icons" :key="icon" :name="icon" class="h-9 w-9" />
          <span class="sr-only">{{ t.message }}</span>
        </template>
        <template v-else>{{ t.message }}</template>
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
</style>
