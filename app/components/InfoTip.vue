<script setup lang="ts">
/**
 * Uitleg op verzoek. De app toont beeld; wie de tekst wil lezen tikt op het icoon
 * (of op de ⓘ) en krijgt die in een wolkje. Er staat altijd maar één wolkje open.
 *
 * Zonder slot is dit een ⓘ-knop. Met slot wordt de inhoud zelf de knop.
 */
defineOptions({ inheritAttrs: false })
defineProps<{ text: string }>()

const id = useId()
const active = useState<string | null>('info-tip-open', () => null)
const open = computed(() => active.value === id)
const trigger = ref<HTMLElement | null>(null)
const box = ref({ left: 0, top: 0, width: 0, arrow: 0, above: false })

function place() {
  const el = trigger.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const margin = 12
  const width = Math.min(304, window.innerWidth - margin * 2)
  const center = r.left + r.width / 2
  const left = Math.max(margin, Math.min(center - width / 2, window.innerWidth - width - margin))
  // Onderin het scherm klapt het wolkje naar boven, zodat het niet achter het menu valt.
  const above = r.bottom > window.innerHeight * 0.62
  box.value = {
    left,
    width,
    top: above ? r.top - 10 : r.bottom + 10,
    arrow: Math.max(20, Math.min(center - left, width - 20)),
    above,
  }
}

function close() {
  if (open.value) active.value = null
}
function toggle() {
  if (open.value) return close()
  place()
  active.value = id
}

function onPointerDown(e: Event) {
  if (!trigger.value?.contains(e.target as Node)) close()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
function listen(on: boolean) {
  if (!import.meta.client) return
  if (on) {
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
  }
  else {
    document.removeEventListener('pointerdown', onPointerDown, true)
    window.removeEventListener('scroll', close, true)
    window.removeEventListener('resize', close)
    window.removeEventListener('keydown', onKey)
  }
}
watch(open, listen)
onBeforeUnmount(() => {
  close()
  listen(false)
})
</script>

<template>
  <button
    ref="trigger"
    type="button"
    v-bind="$attrs"
    class="inline-flex items-center justify-center"
    :class="$slots.default ? '' : 'h-11 w-11 shrink-0 rounded-full opacity-75 hover:opacity-100'"
    :aria-expanded="open"
    :aria-label="$slots.default ? text : `Uitleg: ${text}`"
    @click.stop.prevent="toggle"
  >
    <slot><RIcon name="info" class="h-7 w-7" /></slot>
  </button>
  <Teleport to="body">
    <Transition name="tip">
      <div
        v-if="open"
        class="tip fixed z-[60]"
        :class="{ 'tip-above': box.above }"
        :style="{ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px` }"
        role="status"
      >
        <p class="relative rounded-2xl border-2 border-groen bg-beige px-4 py-3 text-base font-medium text-groen shadow-[0_14px_34px_-14px_rgba(17,86,86,0.55)]">
          {{ text }}
          <span class="tip-arrow" :style="{ left: `${box.arrow}px` }" aria-hidden="true" />
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tip-above {
  transform: translateY(-100%);
}
.tip-arrow {
  position: absolute;
  top: -8px;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  background: var(--color-beige);
  border-top: 2px solid var(--color-groen);
  border-left: 2px solid var(--color-groen);
  transform: rotate(45deg);
}
.tip-above .tip-arrow {
  top: auto;
  bottom: -8px;
  transform: rotate(225deg);
}
.tip-enter-active {
  transition: opacity var(--dur-fast) linear;
}
.tip-enter-active > p {
  transition: transform var(--dur) var(--ease-out);
}
.tip-leave-active {
  transition: opacity var(--dur-fast) linear;
}
.tip-enter-from, .tip-leave-to {
  opacity: 0;
}
.tip-enter-from > p {
  transform: translateY(6px) scale(0.97);
}
.tip-above.tip-enter-from > p {
  transform: translateY(-6px) scale(0.97);
}
@media (prefers-reduced-motion: reduce) {
  .tip-enter-active > p { transition: none; }
  .tip-enter-from > p { transform: none; }
}
</style>
