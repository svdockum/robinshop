<script lang="ts">
export type IconName =
  | 'check' | 'cross' | 'gate' | 'phone-scan' | 'qr' | 'wallet' | 'calendar-next' | 'question'
  | 'stack' | 'clock' | 'wifi-off' | 'bag' | 'card' | 'hand-back' | 'basket' | 'arrow-right' | 'plus' | 'minus'
</script>

<script setup lang="ts">
/**
 * Robin-iconen: één lijndikte (2), ronde uiteinden, 24-raster.
 * Beeld eerst: veel leden lezen niet makkelijk Nederlands.
 */
defineProps<{ name: IconName, label?: string }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <template v-if="name === 'check'"><path d="m5 12.5 4.5 4.5L19 7.5" /></template>
    <template v-else-if="name === 'cross'"><path d="M6 6l12 12M18 6 6 18" /></template>
    <template v-else-if="name === 'gate'">
      <path d="M4 21V5a1 1 0 0 1 1-1h3v17M20 21V5a1 1 0 0 0-1-1h-3v17" /><path d="M8 9h8M8 13h8" /><path d="M2 21h20" />
    </template>
    <template v-else-if="name === 'phone-scan'">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M9 8h2M13 8h2M9 11h6M9 14h2M13 14h2" /><path d="M10.5 18.5h3" />
    </template>
    <template v-else-if="name === 'qr'">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" /><rect x="14.5" y="3.5" width="6" height="6" rx="1" /><rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h2.5v2.5M20.5 14.5v0M17 20.5h3.5V17M14.5 20.5v0" />
    </template>
    <template v-else-if="name === 'wallet'">
      <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" /><path d="M20 12v-3a1 1 0 0 0-1-1H6a2 2 0 0 1 0-4h11v4" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" />
    </template>
    <template v-else-if="name === 'calendar-next'">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="M10 15h5M13 13l2 2-2 2" />
    </template>
    <template v-else-if="name === 'question'">
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7" /><path d="M12 17h.01" />
    </template>
    <template v-else-if="name === 'stack'">
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" /><path d="m3 12 9 4.5 9-4.5" /><path d="m3 16.5 9 4.5 9-4.5" />
    </template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></template>
    <template v-else-if="name === 'wifi-off'">
      <path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2.5-1.8M2 9.5a15 15 0 0 1 4-2.6M22 9.5A15 15 0 0 0 11 5.1" /><path d="M12 20h.01" />
    </template>
    <template v-else-if="name === 'bag'">
      <path d="M5 8h14l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20.5L5 8Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </template>
    <template v-else-if="name === 'card'">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M6 9.5h5M6 13h3" /><rect x="14" y="9" width="4.5" height="4.5" rx=".8" />
    </template>
    <template v-else-if="name === 'hand-back'">
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2.1L9 15.5" />
    </template>
    <template v-else-if="name === 'basket'">
      <path d="M3 10h18l-1.6 8.5a2 2 0 0 1-2 1.5H6.6a2 2 0 0 1-2-1.5L3 10Z" /><path d="m8 10 3-6M16 10l-3-6" /><path d="M9 14v2M12 14v2M15 14v2" />
    </template>
    <template v-else-if="name === 'arrow-right'"><path d="M4 12h15M13 6l6 6-6 6" /></template>
    <template v-else-if="name === 'plus'"><path d="M12 5v14M5 12h14" /></template>
    <template v-else-if="name === 'minus'"><path d="M5 12h14" /></template>
  </svg>
</template>
