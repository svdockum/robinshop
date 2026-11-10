import type { Balance } from './useOverview'
import type { IconName } from '~/components/RIcon.vue'
import { parseScan } from '~/utils/scanCode'
import { createScanGate } from '~/utils/scanGate'
import { feedbackError, feedbackSuccess } from '~/utils/feedback'

export interface ScannedProduct {
  id: string
  code: string
  name: string
  portion: string
  points: number
  image_url: string | null
  category: string | null
}

export type ScanResult =
  | { kind: 'scanned', product: ScannedProduct, balance: Balance, scanId: string, advanceUsed: boolean }
  | { kind: 'insufficient', product: ScannedProduct, balance: Balance, canAdvance: boolean, advanceAmount: number }
  | { kind: 'error', title: string, message: string, icon: IconName, action?: 'checkin', next?: IconName[] }
  | { kind: 'checked-in', householdName: string, already: boolean }
  | { kind: 'checked-out', householdName: string, items: number, points: number, balance?: Balance }
  | { kind: 'logged-in', householdName: string }

export interface ScanState {
  status: 'idle' | 'busy' | 'result'
  result?: ScanResult
  /** Telt per getoond resultaat, zodat elke scan opnieuw binnenkomt. */
  seq?: number
}

/** `icon` zegt wat er mis is, `next` laat in beeld zien wat je nu kunt doen. */
const ERRORS: Record<string, { title: string, message: string, icon: IconName, action?: 'checkin', next?: IconName[] }> = {
  NO_VISIT: { title: 'Eerst naar de ingang', message: 'Scan eerst de QR-code bij de ingang.', icon: 'gate', action: 'checkin', next: ['phone-scan', 'gate'] },
  MAX: { title: 'Genoeg van dit product', message: 'Je hebt al het maximum van dit product voor dit bezoek.', icon: 'stack', next: ['hand-back'] },
  UNKNOWN_PRODUCT: { title: 'Onbekend product', message: 'Dit product kennen we niet. Vraag het even aan een medewerker.', icon: 'question', next: ['staff'] },
  EXPIRED_CODE: { title: 'Code verlopen', message: 'Scan de code op het scherm opnieuw.', icon: 'clock', next: ['refresh', 'phone-scan'] },
  UNKNOWN_POINT: { title: 'Onbekende code', message: 'Deze code hoort niet bij een ingang of kassa van Robin.', icon: 'qr' },
  NOT_MEMBER: { title: 'Geen huishouden', message: 'Log in met je ledenpas.', icon: 'card' },
  UNKNOWN_CODE: { title: 'Onbekende code', message: 'Deze code hoort niet bij Robin.', icon: 'qr' },
  NETWORK: { title: 'Geen verbinding', message: 'Controleer je internet en probeer het opnieuw.', icon: 'wifi-off', next: ['refresh'] },
}

function errorResult(code: string, extra?: Partial<Record<'message', string>>): ScanResult {
  const e = ERRORS[code] ?? ERRORS.NETWORK!
  return { kind: 'error', title: e.title, message: extra?.message ?? e.message, icon: e.icon, action: e.action, next: e.next }
}

