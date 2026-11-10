<script lang="ts">
export type IconName =
  | 'check' | 'cross' | 'gate' | 'phone-scan' | 'qr' | 'wallet' | 'calendar-next' | 'question'
  | 'stack' | 'clock' | 'wifi-off' | 'bag' | 'card' | 'hand-back' | 'basket' | 'arrow-right' | 'plus' | 'minus' | 'edit'
  | 'info' | 'home' | 'scan' | 'calendar' | 'refresh' | 'keyboard' | 'torch' | 'camera' | 'camera-off' | 'chevron-down'
  | 'staff' | 'store' | 'exit'
  | 'carrot' | 'apple' | 'milk' | 'wheat' | 'bread' | 'bean' | 'leaf' | 'utensils'
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
    <template v-else-if="name === 'edit'">
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14 8 3 3" /><path d="M13 20h7" />
    </template>

    <!-- Uitleg, navigatie en bediening -->
    <template v-else-if="name === 'info'"><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.5h.01" /></template>
    <template v-else-if="name === 'home'"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></template>
    <!-- Scannen is altijd een QR-code in de zoeker (geen barcode-streep) -->
    <template v-else-if="name === 'scan'">
      <path d="M3 7.5V5a2 2 0 0 1 2-2h2.5M16.5 3H19a2 2 0 0 1 2 2v2.5M21 16.5V19a2 2 0 0 1-2 2h-2.5M7.5 21H5a2 2 0 0 1-2-2v-2.5" />
      <rect x="8" y="8" width="2.5" height="2.5" rx=".4" /><rect x="13.5" y="8" width="2.5" height="2.5" rx=".4" /><rect x="8" y="13.5" width="2.5" height="2.5" rx=".4" />
      <path d="M15 15h.01" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </template>
    <template v-else-if="name === 'refresh'"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></template>
    <template v-else-if="name === 'keyboard'">
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8" />
    </template>
    <template v-else-if="name === 'torch'">
      <path d="M7 3h10v3c0 2-2 2.5-2 4.5V19a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8.5C9 8.5 7 8 7 6V3Z" /><path d="M7 6.5h10M12 12.5V15" />
    </template>
    <template v-else-if="name === 'camera' || name === 'camera-off'">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3" />
      <path v-if="name === 'camera-off'" d="M3 3l18 18" />
    </template>
    <template v-else-if="name === 'chevron-down'"><path d="m6 9 6 6 6-6" /></template>
    <template v-else-if="name === 'staff'">
      <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.9-3.6 3.4-5.5 6.5-5.5s5.6 1.9 6.5 5.5" />
      <path d="M16.5 5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7" /><path d="M19 12.5h.01" />
    </template>
    <template v-else-if="name === 'store'">
      <path d="M4 4h16l1.5 5h-19L4 4Z" /><path d="M2.5 9a3.15 3.15 0 0 0 6.3 0a3.2 3.2 0 0 0 6.4 0a3.15 3.15 0 0 0 6.3 0" />
      <path d="M4.5 12.5V20h15v-7.5" /><path d="M10 20v-4.5h4V20" />
    </template>
    <template v-else-if="name === 'exit'"><path d="M10 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></template>

    <!-- Soorten eten -->
    <template v-else-if="name === 'carrot'">
      <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7ZM8.64 14l-2.05-2.04M15.34 15l-2.46-2.46" />
      <path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9Z" /><path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2Z" />
    </template>
    <template v-else-if="name === 'apple'">
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /><path d="M10 2c1 .5 2 2 2 5" />
    </template>
    <template v-else-if="name === 'milk'">
      <path d="M8 2h8" /><path d="M9 2v2.79a4 4 0 0 1-.67 2.22l-.66.98A4 4 0 0 0 7 10.21V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.79a4 4 0 0 0-.67-2.22l-.66-.98A4 4 0 0 1 15 4.79V2" />
      <path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
    </template>
    <template v-else-if="name === 'wheat'">
      <path d="M12 21.5V8" /><path d="M12 8c-1.6-1.6-1.6-3.9 0-5.5 1.6 1.6 1.6 3.9 0 5.5Z" />
      <path d="M12 13.5c-2.6 0-4.3-1.4-4.8-4 2.6 0 4.3 1.4 4.8 4ZM12 13.5c2.6 0 4.3-1.4 4.8-4-2.6 0-4.3 1.4-4.8 4Z" />
      <path d="M12 18.5c-2.6 0-4.3-1.4-4.8-4 2.6 0 4.3 1.4 4.8 4ZM12 18.5c2.6 0 4.3-1.4 4.8-4-2.6 0-4.3 1.4-4.8 4Z" />
    </template>
    <template v-else-if="name === 'bread'">
      <path d="M4.5 9.5c0-2.5 2-4 4.5-4h6c2.5 0 4.5 1.5 4.5 4 0 1.2-.6 2-1.5 2.5V18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6c-.9-.5-1.5-1.3-1.5-2.5Z" /><path d="m9.5 9 1 2M13.5 9l1 2" />
    </template>
    <template v-else-if="name === 'bean'">
      <path d="M10.17 6.6C9.95 7.48 9.64 8.36 9 9c-.64.64-1.52.95-2.4 1.17A6 6 0 0 0 8 22c7.73 0 14-6.27 14-14a6 6 0 0 0-11.83-1.4Z" /><path d="M5.34 10.62a4 4 0 1 0 5.28-5.28" />
    </template>
    <template v-else-if="name === 'leaf'">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </template>
    <template v-else-if="name === 'utensils'">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </template>
  </svg>
</template>
