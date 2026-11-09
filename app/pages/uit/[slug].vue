<script setup lang="ts">
// Zelfde pad = zelfde pagina: de vlag ?verwerkt=1 mag geen nieuwe verwerking starten.
definePageMeta({ key: route => route.path })
useHead({ title: 'Afronden · Robin' })
const route = useRoute()
const raw = computed(() => `${useRequestURL().origin}/uit/${encodeURIComponent(String(route.params.slug))}?t=${encodeURIComponent(String(route.query.t ?? ''))}`)
</script>

<template>
  <DeepLinkScan :raw="raw" />
</template>