/** Gedeelde scanlogica voor de scanpagina en de deep links (/p, /in, /uit, /pas). */
export function useScanFlow() {
  const supabase = useSupabaseClient()
  const { refresh, setBalance } = useOverview()
  const { loginWithCard } = useCardLogin()
  const state = useState<ScanState>('scan-state', () => ({ status: 'idle' }))
  const gate = createScanGate(2500)

  function show(result: ScanResult) {
    state.value = { status: 'result', result, seq: (state.value.seq ?? 0) + 1 }
    if (result.kind === 'error' || result.kind === 'insufficient') feedbackError()
    else feedbackSuccess()
  }

  async function registerProduct(code: string, useAdvance = false) {
    const { data, error } = await supabase.rpc('register_scan', { p_code: code, p_use_advance: useAdvance })
    if (error || !data) return show(errorResult('NETWORK'))
    const r = data as Record<string, any>
    if (r.ok) {
      setBalance(r.balance)
      show({ kind: 'scanned', product: r.product, balance: r.balance, scanId: r.scan_id, advanceUsed: !!r.advance_used })
      refresh().catch(() => {})
      return
    }
    switch (r.error) {
      case 'INSUFFICIENT':
        return show({ kind: 'insufficient', product: r.product, balance: r.balance, canAdvance: !!r.can_advance, advanceAmount: r.advance_amount })
      case 'MAX_REACHED':
        return show(errorResult('MAX', { message: `Je hebt al het maximum van ${r.product.name} (max. ${r.max} per bezoek).` }))
      default:
        return show(errorResult(r.error))
    }
  }

  async function checkIn(slug: string, token: string) {
    try {
      const r = await $fetch<{ ok: boolean, error?: string, already?: boolean, householdName?: string }>('/api/visit/check-in', {
        method: 'POST', body: { slug, t: token },
      })
      if (!r.ok) return show(errorResult(r.error ?? 'NETWORK'))
      await refresh().catch(() => {})
      show({ kind: 'checked-in', householdName: r.householdName ?? '', already: !!r.already })
    }
    catch {
      show(errorResult('NETWORK'))
    }
  }

  async function checkOut(slug: string, token: string) {
    try {
      const r = await $fetch<{ ok: boolean, error?: string, householdName?: string, items?: number, points?: number, balance?: Balance }>('/api/visit/check-out', {
        method: 'POST', body: { slug, t: token },
      })
      if (!r.ok) {
        if (r.error === 'NO_VISIT') {
          return show({ kind: 'error', title: 'Geen open bezoek', message: 'Je was nog niet ingecheckt, of je bezoek is al afgerond.', icon: 'gate' })
        }
        return show(errorResult(r.error ?? 'NETWORK'))
      }
      await refresh().catch(() => {})
      show({ kind: 'checked-out', householdName: r.householdName ?? '', items: r.items ?? 0, points: r.points ?? 0, balance: r.balance })
    }
    catch {
      show(errorResult('NETWORK'))
    }
  }

  async function cardLogin(code: string) {
    try {
      const name = await loginWithCard(code)
      if (!name) {
        state.value = { status: 'idle' }
        return
      }
      await refresh().catch(() => {})
      show({ kind: 'logged-in', householdName: name })
    }
    catch {
      show({ kind: 'error', title: 'Pas niet herkend', message: 'Vraag een medewerker om hulp.', icon: 'card', next: ['staff'] })
    }
  }

  /** Verwerk een gescande code. `force` slaat de dubbele-scan-poort over (deep links, "nog één"). */
  async function handleRaw(raw: string, force = false) {
    const pass = gate(raw)
    if (!force && !pass) return
    if (state.value.status === 'busy') return

    const parsed = parseScan(raw)
    state.value = { ...state.value, status: 'busy' }
    try {
      switch (parsed.type) {
        case 'product': return await registerProduct(parsed.code)
        case 'checkin': return await checkIn(parsed.slug, parsed.token)
        case 'checkout': return await checkOut(parsed.slug, parsed.token)
        case 'card': return await cardLogin(parsed.code)
        default: return show(errorResult('UNKNOWN_CODE'))
      }
    }
    finally {
      if (state.value.status === 'busy') state.value = { status: 'idle' }
    }
  }

  /** "Gebruik mijn budget van volgende maand" na een te-weinig-melding. */
  async function useAdvance() {
    const r = state.value.result
    if (r?.kind !== 'insufficient') return
    state.value = { ...state.value, status: 'busy' }
    await registerProduct(r.product.code, true)
  }

  /** Nog één van hetzelfde product. */
  async function addAnother() {
    const r = state.value.result
    if (r?.kind !== 'scanned') return
    state.value = { ...state.value, status: 'busy' }
    await registerProduct(r.product.code)
  }

  async function removeScan(scanId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('remove_scan', { p_scan_id: scanId })
    const r = data as Record<string, any> | null
    if (error || !r?.ok) {
      useToast().show(r?.error === 'VISIT_CLOSED' ? 'Dit bezoek is al afgerond.' : 'Terugleggen lukt nu niet.', 'error', 3500, ['hand-back', 'cross'])
      return false
    }
    setBalance(r.balance)
    await refresh().catch(() => {})
    if (state.value.result?.kind === 'scanned' && state.value.result.scanId === scanId) reset()
    return true
  }

  function reset() {
    state.value = { status: 'idle' }
  }

  return { state, handleRaw, useAdvance, addAnother, removeScan, reset }
}
