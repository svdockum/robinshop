<script setup lang="ts">
const route = useRoute()
const { needsPassword, setKey } = useAdminApi()
const password = ref('')

const links = [
  { to: '/robinadmin', label: 'Overzicht' },
  { to: '/robinadmin/producten', label: 'Producten & QR' },
  { to: '/robinadmin/huishoudens', label: 'Huishoudens' },
  { to: '/robinadmin/scanpunten', label: 'Ingang & kassa' },
  { to: '/robinadmin/registraties', label: 'Registraties' },
]

function isActive(to: string) {
  return to === '/robinadmin' ? route.path === '/robinadmin' : route.path.startsWith(to)
}

function submitPassword() {
  if (!password.value) return
  setKey(password.value)
  password.value = ''
  reloadNuxtApp()
}
</script>

<template>
  <div class="min-h-dvh bg-beige">
    <header class="border-b border-zand-donker bg-groen text-beige">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <NuxtLink to="/robinadmin" class="flex items-center gap-3" aria-label="Robin beheer">
          <RobinLogo color="beige" class="h-7 w-auto" />
          <span class="font-display text-xl">Beheer</span>
        </NuxtLink>
        <nav class="-mx-1 flex flex-1 gap-1 overflow-x-auto" aria-label="Beheer">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
            :class="isActive(l.to) ? 'bg-beige text-groen' : 'text-beige hover:bg-groen-licht'"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div v-if="needsPassword" class="card mx-auto max-w-md">
        <h1 class="text-4xl">Wachtwoord</h1>
        <p class="mt-2">Het beheer is afgeschermd. Vul het beheerwachtwoord in.</p>
        <form class="mt-4 space-y-3" @submit.prevent="submitPassword">
          <label class="label" for="admin-pw">Wachtwoord</label>
          <input id="admin-pw" v-model="password" type="password" class="input" autocomplete="current-password">
          <button type="submit" class="btn-primary w-full">Verder</button>
        </form>
      </div>
      <slot v-else />
    </main>
  </div>
</template>
