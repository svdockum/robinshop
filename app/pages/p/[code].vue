<script setup lang="ts">
// Zelfde pad = zelfde pagina: de vlag ?verwerkt=1 mag geen nieuwe verwerking starten.
definePageMeta({ key: route => route.path })
useHead({ title: 'Product · Robin' })
const route = useRoute()
const raw = computed(() => `${useRequestURL().origin}/p/${encodeURIComponent(String(route.params.code))}`)
</script>

<template>
  <DeepLinkScan :raw="raw" />
</template>
