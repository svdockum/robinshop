<script setup lang="ts">
definePageMeta({ layout: 'plain' })
useHead({ title: 'Ledenpas · Robin' })

const route = useRoute()
const { loginWithCard } = useCardLogin()
const status = ref<'busy' | 'ok' | 'cancelled' | 'error'>('busy')
const name = ref('')

onMounted(async () => {
  try {
    const result = await loginWithCard(String(route.params.code))
    if (result) {
      name.value = result
      status.value = 'ok'
    }
    else {
      status.value = 'cancelled'
    }
  }
  catch {
    status.value = 'error'
  }
})
</script>

<template>
  <div class="mt-6">
    <p v-if="status === 'busy'" class="text-center text-xl">Even inloggen met je pas…</p>

    <div v-else-if="status === 'ok'" class="card">
      <h1 class="text-5xl">Hoi {{ name }}!</h1>
      <p class="mt-2 text-lg">Je bent ingelogd op deze telefoon. Scan nu bij de ingang de QR-code op het scherm.</p>
      <NuxtLink to="/scan" class="btn-primary mt-5 w-full">Naar de scanner</NuxtLink>
      <NuxtLink to="/" class="btn-ghost mt-2 w-full">Naar home</NuxtLink>
    </div>

    <div v-else-if="status === 'cancelled'" class="card">
      <p class="text-lg">Je bent ingelogd gebleven met je eigen account.</p>
      <NuxtLink to="/" class="btn-primary mt-4 w-full">Naar home</NuxtLink>
    </div>

    <div v-else class="card">
      <h1 class="text-4xl">Pas niet herkend</h1>
      <p class="mt-2 text-lg">Met deze pas kunnen we je niet inloggen. Vraag een medewerker om hulp.</p>
      <NuxtLink to="/login" class="btn-primary mt-4 w-full">Andere manier van inloggen</NuxtLink>
    </div>
  </div>
</template>
