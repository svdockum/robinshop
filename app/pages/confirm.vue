<script setup lang="ts">
definePageMeta({ layout: 'plain' })
useHead({ title: 'Inloggen · Robin' })

const session = useSupabaseSession()
const { redirectAfterLogin } = useCardLogin()
const failed = ref(false)

watch(session, (s) => {
  if (s) navigateTo(redirectAfterLogin(), { replace: true })
}, { immediate: true })

onMounted(() => {
  setTimeout(() => {
    if (!session.value) failed.value = true
  }, 6000)
})
</script>

<template>
  <div class="mt-10 text-center">
    <p v-if="!failed" class="text-xl">Even inloggen…</p>
    <div v-else class="card text-left">
      <p class="font-display text-3xl">Dat lukte niet</p>
      <p class="mt-2 text-lg">De inloglink is verlopen of al gebruikt. Vraag een nieuwe aan.</p>
      <NuxtLink to="/login" class="btn-primary mt-4 w-full">Opnieuw inloggen</NuxtLink>
    </div>
  </div>
</template>
