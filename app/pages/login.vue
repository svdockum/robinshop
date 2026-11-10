<script setup lang="ts">
import { parseScan } from '~/utils/scanCode'

definePageMeta({ layout: 'plain' })
useHead({ title: 'Inloggen · Robin' })

const supabase = useSupabaseClient()
const { loginWithCard, redirectAfterLogin } = useCardLogin()
const { show } = useToast()

const mode = ref<'start' | 'card' | 'email' | 'admin'>('start')
const busy = ref(false)
const email = ref('')
const password = ref('')
const mailSent = ref(false)
const cardError = ref('')

async function onCardScanned(raw: string) {
  if (busy.value) return
  const parsed = parseScan(raw)
  if (parsed.type !== 'card') {
    cardError.value = 'Dit is geen ledenpas. Scan de QR-code op je Robin-pas.'
    return
  }
  busy.value = true
  cardError.value = ''
  try {
    const name = await loginWithCard(parsed.code)
    if (name) {
      show(`Welkom, ${name}!`, 'ok')
      await navigateTo(redirectAfterLogin())
    }
  }
  catch {
    cardError.value = 'Met deze pas kunnen we je niet inloggen. Vraag een medewerker om hulp.'
  }
  finally {
    busy.value = false
  }
}

async function sendMagicLink() {
  if (!email.value.trim()) return
  busy.value = true
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim(),
    options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/confirm` },
  })
  busy.value = false
  if (error) {
    show('Met dit e-mailadres kunnen we je niet inloggen. Is het bekend bij Robin?', 'error')
    return
  }
  mailSent.value = true
}

async function adminLogin() {
  busy.value = true
  const { error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
  busy.value = false
  if (error) {
    show('E-mailadres of wachtwoord klopt niet.', 'error')
    return
  }
  const target = redirectAfterLogin()
  await navigateTo(target === '/' ? '/robinadmin' : target)
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <h1 class="mt-4 text-6xl">Welkom bij Robin</h1>
    <p class="mt-2 text-xl">De super fijne markt. Log in om je boodschappen te scannen.</p>

    <div v-if="mode === 'start'" class="mt-8 space-y-3">
      <button type="button" class="btn-primary anim-rise w-full !justify-start !gap-4 !rounded-3xl !px-5 !py-5 !text-xl" @click="mode = 'card'">
        <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-beige text-groen"><RIcon name="card" class="h-9 w-9" /></span>
        <span class="text-left">Scan je ledenpas</span>
        <RIcon name="arrow-right" class="ml-auto h-7 w-7" />
      </button>
      <button type="button" class="btn-outline anim-rise w-full !gap-3" style="animation-delay: 80ms" @click="mode = 'email'">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></svg>
        Inloggen met e-mail
      </button>
    </div>

    <div v-else-if="mode === 'card'" class="mt-6 space-y-4">
      <QrScanner hint="Houd de QR-code van je ledenpas voor de camera" target="card" @detected="onCardScanned" />
      <p v-if="cardError" class="rounded-2xl bg-koraal px-4 py-3 text-white" role="alert">{{ cardError }}</p>
      <p v-if="busy" class="text-center text-lg">Even inloggen…</p>
      <button type="button" class="btn-ghost w-full" @click="mode = 'start'">Terug</button>
    </div>

    <div v-else-if="mode === 'email'" class="mt-6">
      <div v-if="mailSent" class="card">
        <p class="font-display text-3xl">Check je mail</p>
        <p class="mt-2 text-lg">We hebben een inloglink gestuurd naar <strong>{{ email }}</strong>. Open die link op deze telefoon.</p>
      </div>
      <form v-else class="space-y-4" @submit.prevent="sendMagicLink">
        <div>
          <label class="label" for="email">Je e-mailadres</label>
          <input id="email" v-model="email" class="input" type="email" autocomplete="email" inputmode="email" required>
        </div>
        <button type="submit" class="btn-primary w-full" :disabled="busy">Stuur inloglink</button>
      </form>
      <button type="button" class="btn-ghost mt-3 w-full" @click="mode = 'start'; mailSent = false">Terug</button>
    </div>

    <div v-else class="mt-6">
      <form class="space-y-4" @submit.prevent="adminLogin">
        <div>
          <label class="label" for="admin-email">E-mailadres</label>
          <input id="admin-email" v-model="email" class="input" type="email" autocomplete="username" required>
        </div>
        <div>
          <label class="label" for="admin-password">Wachtwoord</label>
          <input id="admin-password" v-model="password" class="input" type="password" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn-primary w-full" :disabled="busy">Inloggen</button>
      </form>
      <button type="button" class="btn-ghost mt-3 w-full" @click="mode = 'start'">Terug</button>
    </div>

    <div class="mt-auto pt-10 text-center">
      <button v-if="mode !== 'admin'" type="button" class="text-sm underline underline-offset-4" @click="mode = 'admin'">
        Inloggen als beheerder
      </button>
    </div>
  </div>
</template>
