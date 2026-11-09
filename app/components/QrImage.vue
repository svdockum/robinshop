<script setup lang="ts">
import QRCode from 'qrcode'

const props = withDefaults(defineProps<{ value: string, dark?: string, light?: string, margin?: number }>(), {
  dark: '#115656',
  light: '#faf5df',
  margin: 2,
})

const svg = ref('')

watchEffect(async () => {
  if (!props.value) {
    svg.value = ''
    return
  }
  svg.value = await QRCode.toString(props.value, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: props.margin,
    color: { dark: props.dark, light: props.light },
  })
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- SVG komt uit de qrcode-bibliotheek, niet uit invoer -->
  <div class="qr-image" role="img" aria-label="QR-code" v-html="svg" />
</template>

<style scoped>
.qr-image :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>
