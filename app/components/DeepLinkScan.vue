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
  const r = state.value.result
  const ok = await ask({
    title: 'Product teruggelegd?',
    body: 'De punten komen weer terug op je saldo.',
    confirmLabel: 'Ja, teruggelegd',
    cancelLabel: 'Nee',
    thumb: r?.kind === 'scanned' ? { name: r.product.name, imageUrl: r.product.image_url } : undefined,
    icons: ['hand-back'],
    confirmIcons: ['hand-back', 'check'],
    cancelIcons: ['basket'],
  })
  if (ok && await removeScan(scanId)) useToast().show('Teruggelegd.', 'ok', 3500, ['hand-back', 'check'])
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
    <!-- Deze code telde al mee -->
    <div v-else-if="alreadyDone" class="card flex items-center gap-4">
      <span class="flex h-14 shrink-0 items-center gap-1 rounded-2xl bg-groen px-3 text-beige">
        <RIcon name="qr" class="h-8 w-8" /><RIcon name="check" class="h-7 w-7" />
      </span>
      <InfoTip class="ml-auto" text="Deze code is al verwerkt. Nog één nodig? Scan opnieuw met de scanner." />
    </div>
    <div v-else class="flex justify-center py-16" role="status">
      <RIcon name="scan" class="anim-breathe h-16 w-16" />
      <span class="sr-only">Even verwerken…</span>
    </div>
    <NuxtLink
      v-if="!(state.result && state.status !== 'idle') || state.result.kind === 'scanned'"
      to="/scan"
      class="btn-primary w-full"
      aria-label="Naar de scanner"
    >
      <RIcon name="scan" class="h-8 w-8" /><RIcon name="arrow-right" class="h-6 w-6" />
    </NuxtLink>
  </div>
</template>
