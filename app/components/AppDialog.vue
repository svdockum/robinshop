<script setup lang="ts">
const { state, settle } = useConfirm()

function onKey(e: KeyboardEvent) {
  if (state.value.open && e.key === 'Escape') settle(false)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="fade">
    <div
      v-if="state.open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-groen/40 p-4 sm:items-center"
      @click.self="settle(false)"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="state.title"
        class="w-full max-w-md rounded-3xl bg-beige p-6 shadow-2xl"
      >
        <h2 class="text-3xl">{{ state.title }}</h2>
        <p v-if="state.body" class="mt-2 text-base">{{ state.body }}</p>
        <div class="mt-6 flex flex-col gap-3">
          <button
            type="button"
            :class="state.danger ? 'btn-accent' : 'btn-primary'"
            @click="settle(true)"
          >
            {{ state.confirmLabel ?? 'Ja' }}
          </button>
          <button type="button" class="btn-outline" @click="settle(false)">
            {{ state.cancelLabel ?? 'Annuleren' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
