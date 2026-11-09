<script setup lang="ts">
const route = useRoute()

const items = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/scan', label: 'Scannen', icon: 'scan' },
  { to: '/saldo', label: 'Saldo', icon: 'saldo' },
  { to: '/profiel', label: 'Profiel', icon: 'profiel' },
] as const

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
const activeIndex = computed(() => items.findIndex(i => isActive(i.to)))
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-zand-donker bg-beige/95 backdrop-blur"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Hoofdmenu"
  >
    <ul class="relative mx-auto grid max-w-lg grid-cols-4">
      <!-- Eén indicator die naar het actieve tabblad schuift -->
      <li
        v-if="activeIndex >= 0"
        class="indicator pointer-events-none absolute top-1.5 left-0 h-[calc(100%-0.75rem)] w-1/4 px-3"
        :style="{ transform: `translateX(${activeIndex * 100}%)` }"
        aria-hidden="true"
      >
        <span class="block h-full rounded-2xl bg-zand" />
      </li>
      <li v-for="item in items" :key="item.to" class="relative">
        <NuxtLink
          :to="item.to"
          class="flex flex-col items-center gap-1 px-2 pt-3 pb-2.5 text-xs font-semibold transition-colors"
          :class="isActive(item.to) ? 'text-groen' : 'text-groen/80'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <svg
            viewBox="0 0 24 24"
            class="icon h-7 w-7"
            :class="{ 'icon-active': isActive(item.to) }"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <template v-if="item.icon === 'home'">
              <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" />
            </template>
            <template v-else-if="item.icon === 'scan'">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" />
            </template>
            <template v-else-if="item.icon === 'saldo'">
              <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" /><path d="M20 12v-3a1 1 0 0 0-1-1H6a2 2 0 0 1 0-4h11v4" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" />
            </template>
            <template v-else>
              <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </template>
          </svg>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.indicator {
  transition: transform var(--dur-slow) var(--ease-out);
}
.icon {
  transition: transform var(--dur) var(--ease-out);
}
.icon-active {
  transform: translateY(-1px) scale(1.08);
}
@media (prefers-reduced-motion: reduce) {
  .indicator, .icon { transition: none; }
  .icon-active { transform: none; }
}
</style>
