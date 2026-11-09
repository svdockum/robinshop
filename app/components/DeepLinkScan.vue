<script setup lang="ts">
/** Verwerkt een QR-code die met de gewone camera-app is gescand (/p, /in, /uit). */
const props = defineProps<{ raw: string }>()

const { state, handleRaw, useAdvance, addAnother, removeScan } = useScanFlow()
const { ask } = useConfirm()

const route = useRoute()
const router = useRouter()
const alreadyDone = ref(false)

onMounted(async () => {
  // Terugknop, herladen of een heropend tabblad mag niet nog een keer registreren:
  // na verwerking krijgt deze pagina-URL de vlag ?verwerkt=1.
  if (new URL(window.location.href).searchParams.has('verwerkt')) {
    alreadyDone.value = true
    return
  }
  await router.replace({ query: { ...route.query, verwerkt: '1' } })
  await handleRaw(props.raw, true)
})

async function onUndo(scanId: string) {
  const ok = await ask({ title: 'Product teruggelegd?', confirmLabel: 'Ja, teruggelegd', cancelLabel: 'Nee' })
  if (ok && await removeScan(scanId)) useToast().show('Teruggelegd.', 'ok')
}
</script>

<template>
  <div class="space-y-4 pt-2">
    <ScanResultSheet
      v-if="state.result && state.status !== 'idle'"
      :result="state.result"
      :busy="state.status === 'busy'"
      @close="navigateTo('/scan')"
      @advance="useAdvance"
      @another="addAnother"
      @undo="onUndo"
    />
    <p v-else-if="alreadyDone" class="card text-lg">Deze code is al verwerkt. Nog één nodig? Scan opnieuw met de scanner.</p>
    <p v-else class="py-16 text-center text-xl">Even verwerken…</p>
    <NuxtLink v-if="!(state.result && state.status !== 'idle') || state.result.kind === 'scanned'" to="/scan" class="btn-primary w-full">Naar de scanner</NuxtLink>
  </div>
</template>
