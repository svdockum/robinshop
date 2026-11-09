<script setup lang="ts">
import { describeMembers, pointsLabel } from '~/utils/format'

useHead({ title: 'Profiel · Robin' })

const supabase = useSupabaseClient()
const { overview, refresh } = useOverview()
const { ask } = useConfirm()
await useAsyncData('overview', () => refresh())

const members = computed(() => overview.value?.members ?? [])

async function logout() {
  const ok = await ask({
    title: 'Uitloggen?',
    body: 'Daarna log je opnieuw in met je ledenpas of een inloglink.',
    confirmLabel: 'Uitloggen',
    cancelLabel: 'Blijf ingelogd',
  })
  if (!ok) return
  await supabase.auth.signOut()
  overview.value = null
  await navigateTo('/login')
}
</script>

<template>
  <div class="space-y-5 pt-2">
    <h1 class="text-5xl">Profiel</h1>

    <section v-if="overview?.household" class="card">
      <p class="font-display text-4xl">{{ overview.household.name }}</p>
      <p class="mt-1 text-base">{{ describeMembers(members) }}</p>
      <ul class="mt-4 divide-y divide-zand-donker">
        <li v-for="(m, i) in members" :key="i" class="flex justify-between py-2 text-base">
          <span>{{ m.name || 'Gezinslid' }} ({{ m.age }})</span>
        </li>
      </ul>
      <p v-if="overview.balance" class="mt-4 text-base">Samen krijgen jullie <strong>{{ pointsLabel(overview.balance.year_budget) }}</strong> per jaar.</p>
      <p class="mt-2 text-sm">Klopt er iets niet? Vraag een medewerker van Robin om het aan te passen.</p>
    </section>

    <section class="card">
      <p class="font-display text-3xl">Hoe werkt het?</p>
      <ol class="mt-2 list-decimal space-y-1 pl-5 text-base">
        <li>Scan bij de ingang de QR-code op het scherm.</li>
        <li>Scan de QR-code bij elk product dat je meeneemt.</li>
        <li>Rond af bij de kassa door die QR-code te scannen.</li>
      </ol>
    </section>

    <NuxtLink v-if="overview?.is_admin" to="/robinadmin" class="btn-outline w-full">Naar beheer</NuxtLink>
    <button type="button" class="btn-outline w-full" @click="logout">Uitloggen</button>
  </div>
</template>
