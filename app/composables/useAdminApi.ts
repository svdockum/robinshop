const KEY = 'robin-admin-key'

/**
 * Aanroepen naar /api/robinadmin. Het beheer staat voorlopig open; als op de server
 * NUXT_ADMIN_PASSWORD is gezet, vraagt de layout één keer om het wachtwoord.
 */
export function useAdminApi() {
  const needsPassword = useState('admin-needs-password', () => false)

  function storedKey(): string {
    try {
      return localStorage.getItem(KEY) ?? ''
    }
    catch {
      return ''
    }
  }

  function setKey(value: string) {
    try {
      localStorage.setItem(KEY, value)
    }
    catch {
      // Geen opslag beschikbaar: dan alleen deze sessie.
    }
    needsPassword.value = false
  }

  async function api<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    try {
      return await $fetch<T>(url, {
        ...options,
        headers: { ...(options.headers as Record<string, string> | undefined), 'x-robin-admin': storedKey() },
      } as Parameters<typeof $fetch>[1]) as T
    }
    catch (e: unknown) {
      if ((e as { statusCode?: number }).statusCode === 401) needsPassword.value = true
      throw e
    }
  }

  return { api, needsPassword, setKey }
}

/** Leesbare foutmelding uit een $fetch-fout. */
export function errorMessage(e: unknown, fallback = 'Er ging iets mis'): string {
  const err = e as { data?: { statusMessage?: string, message?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.data?.message || err?.statusMessage || fallback
}

/** Basis-URL voor geprinte QR-codes. */
export function useSiteBase() {
  const configured = useRuntimeConfig().public.siteUrl as string
  return computed(() => (configured || (import.meta.client ? window.location.origin : '')).replace(/\/+$/, ''))
}

/** PDF openen in een nieuw tabblad (en anders downloaden). */
export function openPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
