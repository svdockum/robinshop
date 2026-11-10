<script setup lang="ts">
import type { IconName } from '~/components/RIcon.vue'

const { state, settle } = useConfirm()
const cancelIcons = computed<IconName[]>(() => state.value.cancelIcons ?? ['cross'])

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
        <!-- Beeldvariant: de vraag als plaatje, de twee uitkomsten als iconen -->
        <template v-if="state.confirmIcons?.length">
          <div class="flex items-center gap-3">
            <ProductThumb v-if="state.thumb" :name="state.thumb.name" :image-url="state.thumb.imageUrl" class="!bg-zand" />
            <RIcon v-for="icon in state.icons" :key="icon" :name="icon" class="h-12 w-12" />
            <span class="font-display text-6xl leading-none text-koraal" aria-hidden="true">?</span>
            <InfoTip class="ml-auto" :text="[state.title, state.body].filter(Boolean).join(' ')" />
          </div>
          <p v-if="state.thumb" class="mt-2 truncate text-lg font-semibold">{{ state.thumb.name }}</p>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <button type="button" class="btn-outline !py-4" :aria-label="state.cancelLabel ?? 'Annuleren'" @click="settle(false)">
              <RIcon v-for="icon in cancelIcons" :key="icon" :name="icon" class="h-8 w-8" />
            </button>
            <button
              type="button"
              class="!py-4"
              :class="state.danger ? 'btn-accent' : 'btn-primary'"
              :aria-label="state.confirmLabel ?? 'Ja'"
              @click="settle(true)"
            >
              <RIcon v-for="icon in state.confirmIcons" :key="icon" :name="icon" class="h-8 w-8" />
            </button>
          </div>
        </template>
        <template v-else>
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
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
