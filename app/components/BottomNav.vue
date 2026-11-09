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
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-zand-donker bg-beige/95 backdrop-blur"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Hoofdmenu"
  >
    <ul class="mx-auto grid max-w-lg grid-cols-4">
      <li v-for="item in items" :key="item.to">
        <NuxtLink
          :to="item.to"
          class="flex flex-col items-center gap-1 px-2 pt-2.5 pb-2 text-xs font-medium"
          :class="isActive(item.to) ? 'text-groen' : 'text-groen/55'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <template v-if="item.icon === 'home'">
              <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" :fill="isActive(item.to) ? 'currentColor' : 'none'" />
            </template>
            <template v-else-if="item.icon === 'scan'">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" />
            </template>
            <template v-else-if="item.icon === 'saldo'">
              <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" />
            </template>
            <template v-else>
              <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </template>
          </svg>
          <span>{{ item.label }}</span>
          <span class="h-0.5 w-10 rounded-full" :class="isActive(item.to) ? 'bg-groen' : 'bg-transparent'" />
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
